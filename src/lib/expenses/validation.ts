import { z } from "zod";

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional().nullable(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  description: z.string().min(1, "Description is required").max(500),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  paymentMethod: z.enum(["cash", "bank_transfer", "card", "other"]).default("cash"),
  expenseDate: z.string().datetime().optional().or(z.date().optional()),
  requiresApproval: z.boolean().default(false),
  receiptUrl: z.string().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const reviewExpenseSchema = z.object({
  expenseId: z.string().uuid("Invalid expense ID"),
  action: z.enum(["approve", "reject", "cancel"]),
  reason: z.string().max(500).optional(),
});
