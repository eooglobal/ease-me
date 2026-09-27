import { db } from "@/db";
import { products, inventoryCounts, inventoryCountItems, inventoryMovements, auditLogs, notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/security/errors";
import { createInventoryCountSchema, submitInventoryCountSchema } from "./validation";
import { z } from "zod";

export class InventoryCountService {
  /**
   * Starts a new physical inventory stock count session
   */
  static async startCountSession(ctx: TenantContext, input: z.infer<typeof createInventoryCountSchema>) {
    requirePermission(ctx, "inventory.adjust");
    const validated = createInventoryCountSchema.parse(input);

    const [session] = await db
      .insert(inventoryCounts)
      .values({
        businessId: ctx.businessId,
        status: "in_progress",
        countedBy: ctx.userId,
        startedAt: new Date(),
        notes: validated.notes,
      })
      .returning();

    return session;
  }

  /**
   * Submits counted items and automatically calculates expected quantity vs counted quantity discrepancies
   */
  static async submitCountItems(ctx: TenantContext, input: z.infer<typeof submitInventoryCountSchema>) {
    requirePermission(ctx, "inventory.adjust");
    const validated = submitInventoryCountSchema.parse(input);

    return db.transaction(async (tx) => {
      // 1. Verify session exists and is active
      const [session] = await tx
        .select()
        .from(inventoryCounts)
        .where(
          and(
            eq(inventoryCounts.id, validated.countId),
            eq(inventoryCounts.businessId, ctx.businessId)
          )
        );

      if (!session) {
        throw new NotFoundError("Inventory count session");
      }

      if (session.status !== "in_progress" && session.status !== "draft") {
        throw new ValidationError(`Cannot record count items for session in status '${session.status}'`);
      }

      const results = [];
      let hasDiscrepancies = false;

      for (const item of validated.items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(
            and(
              eq(products.id, item.productId),
              eq(products.businessId, ctx.businessId)
            )
          );

        if (!product) {
          throw new NotFoundError(`Product ${item.productId}`);
        }

        const expectedQuantity = product.currentStock;
        const difference = item.countedQuantity - expectedQuantity;

        if (difference !== 0) {
          hasDiscrepancies = true;
        }

        const [countItem] = await tx
          .insert(inventoryCountItems)
          .values({
            inventoryCountId: session.id,
            productId: product.id,
            expectedQuantity,
            countedQuantity: item.countedQuantity,
            difference,
            reason: item.reason,
          })
          .onConflictDoUpdate({
            target: [inventoryCountItems.inventoryCountId, inventoryCountItems.productId],
            set: {
              countedQuantity: item.countedQuantity,
              difference,
              reason: item.reason,
            },
          })
          .returning();

        results.push({
          ...countItem,
          productName: product.name,
        });
      }

      // Update session status to completed
      await tx
        .update(inventoryCounts)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(inventoryCounts.id, session.id));

      if (hasDiscrepancies) {
        await tx.insert(notifications).values({
          businessId: ctx.businessId,
          userId: ctx.userId,
          type: "inventory_discrepancy",
          title: "Inventory Discrepancy Detected",
          message: `Stock count session has detected variance between physical count and expected inventory. Review required before approval.`,
          entityType: "inventory_count",
          entityId: session.id,
        });
      }

      return {
        session: { ...session, status: "completed" },
        items: results,
      };
    });
  }

  /**
   * Approves a completed stock count, adjusts inventory quantities, and records audit trail
   */
  static async approveCountAndApplyAdjustments(ctx: TenantContext, countId: string) {
    requirePermission(ctx, "inventory.adjust");

    return db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(inventoryCounts)
        .where(
          and(
            eq(inventoryCounts.id, countId),
            eq(inventoryCounts.businessId, ctx.businessId)
          )
        );

      if (!session) {
        throw new NotFoundError("Inventory count session");
      }

      if (session.status !== "completed") {
        throw new ValidationError(`Cannot approve inventory count in status '${session.status}'`);
      }

      const countItems = await tx
        .select()
        .from(inventoryCountItems)
        .where(eq(inventoryCountItems.inventoryCountId, session.id));

      for (const item of countItems) {
        if (item.difference !== 0) {
          // Record adjustment movement
          await tx.insert(inventoryMovements).values({
            businessId: ctx.businessId,
            productId: item.productId,
            movementType: "adjustment",
            quantity: item.difference,
            referenceType: "inventory_count",
            referenceId: session.id,
            reason: item.reason || `Stock count reconciliation adjustment (variance: ${item.difference})`,
            createdBy: ctx.userId,
          });

          // Update cached product stock
          await tx
            .update(products)
            .set({
              currentStock: item.countedQuantity,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));

          // Log to audit trail
          await tx.insert(auditLogs).values({
            businessId: ctx.businessId,
            userId: ctx.userId,
            action: "INVENTORY_COUNT_RECONCILIATION",
            entityType: "product",
            entityId: item.productId,
            oldValues: { stock: item.expectedQuantity },
            newValues: { stock: item.countedQuantity, difference: item.difference },
            metadata: {
              countSessionId: session.id,
              reason: item.reason,
            },
          });
        }
      }

      // Mark count session as approved
      const [approvedSession] = await tx
        .update(inventoryCounts)
        .set({
          status: "approved",
          approvedBy: ctx.userId,
        })
        .where(eq(inventoryCounts.id, session.id))
        .returning();

      return approvedSession;
    });
  }
}
