import { db } from "@/db";
import { products, productCategories, inventoryMovements } from "@/db/schema";
import { eq, and, sql, lte, asc, desc } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError } from "@/lib/security/errors";
import { createProductSchema, updateProductSchema, createCategorySchema, updateCategorySchema } from "./validation";
import { z } from "zod";

export class ProductService {
  /**
   * CATEGORIES
   */
  static async listCategories(ctx: TenantContext) {
    requirePermission(ctx, "inventory.view");
    return db
      .select()
      .from(productCategories)
      .where(eq(productCategories.businessId, ctx.businessId))
      .orderBy(asc(productCategories.name));
  }

  static async createCategory(ctx: TenantContext, input: z.infer<typeof createCategorySchema>) {
    requirePermission(ctx, "inventory.adjust");
    const validated = createCategorySchema.parse(input);

    const [category] = await db
      .insert(productCategories)
      .values({
        businessId: ctx.businessId,
        name: validated.name,
        description: validated.description,
      })
      .returning();

    return category;
  }

  static async updateCategory(ctx: TenantContext, categoryId: string, input: z.infer<typeof updateCategorySchema>) {
    requirePermission(ctx, "inventory.adjust");
    const validated = updateCategorySchema.parse(input);

    const [updated] = await db
      .update(productCategories)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productCategories.id, categoryId),
          eq(productCategories.businessId, ctx.businessId)
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundError("Product category");
    }

    return updated;
  }

  /**
   * PRODUCTS
   */
  static async listProducts(ctx: TenantContext, filters?: { categoryId?: string; status?: "active" | "inactive" | "archived" }) {
    requirePermission(ctx, "inventory.view");
    
    return db
      .select()
      .from(products)
      .where(
        and(
          eq(products.businessId, ctx.businessId),
          filters?.categoryId ? eq(products.categoryId, filters.categoryId) : undefined,
          filters?.status ? eq(products.status, filters.status) : undefined
        )
      )
      .orderBy(asc(products.name));
  }

  static async getProductById(ctx: TenantContext, productId: string) {
    requirePermission(ctx, "inventory.view");

    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.businessId, ctx.businessId)
        )
      );

    if (!product) {
      throw new NotFoundError("Product");
    }

    return product;
  }

  static async createProduct(ctx: TenantContext, input: z.infer<typeof createProductSchema>) {
    requirePermission(ctx, "inventory.adjust");
    const validated = createProductSchema.parse(input);

    // Run creation inside a single transaction: insert product + opening inventory movement if initialStock > 0
    return db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          businessId: ctx.businessId,
          categoryId: validated.categoryId,
          name: validated.name,
          sku: validated.sku,
          barcode: validated.barcode,
          description: validated.description,
          unit: validated.unit,
          costPrice: validated.costPrice.toString(),
          sellingPrice: validated.sellingPrice.toString(),
          currentStock: validated.initialStock,
          minimumStockLevel: validated.minimumStockLevel,
          trackInventory: validated.trackInventory,
          status: "active",
        })
        .returning();

      if (validated.initialStock > 0) {
        await tx.insert(inventoryMovements).values({
          businessId: ctx.businessId,
          productId: product.id,
          movementType: "opening",
          quantity: validated.initialStock,
          unitCost: validated.costPrice.toString(),
          reason: "Initial opening stock upon product creation",
          createdBy: ctx.userId,
        });
      }

      return product;
    });
  }

  static async updateProduct(ctx: TenantContext, productId: string, input: z.infer<typeof updateProductSchema>) {
    requirePermission(ctx, "inventory.adjust");
    const validated = updateProductSchema.parse(input);

    const updatePayload: Record<string, any> = {
      ...validated,
      updatedAt: new Date(),
    };

    if (validated.costPrice !== undefined) {
      updatePayload.costPrice = validated.costPrice.toString();
    }
    if (validated.sellingPrice !== undefined) {
      updatePayload.sellingPrice = validated.sellingPrice.toString();
    }

    const [updated] = await db
      .update(products)
      .set(updatePayload)
      .where(
        and(
          eq(products.id, productId),
          eq(products.businessId, ctx.businessId)
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundError("Product");
    }

    return updated;
  }

  /**
   * List products reaching or below minimum stock level threshold
   */
  static async getLowStockProducts(ctx: TenantContext) {
    requirePermission(ctx, "inventory.view");

    return db
      .select()
      .from(products)
      .where(
        and(
          eq(products.businessId, ctx.businessId),
          eq(products.status, "active"),
          eq(products.trackInventory, true),
          lte(products.currentStock, products.minimumStockLevel)
        )
      )
      .orderBy(asc(products.currentStock));
  }
}
