"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { SaleService } from "@/lib/sales/sale-service";
import { createSaleSchema, cancelOrVoidSaleSchema } from "@/lib/sales/validation";
import { formatErrorResponse } from "@/lib/security/errors";
import { db } from "@/db";
import { sales, saleItems, products, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export async function recordSaleAction(input: z.infer<typeof createSaleSchema>) {
  try {
    const ctx = await requireTenantContext();
    const result = await SaleService.recordSale(ctx, input);
    return { success: true, data: result };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function listSalesAction(filters?: {
  customerId?: string;
  soldBy?: string;
  status?: "completed" | "cancelled" | "voided";
  limit?: number;
}) {
  try {
    const ctx = await requireTenantContext();
    const salesList = await SaleService.listSales(ctx, filters);
    return { success: true, sales: salesList };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function getSaleDetailAction(saleId: string) {
  try {
    const ctx = await requireTenantContext();
    const [sale] = await db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        status: sales.status,
        subtotal: sales.subtotal,
        discount: sales.discount,
        tax: sales.tax,
        total: sales.total,
        paymentStatus: sales.paymentStatus,
        soldBy: sales.soldBy,
        createdAt: sales.createdAt,
        customerId: sales.customerId,
        customerName: customers.name,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(and(eq(sales.id, saleId), eq(sales.businessId, ctx.businessId)));

    if (!sale) {
      return { success: false, error: { message: "Sale not found", statusCode: 404, code: "NOT_FOUND" } };
    }

    const items = await db
      .select({
        id: saleItems.id,
        productId: saleItems.productId,
        productName: products.name,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        discount: saleItems.discount,
        total: saleItems.total,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, sale.id));

    return { success: true, sale: { ...sale, items } };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function voidSaleAction(input: z.infer<typeof cancelOrVoidSaleSchema>) {
  try {
    const ctx = await requireTenantContext();
    const voided = await SaleService.voidOrCancelSale(ctx, input);
    return { success: true, data: voided };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
