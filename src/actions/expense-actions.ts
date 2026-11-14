"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { ExpenseService } from "@/lib/expenses/expense-service";
import {
  createExpenseSchema,
  createExpenseCategorySchema,
  reviewExpenseSchema,
} from "@/lib/expenses/validation";
import { formatErrorResponse } from "@/lib/security/errors";
import { z } from "zod";

export async function listExpensesAction(filters?: {
  categoryId?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  try {
    const ctx = await requireTenantContext();
    const expenses = await ExpenseService.listExpenses(ctx, {
      ...filters,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    });
    return { success: true, expenses };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function logExpenseAction(input: z.infer<typeof createExpenseSchema>) {
  try {
    const ctx = await requireTenantContext();
    const expense = await ExpenseService.recordExpense(ctx, input);
    return { success: true, expense };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function reviewExpenseAction(input: z.infer<typeof reviewExpenseSchema>) {
  try {
    const ctx = await requireTenantContext();
    const reviewed = await ExpenseService.reviewExpense(ctx, input);
    return { success: true, expense: reviewed };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function listExpenseCategoriesAction() {
  try {
    const ctx = await requireTenantContext();
    const categories = await ExpenseService.listCategories(ctx);
    return { success: true, categories };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function createExpenseCategoryAction(
  input: z.infer<typeof createExpenseCategorySchema>
) {
  try {
    const ctx = await requireTenantContext();
    const category = await ExpenseService.createCategory(ctx, input);
    return { success: true, category };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
