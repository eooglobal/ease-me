import { db } from "@/db";
import { products, inventoryMovements, auditLogs, notifications } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError } from "@/lib/security/errors";
import { inventoryMovementSchema } from "./validation";
import { z } from "zod";

export class InventoryMovementService {
  /**
   * Records an atomic inventory movement, updates products.current_stock, checks low stock, and creates an audit log entry.
   */
  static async recordMovement(ctx: TenantContext, input: z.infer<typeof inventoryMovementSchema>) {
    const validated = inventoryMovementSchema.parse(input);

    // Permission enforcement based on movement type
    if (["damaged", "missing"].includes(validated.movementType)) {
      requirePermission(ctx, "inventory.damage");
    } else if (validated.movementType === "received") {
      requirePermission(ctx, "inventory.receive");
    } else {
      requirePermission(ctx, "inventory.adjust");
    }

    return db.transaction(async (tx) => {
      // 1. Fetch current product state
      const [product] = await tx
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, validated.productId),
            eq(products.businessId, ctx.businessId)
          )
        );

      if (!product) {
        throw new NotFoundError("Product");
      }

      const previousStock = product.currentStock;
      const newStock = previousStock + validated.quantity;

      if (newStock < 0) {
        throw new ValidationError("Operation would result in negative stock balance for this product.");
      }

      // 2. Insert into immutable movement ledger
      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          businessId: ctx.businessId,
          productId: product.id,
          movementType: validated.movementType,
          quantity: validated.quantity,
          unitCost: validated.unitCost ? validated.unitCost.toString() : product.costPrice,
          referenceType: validated.referenceType,
          referenceId: validated.referenceId,
          reason: validated.reason,
          createdBy: ctx.userId,
        })
        .returning();

      // 3. Atomically update cached currentStock counter
      await tx
        .update(products)
        .set({
          currentStock: newStock,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));

      // 4. Create immutable audit log entry
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: `INVENTORY_${validated.movementType.toUpperCase()}`,
        entityType: "product",
        entityId: product.id,
        oldValues: { stock: previousStock },
        newValues: { stock: newStock, quantityChanged: validated.quantity },
        metadata: {
          movementId: movement.id,
          reason: validated.reason,
          referenceType: validated.referenceType,
        },
      });

      // 5. Low-stock alert if threshold reached
      if (product.trackInventory && newStock <= product.minimumStockLevel) {
        await tx.insert(notifications).values({
          businessId: ctx.businessId,
          userId: ctx.userId,
          type: "low_stock",
          title: `Low Stock Alert: ${product.name}`,
          message: `Product '${product.name}' is running low (${newStock} ${product.unit} remaining, threshold: ${product.minimumStockLevel}).`,
          entityType: "product",
          entityId: product.id,
        });
      }

      return {
        movement,
        previousStock,
        newStock,
      };
    });
  }

  /**
   * Retrieves full movement history for a product or business
   */
  static async listMovements(
    ctx: TenantContext,
    filters?: { productId?: string; movementType?: z.infer<typeof inventoryMovementSchema>["movementType"]; limit?: number }
  ) {
    requirePermission(ctx, "inventory.view");

    return db
      .select({
        id: inventoryMovements.id,
        productId: inventoryMovements.productId,
        productName: products.name,
        productSku: products.sku,
        movementType: inventoryMovements.movementType,
        quantity: inventoryMovements.quantity,
        unitCost: inventoryMovements.unitCost,
        reason: inventoryMovements.reason,
        referenceType: inventoryMovements.referenceType,
        referenceId: inventoryMovements.referenceId,
        createdBy: inventoryMovements.createdBy,
        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .innerJoin(products, eq(inventoryMovements.productId, products.id))
      .where(
        and(
          eq(inventoryMovements.businessId, ctx.businessId),
          filters?.productId ? eq(inventoryMovements.productId, filters.productId) : undefined,
          filters?.movementType ? eq(inventoryMovements.movementType, filters.movementType) : undefined
        )
      )
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(filters?.limit || 100);
  }

  /**
   * Computes the calculated historical stock from sum of all ledger movements
   */
  static async calculateExpectedStock(ctx: TenantContext, productId: string): Promise<number> {
    requirePermission(ctx, "inventory.view");

    const [result] = await db
      .select({
        totalQuantity: sql<number>`COALESCE(SUM(${inventoryMovements.quantity}), 0)::integer`,
      })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.businessId, ctx.businessId),
          eq(inventoryMovements.productId, productId)
        )
      );

    return result ? result.totalQuantity : 0;
  }
}
