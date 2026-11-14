"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { ProductService } from "@/lib/inventory/product-service";
import { InventoryMovementService } from "@/lib/inventory/movement-service";
import { BatchService } from "@/lib/inventory/batch-service";
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  inventoryMovementSchema,
} from "@/lib/inventory/validation";
import { formatErrorResponse } from "@/lib/security/errors";
import { z } from "zod";

export async function listProductsAction(filters?: {
  categoryId?: string;
  status?: "active" | "inactive" | "archived";
}) {
  try {
    const ctx = await requireTenantContext();
    const productsList = await ProductService.listProducts(ctx, filters);
    return { success: true, products: productsList };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function createProductAction(input: z.infer<typeof createProductSchema>) {
  try {
    const ctx = await requireTenantContext();
    const product = await ProductService.createProduct(ctx, input);
    return { success: true, product };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function updateProductAction(
  productId: string,
  input: z.infer<typeof updateProductSchema>
) {
  try {
    const ctx = await requireTenantContext();
    const product = await ProductService.updateProduct(ctx, productId, input);
    return { success: true, product };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function recordInventoryMovementAction(
  input: z.infer<typeof inventoryMovementSchema>
) {
  try {
    const ctx = await requireTenantContext();
    const movement = await InventoryMovementService.recordMovement(ctx, input);
    return { success: true, movement };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function listProductCategoriesAction() {
  try {
    const ctx = await requireTenantContext();
    const categories = await ProductService.listCategories(ctx);
    return { success: true, categories };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function createProductCategoryAction(input: z.infer<typeof createCategorySchema>) {
  try {
    const ctx = await requireTenantContext();
    const category = await ProductService.createCategory(ctx, input);
    return { success: true, category };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function listProductMovementsAction(productId?: string) {
  try {
    const ctx = await requireTenantContext();
    const movements = await InventoryMovementService.listMovements(ctx, { productId });
    return { success: true, movements };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function listBatchesAction(productId?: string) {
  try {
    const ctx = await requireTenantContext();
    const batches = await BatchService.listBatches(ctx, productId);
    return { success: true, batches };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function createBatchAction(input: any) {
  try {
    const ctx = await requireTenantContext();
    const batch = await BatchService.createBatch(ctx, input);
    return { success: true, batch };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function listExpiringBatchesAction(withinDays = 30) {
  try {
    const ctx = await requireTenantContext();
    const batches = await BatchService.getExpiringBatches(ctx, withinDays);
    return { success: true, batches };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
