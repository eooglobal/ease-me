import { db } from "@/db";
import {
  purchases,
  purchaseItems,
  products,
  suppliers,
  inventoryMovements,
  supplierTransactions,
  productBatches,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError } from "@/lib/security/errors";
import { AuditLogService } from "@/lib/audit/audit-service";
import { PurchaseCalc, PurchaseOrderItemInput } from "./purchase-calc";

export interface CreatePurchaseOrderInput {
  supplierId: string;
  referenceNumber?: string;
  items: PurchaseOrderItemInput[];
  freightCharge?: number;
  otherFees?: number;
  notes?: string;
  status?: "draft" | "ordered";
}

export interface ReceiveGoodsItemInput {
  purchaseItemId: string;
  productId: string;
  quantityReceived: number;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface ReceiveGoodsIntakeInput {
  purchaseId: string;
  items: ReceiveGoodsItemInput[];
  notes?: string;
}

export class PurchaseService {
  public static generatePurchaseReference(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PO-${dateStr}-${randomSuffix}`;
  }

  /**
   * Section 6.1: Order Builder — creates a new purchase order with landed cost distribution
   */
  public static async createPurchaseOrder(
    ctx: TenantContext,
    input: CreatePurchaseOrderInput
  ) {
    if (!input.items || input.items.length === 0) {
      throw new ValidationError("At least one product item is required for a purchase order.");
    }

    // Verify supplier
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, input.supplierId), eq(suppliers.businessId, ctx.businessId)));

    if (!supplier) {
      throw new NotFoundError("Supplier");
    }

    const freight = Number(input.freightCharge || 0);
    const fees = Number(input.otherFees || 0);
    const landedCalc = PurchaseCalc.distributeLandedCosts(input.items, freight, fees);

    const ref = input.referenceNumber?.trim() || this.generatePurchaseReference();
    const orderStatus = input.status || "ordered";

    return db.transaction(async (tx) => {
      const [order] = await tx
        .insert(purchases)
        .values({
          businessId: ctx.businessId,
          supplierId: supplier.id,
          referenceNumber: ref,
          status: orderStatus,
          subtotal: landedCalc.totalBaseValue.toFixed(2),
          freightCharge: freight.toFixed(2),
          otherFees: fees.toFixed(2),
          total: landedCalc.grandTotal.toFixed(2),
          paymentStatus: "pending",
          notes: input.notes,
          createdBy: ctx.userId,
        })
        .returning();

      for (const item of landedCalc.items) {
        await tx.insert(purchaseItems).values({
          purchaseId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          receivedQuantity: 0,
          unitCost: item.unitCost.toFixed(2),
          landedUnitCost: item.landedUnitCost.toFixed(2),
          total: item.landedTotal.toFixed(2),
        });
      }

      await AuditLogService.log({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "purchase_order.created",
        entityType: "purchase",
        entityId: order.id,
        metadata: {
          supplierName: supplier.name,
          referenceNumber: ref,
          total: landedCalc.grandTotal,
          itemCount: input.items.length,
          status: orderStatus,
        },
      });

      return order;
    });
  }

  /**
   * Section 6.1 & 7: Goods Intake Receiving Flow
   * Updates quantities received, recalculates WAC, writes intake movements, and creates batch lots
   */
  public static async receiveGoodsIntake(
    ctx: TenantContext,
    input: ReceiveGoodsIntakeInput
  ) {
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(purchases)
        .where(and(eq(purchases.id, input.purchaseId), eq(purchases.businessId, ctx.businessId)));

      if (!order) {
        throw new NotFoundError("Purchase order");
      }

      const existingItems = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, order.id));

      const existingMap = new Map(existingItems.map((i) => [i.id, i]));
      const productIds = input.items.map((i) => i.productId);

      const fetchedProducts = await tx
        .select()
        .from(products)
        .where(and(eq(products.businessId, ctx.businessId), inArray(products.id, productIds)));

      const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

      let totalReceivedValueThisDelivery = 0;

      for (const intake of input.items) {
        if (intake.quantityReceived <= 0) continue;

        const pItem = existingMap.get(intake.purchaseItemId);
        if (!pItem) {
          throw new NotFoundError(`Purchase item ${intake.purchaseItemId}`);
        }

        const prod = productMap.get(intake.productId);
        if (!prod) {
          throw new NotFoundError(`Product ${intake.productId}`);
        }

        const landedCost = pItem.landedUnitCost ? parseFloat(pItem.landedUnitCost) : parseFloat(pItem.unitCost);
        const newTotalReceived = pItem.receivedQuantity + intake.quantityReceived;

        // 1. Update purchase item received quantity
        await tx
          .update(purchaseItems)
          .set({ receivedQuantity: newTotalReceived })
          .where(eq(purchaseItems.id, pItem.id));

        // 2. Recalculate WAC on purchase intake
        const currentWAC = parseFloat(prod.costPrice);
        const newWAC = PurchaseCalc.recalculateWAC(
          prod.currentStock,
          currentWAC,
          intake.quantityReceived,
          landedCost
        );

        // 3. Update product current stock and landed WAC
        const updatedStock = prod.currentStock + intake.quantityReceived;
        await tx
          .update(products)
          .set({
            currentStock: updatedStock,
            costPrice: newWAC.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(products.id, prod.id));

        // 4. Record inventory intake movement
        await tx.insert(inventoryMovements).values({
          businessId: ctx.businessId,
          productId: prod.id,
          movementType: "received",
          quantity: intake.quantityReceived,
          unitCost: landedCost.toFixed(2),
          referenceType: "purchase",
          referenceId: order.id,
          reason: `Goods intake received against ${order.referenceNumber}`,
          createdBy: ctx.userId,
        });

        // 5. If batch tracking specified, create lot
        if (intake.batchNumber && intake.expiryDate) {
          await tx.insert(productBatches).values({
            businessId: ctx.businessId,
            productId: prod.id,
            batchNumber: intake.batchNumber,
            quantity: intake.quantityReceived,
            expiryDate: intake.expiryDate,
          });
        }

        totalReceivedValueThisDelivery += intake.quantityReceived * landedCost;
      }

      // Re-evaluate overall order status
      const updatedItems = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, order.id));

      const newStatus = PurchaseCalc.determineOrderStatus(
        updatedItems.map((i) => ({
          quantityOrdered: i.quantity,
          quantityReceived: i.receivedQuantity,
        }))
      );

      await tx
        .update(purchases)
        .set({ status: newStatus })
        .where(eq(purchases.id, order.id));

      // Record trade payable obligation to supplier ledger
      if (order.supplierId && totalReceivedValueThisDelivery > 0) {
        await tx.insert(supplierTransactions).values({
          businessId: ctx.businessId,
          supplierId: order.supplierId,
          transactionType: "credit_purchase",
          referenceType: "purchase",
          referenceId: order.id,
          debit: "0",
          credit: totalReceivedValueThisDelivery.toFixed(2),
          description: `Stock received against order ${order.referenceNumber}`,
          createdBy: ctx.userId,
        });
      }

      await AuditLogService.log({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "purchase_order.received",
        entityType: "purchase",
        entityId: order.id,
        metadata: {
          referenceNumber: order.referenceNumber,
          newStatus,
          intakeItemsCount: input.items.length,
          receivedValue: totalReceivedValueThisDelivery,
        },
      });

      return {
        orderId: order.id,
        status: newStatus,
        receivedValue: totalReceivedValueThisDelivery,
      };
    });
  }

  /**
   * Lists purchase orders with filters
   */
  public static async listPurchaseOrders(
    ctx: TenantContext,
    filters?: { supplierId?: string; status?: "draft" | "ordered" | "partial" | "received" }
  ) {
    const conditions = [eq(purchases.businessId, ctx.businessId)];

    if (filters?.supplierId) {
      conditions.push(eq(purchases.supplierId, filters.supplierId));
    }
    if (filters?.status) {
      conditions.push(eq(purchases.status, filters.status));
    }

    return db
      .select({
        id: purchases.id,
        referenceNumber: purchases.referenceNumber,
        supplierId: purchases.supplierId,
        supplierName: suppliers.name,
        status: purchases.status,
        subtotal: purchases.subtotal,
        freightCharge: purchases.freightCharge,
        otherFees: purchases.otherFees,
        total: purchases.total,
        paymentStatus: purchases.paymentStatus,
        purchaseDate: purchases.purchaseDate,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(and(...conditions))
      .orderBy(desc(purchases.purchaseDate));
  }
}

