import { db } from "@/db";
import { productBatches, products, NewProductBatch } from "@/db/schema";
import { eq, and, asc, lte, gte } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError } from "@/lib/security/errors";

export interface CreateBatchInput {
  productId: string;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  expiryDate: Date;
}

export class BatchService {
  /**
   * Retrieves active batches with FEFO (First-Expired, First-Out) ordering
   */
  static async listBatches(ctx: TenantContext, productId?: string) {
    requirePermission(ctx, "inventory.view");

    return db
      .select({
        id: productBatches.id,
        productId: productBatches.productId,
        productName: products.name,
        productSku: products.sku,
        batchNumber: productBatches.batchNumber,
        quantity: productBatches.quantity,
        costPrice: productBatches.costPrice,
        expiryDate: productBatches.expiryDate,
        status: productBatches.status,
        createdAt: productBatches.createdAt,
      })
      .from(productBatches)
      .innerJoin(products, eq(productBatches.productId, products.id))
      .where(
        and(
          eq(productBatches.businessId, ctx.businessId),
          productId ? eq(productBatches.productId, productId) : undefined
        )
      )
      .orderBy(asc(productBatches.expiryDate)); // Strict FEFO
  }

  /**
   * Records a new batch intake
   */
  static async createBatch(ctx: TenantContext, input: CreateBatchInput) {
    requirePermission(ctx, "inventory.receive");

    if (input.quantity <= 0) {
      throw new ValidationError("Batch intake quantity must be greater than zero.");
    }

    const [batch] = await db
      .insert(productBatches)
      .values({
        businessId: ctx.businessId,
        productId: input.productId,
        batchNumber: input.batchNumber.trim(),
        quantity: input.quantity,
        costPrice: input.costPrice.toFixed(2),
        expiryDate: input.expiryDate,
        status: "active",
      })
      .returning();

    return batch;
  }

  /**
   * Retrieves batches expiring within a threshold (e.g. 30 or 60 days) for the manager exception board
   */
  static async getExpiringBatches(ctx: TenantContext, withinDays = 30) {
    requirePermission(ctx, "inventory.view");

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + withinDays);

    return db
      .select({
        id: productBatches.id,
        productId: productBatches.productId,
        productName: products.name,
        productSku: products.sku,
        batchNumber: productBatches.batchNumber,
        quantity: productBatches.quantity,
        costPrice: productBatches.costPrice,
        expiryDate: productBatches.expiryDate,
        status: productBatches.status,
      })
      .from(productBatches)
      .innerJoin(products, eq(productBatches.productId, products.id))
      .where(
        and(
          eq(productBatches.businessId, ctx.businessId),
          eq(productBatches.status, "active"),
          lte(productBatches.expiryDate, thresholdDate)
        )
      )
      .orderBy(asc(productBatches.expiryDate));
  }
}

