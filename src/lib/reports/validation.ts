import { z } from "zod";

export const dateRangeFilterSchema = z.object({
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
});

export const salesReportFilterSchema = dateRangeFilterSchema.extend({
  soldBy: z.string().optional(),
  customerId: z.string().uuid().optional(),
  paymentStatus: z.enum(["completed", "pending", "failed", "refunded", "cancelled"]).optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const expenseReportFilterSchema = dateRangeFilterSchema.extend({
  categoryId: z.string().uuid().optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const inventoryReportFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  lowStockOnly: z.boolean().default(false),
  limit: z.number().int().min(1).max(500).default(100),
});

export const auditReportFilterSchema = dateRangeFilterSchema.extend({
  userId: z.string().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});
