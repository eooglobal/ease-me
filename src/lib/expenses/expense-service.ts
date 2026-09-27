import { db } from "@/db";
import { expenseCategories, expenses, financialTransactions, auditLogs, notifications } from "@/db/schema";
import { eq, and, desc, sql, asc, gte, lte } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/security/errors";
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
  reviewExpenseSchema,
} from "./validation";
import { z } from "zod";

export class ExpenseService {
  /**
   * CATEGORIES
   */
  static async listCategories(ctx: TenantContext) {
    requirePermission(ctx, "expenses.view");
    return db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.businessId, ctx.businessId))
      .orderBy(asc(expenseCategories.name));
  }

  static async createCategory(ctx: TenantContext, input: z.infer<typeof createExpenseCategorySchema>) {
    requirePermission(ctx, "expenses.edit");
    const validated = createExpenseCategorySchema.parse(input);

    const [category] = await db
      .insert(expenseCategories)
      .values({
        businessId: ctx.businessId,
        name: validated.name,
        description: validated.description,
      })
      .returning();

    return category;
  }

  /**
   * EXPENSES
   */
  static async listExpenses(
    ctx: TenantContext,
    filters?: {
      categoryId?: string;
      status?: "pending" | "approved" | "rejected" | "cancelled";
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ) {
    requirePermission(ctx, "expenses.view");

    return db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        paymentMethod: expenses.paymentMethod,
        status: expenses.status,
        expenseDate: expenses.expenseDate,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        createdBy: expenses.createdBy,
        approvedBy: expenses.approvedBy,
        approvedAt: expenses.approvedAt,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(
        and(
          eq(expenses.businessId, ctx.businessId),
          filters?.categoryId ? eq(expenses.categoryId, filters.categoryId) : undefined,
          filters?.status ? eq(expenses.status, filters.status) : undefined,
          filters?.startDate ? gte(expenses.expenseDate, filters.startDate) : undefined,
          filters?.endDate ? lte(expenses.expenseDate, filters.endDate) : undefined
        )
      )
      .orderBy(desc(expenses.expenseDate))
      .limit(filters?.limit || 50);
  }

  /**
   * Records a new expense.
   * If auto-approved (e.g. created by Owner or doesn't require approval), posts financial outflow immediately.
   */
  static async recordExpense(ctx: TenantContext, input: z.infer<typeof createExpenseSchema>) {
    requirePermission(ctx, "expenses.create");
    const validated = createExpenseSchema.parse(input);

    return db.transaction(async (tx) => {
      // 1. Verify category if provided
      if (validated.categoryId) {
        const [category] = await tx
          .select()
          .from(expenseCategories)
          .where(
            and(
              eq(expenseCategories.id, validated.categoryId),
              eq(expenseCategories.businessId, ctx.businessId)
            )
          );

        if (!category) {
          throw new NotFoundError("Expense category");
        }
      }

      // Check if user is owner/admin -> auto-approved
      const isAutoApproved = !validated.requiresApproval || ctx.roleName === "owner" || ctx.roleName === "admin";
      const status = isAutoApproved ? "approved" : "pending";
      const approvedBy = isAutoApproved ? ctx.userId : null;
      const approvedAt = isAutoApproved ? new Date() : null;

      const expenseDate = validated.expenseDate ? new Date(validated.expenseDate) : new Date();

      // 2. Insert expense record
      const [expense] = await tx
        .insert(expenses)
        .values({
          businessId: ctx.businessId,
          categoryId: validated.categoryId,
          description: validated.description,
          amount: validated.amount.toString(),
          paymentMethod: validated.paymentMethod,
          status,
          expenseDate,
          createdBy: ctx.userId,
          approvedBy,
          approvedAt,
        })
        .returning();

      // 3. If approved, immediately record financial outflow
      if (isAutoApproved) {
        const accountType = validated.paymentMethod === "bank_transfer" ? "bank" : validated.paymentMethod === "card" ? "card" : "cash";

        await tx.insert(financialTransactions).values({
          businessId: ctx.businessId,
          transactionType: "EXPENSE",
          referenceType: "expense",
          referenceId: expense.id,
          amount: validated.amount.toString(),
          direction: "out",
          accountType,
          description: `Expense: ${validated.description} (${validated.paymentMethod})`,
          transactionDate: expenseDate,
          createdBy: ctx.userId,
        });
      } else {
        // Notify managers for pending approval
        await tx.insert(notifications).values({
          businessId: ctx.businessId,
          userId: ctx.userId,
          type: "expense_approval",
          title: "Expense Pending Approval",
          message: `Expense of ₦${validated.amount.toFixed(2)} (${validated.description}) submitted for approval.`,
          entityType: "expense",
          entityId: expense.id,
        });
      }

      // 4. Audit Log
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: isAutoApproved ? "EXPENSE_CREATED_AND_APPROVED" : "EXPENSE_CREATED_PENDING",
        entityType: "expense",
        entityId: expense.id,
        newValues: {
          description: validated.description,
          amount: validated.amount,
          paymentMethod: validated.paymentMethod,
          status,
        },
      });

      return expense;
    });
  }

  /**
   * Approves or rejects a pending expense
   */
  static async reviewExpense(ctx: TenantContext, input: z.infer<typeof reviewExpenseSchema>) {
    requirePermission(ctx, "expenses.approve");
    const validated = reviewExpenseSchema.parse(input);

    return db.transaction(async (tx) => {
      const [expense] = await tx
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.id, validated.expenseId),
            eq(expenses.businessId, ctx.businessId)
          )
        );

      if (!expense) {
        throw new NotFoundError("Expense");
      }

      if (expense.status !== "pending") {
        throw new ValidationError(`Expense is already in '${expense.status}' status and cannot be reviewed.`);
      }

      const newStatus = validated.action === "approve" ? "approved" : validated.action === "reject" ? "rejected" : "cancelled";

      const [updatedExpense] = await tx
        .update(expenses)
        .set({
          status: newStatus,
          approvedBy: ctx.userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, expense.id))
        .returning();

      // If approved, post financial outflow transaction
      if (newStatus === "approved") {
        const accountType = expense.paymentMethod === "bank_transfer" ? "bank" : expense.paymentMethod === "card" ? "card" : "cash";

        await tx.insert(financialTransactions).values({
          businessId: ctx.businessId,
          transactionType: "EXPENSE",
          referenceType: "expense",
          referenceId: expense.id,
          amount: expense.amount,
          direction: "out",
          accountType,
          description: `Approved Expense: ${expense.description} (${expense.paymentMethod})`,
          transactionDate: expense.expenseDate,
          createdBy: ctx.userId,
        });
      }

      // Audit Log
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: `EXPENSE_${newStatus.toUpperCase()}`,
        entityType: "expense",
        entityId: expense.id,
        oldValues: { status: expense.status },
        newValues: { status: newStatus, reason: validated.reason },
      });

      return updatedExpense;
    });
  }
}
