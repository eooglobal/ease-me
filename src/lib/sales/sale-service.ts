import { db } from "@/db";
import {
  sales,
  saleItems,
  products,
  inventoryMovements,
  payments,
  financialTransactions,
  customerTransactions,
  customers,
  auditLogs,
  notifications,
} from "@/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/security/errors";
import { createSaleSchema, cancelOrVoidSaleSchema } from "./validation";
import { withIdempotency } from "@/lib/security/idempotency";
import { z } from "zod";

export class SaleService {
  /**
   * Generates a unique invoice number for the business (e.g. INV-20260927-0001)
   */
  private static generateInvoiceNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `INV-${dateStr}-${randomSuffix}`;
  }

  /**
   * Records a complete sale with all downstream accounting, inventory, payments, and audit effects
   */
  static async recordSale(ctx: TenantContext, input: z.infer<typeof createSaleSchema>) {
    requirePermission(ctx, "sales.create");
    const validated = createSaleSchema.parse(input);

    return withIdempotency(ctx.businessId, validated.idempotencyKey, async () => {
      return db.transaction(async (tx) => {
        // Check database for existing sale with this idempotencyKey
        if (validated.idempotencyKey) {
          const [existingSale] = await tx
            .select()
            .from(sales)
            .where(
              and(
                eq(sales.businessId, ctx.businessId),
                eq(sales.idempotencyKey, validated.idempotencyKey)
              )
            );
          if (existingSale) {
            return {
              sale: existingSale,
              items: [],
              payments: [],
              isIdempotentReplay: true,
            };
          }
        }

        // 1. Fetch products being sold and lock/verify stock
        const productIds = validated.items.map((i) => i.productId);
        const fetchedProducts = await tx
          .select()
          .from(products)
          .where(
            and(
              eq(products.businessId, ctx.businessId),
              inArray(products.id, productIds)
            )
          );

        const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

        // 2. Validate products and calculate line items
        let computedSubtotal = 0;
        const itemInserts: Array<{
          productId: string;
          quantity: number;
          unitPrice: string;
          unitCost: string;
          discount: string;
          total: string;
          product: (typeof fetchedProducts)[0];
        }> = [];

        for (const item of validated.items) {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new NotFoundError(`Product ID ${item.productId}`);
          }

          if (product.status !== "active") {
            throw new ValidationError(`Product '${product.name}' is inactive and cannot be sold.`);
          }

          if (product.trackInventory && product.currentStock < item.quantity) {
            throw new ValidationError(
              `Insufficient stock for '${product.name}'. Available: ${product.currentStock}, Requested: ${item.quantity}`
            );
          }

          const lineTotal = item.quantity * item.unitPrice - (item.discount || 0);
          if (lineTotal < 0) {
            throw new ValidationError(`Line total for '${product.name}' cannot be negative.`);
          }

          computedSubtotal += lineTotal;

          itemInserts.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            unitCost: product.costPrice, // Historical cost at exact moment of sale
            discount: (item.discount || 0).toString(),
            total: lineTotal.toString(),
            product,
          });
        }

        const overallDiscount = validated.discount || 0;
        const overallTax = validated.tax || 0;
        const finalTotal = Math.max(0, computedSubtotal - overallDiscount + overallTax);

        // 3. Validate payment amounts
        const totalPaid = validated.payments.reduce((sum, p) => sum + p.amount, 0);

        if (validated.isCreditSale) {
          if (!validated.customerId) {
            throw new ValidationError("A valid customer must be selected for credit sales.");
          }

          // Verify customer exists
          const [customer] = await tx
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.id, validated.customerId),
                eq(customers.businessId, ctx.businessId)
              )
            );

          if (!customer) {
            throw new NotFoundError("Customer");
          }

          if (totalPaid > finalTotal) {
            throw new ValidationError("Payments cannot exceed the total sale amount.");
          }
        } else {
          // Standard cash/digital sale: payment total must cover sale total
          if (Math.abs(totalPaid - finalTotal) > 0.01) {
            throw new ValidationError(
              `Total payment received (₦${totalPaid.toFixed(2)}) does not match sale total (₦${finalTotal.toFixed(2)}).`
            );
          }
        }

        const unpaidCreditBalance = validated.isCreditSale ? finalTotal - totalPaid : 0;
        const paymentStatus = unpaidCreditBalance === 0 ? "completed" : totalPaid > 0 ? "pending" : "pending";

        // 4. Create Sale Record
        const invoiceNumber = this.generateInvoiceNumber();
        const [sale] = await tx
          .insert(sales)
          .values({
            businessId: ctx.businessId,
            customerId: validated.customerId,
            invoiceNumber,
            status: "completed",
            subtotal: computedSubtotal.toString(),
            discount: overallDiscount.toString(),
            tax: overallTax.toString(),
            total: finalTotal.toString(),
            paymentStatus,
            idempotencyKey: validated.idempotencyKey || null,
            soldBy: ctx.userId,
          })
          .returning();

        // 5. Create Sale Items, Inventory Movements, and decrement Stock
        for (const item of itemInserts) {
          await tx.insert(saleItems).values({
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            discount: item.discount,
            total: item.total,
          });

          if (item.product.trackInventory) {
            // Movement ledger entry
            await tx.insert(inventoryMovements).values({
              businessId: ctx.businessId,
              productId: item.productId,
              movementType: "sold",
              quantity: -item.quantity, // Negative for outflow
              unitCost: item.unitCost,
              referenceType: "sale",
              referenceId: sale.id,
              reason: `Sale ${invoiceNumber}`,
              createdBy: ctx.userId,
            });

            // Atomic currentStock decrement
            const newStock = item.product.currentStock - item.quantity;
            await tx
              .update(products)
              .set({
                currentStock: newStock,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));

            // Check low stock
            if (newStock <= item.product.minimumStockLevel) {
              await tx.insert(notifications).values({
                businessId: ctx.businessId,
                userId: ctx.userId,
                type: "low_stock",
                title: `Low Stock: ${item.product.name}`,
                message: `Product '${item.product.name}' is low (${newStock} remaining).`,
                entityType: "product",
                entityId: item.productId,
              });
            }
          }
        }

        // 6. Record Payments & Financial Inflow Transactions
        for (const payment of validated.payments) {
          const [paymentRecord] = await tx
            .insert(payments)
            .values({
              businessId: ctx.businessId,
              paymentMethod: payment.paymentMethod,
              amount: payment.amount.toString(),
              referenceType: "sale",
              referenceId: sale.id,
              status: "completed",
              externalReference: payment.externalReference,
              receivedBy: ctx.userId,
            })
            .returning();

          const accountType = payment.paymentMethod === "bank_transfer" ? "bank" : payment.paymentMethod === "card" ? "card" : "cash";

          // Financial transaction entry
          await tx.insert(financialTransactions).values({
            businessId: ctx.businessId,
            transactionType: "SALE",
            referenceType: "sale",
            referenceId: sale.id,
            amount: payment.amount.toString(),
            direction: "in",
            accountType,
            description: `Payment for Sale ${invoiceNumber} (${payment.paymentMethod})`,
            createdBy: ctx.userId,
          });
        }

        // 7. If credit sale with unpaid balance, record in customer ledger
        if (validated.isCreditSale && unpaidCreditBalance > 0 && validated.customerId) {
          await tx.insert(customerTransactions).values({
            businessId: ctx.businessId,
            customerId: validated.customerId,
            transactionType: "credit_sale",
            referenceType: "sale",
            referenceId: sale.id,
            debit: unpaidCreditBalance.toString(), // Customer owes this amount
            credit: "0",
            description: `Credit sale ${invoiceNumber} balance`,
            createdBy: ctx.userId,
          });

          // Post financial receivable transaction
          await tx.insert(financialTransactions).values({
            businessId: ctx.businessId,
            transactionType: "SALE_RECEIVABLE",
            referenceType: "sale",
            referenceId: sale.id,
            amount: unpaidCreditBalance.toString(),
            direction: "in",
            accountType: "receivable",
            description: `Receivable from Credit Sale ${invoiceNumber}`,
            createdBy: ctx.userId,
          });
        }

        // 8. Create immutable audit log entry
        await tx.insert(auditLogs).values({
          businessId: ctx.businessId,
          userId: ctx.userId,
          action: "SALE_CREATED",
          entityType: "sale",
          entityId: sale.id,
          newValues: {
            invoiceNumber,
            total: finalTotal,
            paid: totalPaid,
            isCreditSale: validated.isCreditSale,
            itemCount: itemInserts.length,
          },
          metadata: {
            customerId: validated.customerId,
            payments: validated.payments,
          },
        });

        return {
          sale,
          items: itemInserts,
          total: finalTotal,
          paid: totalPaid,
          unpaidCreditBalance,
        };
      });
    });
  }

  /**
   * Voids or cancels an existing sale, reversing inventory and financial ledger entries
   */
  static async voidOrCancelSale(ctx: TenantContext, input: z.infer<typeof cancelOrVoidSaleSchema>) {
    requirePermission(ctx, "sales.cancel");
    const validated = cancelOrVoidSaleSchema.parse(input);

    return db.transaction(async (tx) => {
      const [sale] = await tx
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.id, validated.saleId),
            eq(sales.businessId, ctx.businessId)
          )
        );

      if (!sale) {
        throw new NotFoundError("Sale");
      }

      if (sale.status === "cancelled" || sale.status === "voided") {
        throw new ValidationError(`Sale is already marked as ${sale.status}.`);
      }

      // 1. Fetch sale items to reverse inventory
      const items = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, sale.id));

      for (const item of items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (product && product.trackInventory) {
          // Reversing movement (returned)
          await tx.insert(inventoryMovements).values({
            businessId: ctx.businessId,
            productId: item.productId,
            movementType: "returned",
            quantity: item.quantity, // Positive to restore stock
            unitCost: item.unitCost,
            referenceType: "sale_void",
            referenceId: sale.id,
            reason: `Void of sale ${sale.invoiceNumber}: ${validated.reason}`,
            createdBy: ctx.userId,
          });

          // Restore product cached stock
          await tx
            .update(products)
            .set({
              currentStock: product.currentStock + item.quantity,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }

      // 2. Fetch recorded payments to reverse financial transactions
      const recordedPayments = await tx
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.referenceType, "sale"),
            eq(payments.referenceId, sale.id)
          )
        );

      for (const payment of recordedPayments) {
        const accountType = payment.paymentMethod === "bank_transfer" ? "bank" : payment.paymentMethod === "card" ? "card" : "cash";

        await tx.insert(financialTransactions).values({
          businessId: ctx.businessId,
          transactionType: "SALE_VOID",
          referenceType: "sale",
          referenceId: sale.id,
          amount: payment.amount,
          direction: "out", // Outflow reversing previous inflow
          accountType,
          description: `Reversal of payment for voided sale ${sale.invoiceNumber}`,
          createdBy: ctx.userId,
        });
      }

      // 3. If credit sale, reverse customer transaction
      if (sale.customerId) {
        const customerTxns = await tx
          .select()
          .from(customerTransactions)
          .where(
            and(
              eq(customerTransactions.referenceType, "sale"),
              eq(customerTransactions.referenceId, sale.id)
            )
          );

        for (const ctxn of customerTxns) {
          await tx.insert(customerTransactions).values({
            businessId: ctx.businessId,
            customerId: sale.customerId,
            transactionType: "refund",
            referenceType: "sale_void",
            referenceId: sale.id,
            debit: "0",
            credit: ctxn.debit, // Credit balances out original debit
            description: `Void reversal for sale ${sale.invoiceNumber}`,
            createdBy: ctx.userId,
          });
        }
      }

      // 4. Update sale status to voided
      const [updatedSale] = await tx
        .update(sales)
        .set({
          status: "voided",
          paymentStatus: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(sales.id, sale.id))
        .returning();

      // 5. Append audit log
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "SALE_VOIDED",
        entityType: "sale",
        entityId: sale.id,
        oldValues: { status: sale.status },
        newValues: { status: "voided", reason: validated.reason },
      });

      return updatedSale;
    });
  }

  /**
   * Retrieves sale listing with filtering
   */
  static async listSales(
    ctx: TenantContext,
    filters?: {
      customerId?: string;
      soldBy?: string;
      status?: "completed" | "cancelled" | "voided";
      limit?: number;
    }
  ) {
    requirePermission(ctx, "sales.view");

    return db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        status: sales.status,
        subtotal: sales.subtotal,
        discount: sales.discount,
        tax: sales.tax,
        total: sales.total,
        paymentStatus: sales.paymentStatus,
        customerId: sales.customerId,
        customerName: customers.name,
        soldBy: sales.soldBy,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(
        and(
          eq(sales.businessId, ctx.businessId),
          filters?.customerId ? eq(sales.customerId, filters.customerId) : undefined,
          filters?.soldBy ? eq(sales.soldBy, filters.soldBy) : undefined,
          filters?.status ? eq(sales.status, filters.status) : undefined
        )
      )
      .orderBy(desc(sales.createdAt))
      .limit(filters?.limit || 50);
  }
}
