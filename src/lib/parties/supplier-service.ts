import { db } from "@/db";
import {
  suppliers,
  supplierTransactions,
  purchases,
  purchaseItems,
  products,
  inventoryMovements,
  payments,
  financialTransactions,
  auditLogs,
} from "@/db/schema";
import { eq, and, desc, sql, asc, inArray } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError } from "@/lib/security/errors";
import {
  createPartySchema,
  updatePartySchema,
  recordPurchaseSchema,
  recordSupplierPaymentSchema,
} from "./validation";
import { z } from "zod";

export class SupplierService {
  private static generatePurchaseReference(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PO-${dateStr}-${randomSuffix}`;
  }

  /**
   * Lists suppliers with their current total payable obligation balance
   */
  static async listSuppliers(ctx: TenantContext) {
    requirePermission(ctx, "suppliers.view");

    return db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        phone: suppliers.phone,
        email: suppliers.email,
        address: suppliers.address,
        notes: suppliers.notes,
        status: suppliers.status,
        totalCredit: sql<string>`COALESCE(SUM(${supplierTransactions.credit}), 0)`,
        totalDebit: sql<string>`COALESCE(SUM(${supplierTransactions.debit}), 0)`,
        currentObligation: sql<string>`COALESCE(SUM(${supplierTransactions.credit}), 0) - COALESCE(SUM(${supplierTransactions.debit}), 0)`,
      })
      .from(suppliers)
      .leftJoin(supplierTransactions, eq(suppliers.id, supplierTransactions.supplierId))
      .where(eq(suppliers.businessId, ctx.businessId))
      .groupBy(suppliers.id)
      .orderBy(asc(suppliers.name));
  }

  static async getSupplierById(ctx: TenantContext, supplierId: string) {
    requirePermission(ctx, "suppliers.view");

    const [supplier] = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        phone: suppliers.phone,
        email: suppliers.email,
        address: suppliers.address,
        notes: suppliers.notes,
        status: suppliers.status,
        totalCredit: sql<string>`COALESCE(SUM(${supplierTransactions.credit}), 0)`,
        totalDebit: sql<string>`COALESCE(SUM(${supplierTransactions.debit}), 0)`,
        currentObligation: sql<string>`COALESCE(SUM(${supplierTransactions.credit}), 0) - COALESCE(SUM(${supplierTransactions.debit}), 0)`,
      })
      .from(suppliers)
      .leftJoin(supplierTransactions, eq(suppliers.id, supplierTransactions.supplierId))
      .where(
        and(
          eq(suppliers.id, supplierId),
          eq(suppliers.businessId, ctx.businessId)
        )
      )
      .groupBy(suppliers.id);

    if (!supplier) {
      throw new NotFoundError("Supplier");
    }

    return supplier;
  }

  static async createSupplier(ctx: TenantContext, input: z.infer<typeof createPartySchema>) {
    requirePermission(ctx, "suppliers.manage");
    const validated = createPartySchema.parse(input);

    const [supplier] = await db
      .insert(suppliers)
      .values({
        businessId: ctx.businessId,
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
        address: validated.address,
        notes: validated.notes,
        status: "active",
      })
      .returning();

    return supplier;
  }

  static async updateSupplier(ctx: TenantContext, supplierId: string, input: z.infer<typeof updatePartySchema>) {
    requirePermission(ctx, "suppliers.manage");
    const validated = updatePartySchema.parse(input);

    const [updated] = await db
      .update(suppliers)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(suppliers.id, supplierId),
          eq(suppliers.businessId, ctx.businessId)
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundError("Supplier");
    }

    return updated;
  }

  /**
   * Records incoming stock purchase from supplier with automatic inventory increase, cost updates, and payables ledger tracking
   */
  static async recordPurchase(ctx: TenantContext, input: z.infer<typeof recordPurchaseSchema>) {
    requirePermission(ctx, "inventory.receive");
    const validated = recordPurchaseSchema.parse(input);

    return db.transaction(async (tx) => {
      // 1. If supplierId given, verify supplier
      let supplierName = "General Supplier";
      if (validated.supplierId) {
        const [supplier] = await tx
          .select()
          .from(suppliers)
          .where(
            and(
              eq(suppliers.id, validated.supplierId),
              eq(suppliers.businessId, ctx.businessId)
            )
          );

        if (!supplier) {
          throw new NotFoundError("Supplier");
        }
        supplierName = supplier.name;
      }

      // 2. Fetch products
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

      let computedSubtotal = 0;
      const itemInserts = [];

      for (const item of validated.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundError(`Product ID ${item.productId}`);
        }

        const lineTotal = item.quantity * item.unitCost;
        computedSubtotal += lineTotal;

        itemInserts.push({
          productId: product.id,
          quantity: item.quantity,
          unitCost: item.unitCost.toString(),
          total: lineTotal.toString(),
          product,
        });
      }

      const discount = validated.discount || 0;
      const finalTotal = Math.max(0, computedSubtotal - discount);
      const paidAmount = validated.paidAmount || 0;
      const unpaidBalance = Math.max(0, finalTotal - paidAmount);

      const referenceNumber = validated.referenceNumber || this.generatePurchaseReference();
      const paymentStatus = unpaidBalance === 0 ? "completed" : paidAmount > 0 ? "pending" : "pending";

      // 3. Insert Purchase
      const [purchase] = await tx
        .insert(purchases)
        .values({
          businessId: ctx.businessId,
          supplierId: validated.supplierId,
          referenceNumber,
          status: "received",
          subtotal: computedSubtotal.toString(),
          discount: discount.toString(),
          total: finalTotal.toString(),
          paymentStatus,
          createdBy: ctx.userId,
        })
        .returning();

      // 4. Insert Purchase Items & Inflow Inventory Movements
      for (const item of itemInserts) {
        await tx.insert(purchaseItems).values({
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: item.total,
        });

        // Inflow movement
        await tx.insert(inventoryMovements).values({
          businessId: ctx.businessId,
          productId: item.productId,
          movementType: "received",
          quantity: item.quantity, // Positive for inflow
          unitCost: item.unitCost,
          referenceType: "purchase",
          referenceId: purchase.id,
          reason: `Stock received under ${referenceNumber}`,
          createdBy: ctx.userId,
        });

        // Update product stock and update cost price
        await tx
          .update(products)
          .set({
            currentStock: item.product.currentStock + item.quantity,
            costPrice: item.unitCost, // Update latest purchase cost
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      // 5. If supplier specified, record in Supplier Ledger
      if (validated.supplierId) {
        // Credit increases what business owes supplier
        await tx.insert(supplierTransactions).values({
          businessId: ctx.businessId,
          supplierId: validated.supplierId,
          transactionType: "credit_purchase",
          referenceType: "purchase",
          referenceId: purchase.id,
          debit: "0",
          credit: finalTotal.toString(),
          description: `Purchase order ${referenceNumber}`,
          createdBy: ctx.userId,
        });

        // If immediate payment made
        if (paidAmount > 0 && validated.paymentMethod) {
          const accountType = validated.paymentMethod === "bank_transfer" ? "bank" : validated.paymentMethod === "card" ? "card" : "cash";

          // Debit reduces what business owes supplier
          await tx.insert(supplierTransactions).values({
            businessId: ctx.businessId,
            supplierId: validated.supplierId,
            transactionType: "payment",
            referenceType: "purchase_payment",
            referenceId: purchase.id,
            debit: paidAmount.toString(),
            credit: "0",
            description: `Payment for purchase ${referenceNumber} (${validated.paymentMethod})`,
            createdBy: ctx.userId,
          });

          // Record payment record
          await tx.insert(payments).values({
            businessId: ctx.businessId,
            paymentMethod: validated.paymentMethod,
            amount: paidAmount.toString(),
            referenceType: "purchase",
            referenceId: purchase.id,
            status: "completed",
            receivedBy: ctx.userId,
          });

          // Record financial outflow transaction
          await tx.insert(financialTransactions).values({
            businessId: ctx.businessId,
            transactionType: "SUPPLIER_PAYMENT",
            referenceType: "purchase",
            referenceId: purchase.id,
            amount: paidAmount.toString(),
            direction: "out",
            accountType,
            description: `Payment for stock purchase from ${supplierName}`,
            createdBy: ctx.userId,
          });
        }
      }

      // 6. Audit Log
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "STOCK_RECEIVED",
        entityType: "purchase",
        entityId: purchase.id,
        newValues: {
          referenceNumber,
          total: finalTotal,
          itemCount: itemInserts.length,
          supplierId: validated.supplierId,
        },
      });

      return {
        purchase,
        total: finalTotal,
        paidAmount,
        unpaidBalance,
      };
    });
  }

  /**
   * Records an outgoing payment towards supplier obligation
   */
  static async recordSupplierPayment(ctx: TenantContext, input: z.infer<typeof recordSupplierPaymentSchema>) {
    requirePermission(ctx, "suppliers.record_payment");
    const validated = recordSupplierPaymentSchema.parse(input);

    return db.transaction(async (tx) => {
      const [supplier] = await tx
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.id, validated.supplierId),
            eq(suppliers.businessId, ctx.businessId)
          )
        );

      if (!supplier) {
        throw new NotFoundError("Supplier");
      }

      // 1. Insert Payment Record
      const [paymentRecord] = await tx
        .insert(payments)
        .values({
          businessId: ctx.businessId,
          paymentMethod: validated.paymentMethod,
          amount: validated.amount.toString(),
          referenceType: "supplier_obligation_settlement",
          referenceId: supplier.id,
          status: "completed",
          externalReference: validated.externalReference,
          receivedBy: ctx.userId,
        })
        .returning();

      // 2. Insert Supplier Transaction (Debit to reduce supplier balance)
      const [supplierTxn] = await tx
        .insert(supplierTransactions)
        .values({
          businessId: ctx.businessId,
          supplierId: supplier.id,
          transactionType: "payment",
          referenceType: "payment",
          referenceId: paymentRecord.id,
          debit: validated.amount.toString(),
          credit: "0",
          description: validated.description || `Obligation settlement to ${supplier.name}`,
          createdBy: ctx.userId,
        })
        .returning();

      // 3. Insert Financial Transaction (Cash / Bank Outflow)
      const accountType = validated.paymentMethod === "bank_transfer" ? "bank" : validated.paymentMethod === "card" ? "card" : "cash";

      await tx.insert(financialTransactions).values({
        businessId: ctx.businessId,
        transactionType: "SUPPLIER_PAYMENT",
        referenceType: "supplier_transaction",
        referenceId: supplierTxn.id,
        amount: validated.amount.toString(),
        direction: "out",
        accountType,
        description: `Supplier payment made to ${supplier.name} (${validated.paymentMethod})`,
        createdBy: ctx.userId,
      });

      // 4. Audit Log
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "SUPPLIER_PAYMENT_RECORDED",
        entityType: "supplier",
        entityId: supplier.id,
        newValues: {
          amount: validated.amount,
          paymentMethod: validated.paymentMethod,
          paymentId: paymentRecord.id,
        },
      });

      return {
        payment: paymentRecord,
        supplierTransaction: supplierTxn,
      };
    });
  }

  /**
   * Retrieves full statement of account / transaction ledger for a supplier
   */
  static async getSupplierLedger(ctx: TenantContext, supplierId: string) {
    requirePermission(ctx, "suppliers.view");

    return db
      .select()
      .from(supplierTransactions)
      .where(
        and(
          eq(supplierTransactions.businessId, ctx.businessId),
          eq(supplierTransactions.supplierId, supplierId)
        )
      )
      .orderBy(desc(supplierTransactions.createdAt));
  }
}
