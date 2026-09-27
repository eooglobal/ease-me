import { db } from "@/db";
import {
  sales,
  saleItems,
  expenses,
  products,
  customerTransactions,
  supplierTransactions,
  financialTransactions,
  auditLogs,
  notifications,
} from "@/db/schema";
import { eq, and, gte, lte, sql, desc, lte as lessOrEqual, inArray } from "drizzle-orm";
import { TenantContext } from "@/lib/security/tenant";
import { hasPermission } from "@/lib/security/permissions";
import { ReconciliationService } from "@/lib/reconciliation/reconciliation-service";

export interface DashboardData {
  kpis: {
    todaySales: number;
    todayExpenses: number;
    todayProfit: number;
    todayMarginPercent: number;
    cashPosition: number;
    digitalCollections: number;
    customerReceivables: number;
    supplierObligations: number;
  };
  alerts: {
    lowStockCount: number;
    unreadNotifications: number;
    recentNotifications: Array<any>;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    userId: string;
    createdAt: Date;
    details?: any;
  }>;
}

export class DashboardService {
  /**
   * Retrieves the comprehensive business control dashboard overview.
   * Tailors metrics to user role (e.g. cashiers see their allowed sales activity, managers see full P&L).
   */
  static async getDashboardData(ctx: TenantContext): Promise<DashboardData> {
    const today = new Date();
    const { start, end } = ReconciliationService.getDayBounds(today);

    const canViewFinancials = hasPermission(ctx.permissions, "financials.view");
    const canViewExpenses = hasPermission(ctx.permissions, "expenses.view");

    // 1. Today's Sales
    const [salesRes] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
        count: sql<number>`COUNT(${sales.id})`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.businessId, ctx.businessId),
          eq(sales.status, "completed"),
          gte(sales.createdAt, start),
          lte(sales.createdAt, end)
        )
      );

    const todaySales = parseFloat(salesRes?.total || "0");

    // 2. Today's COGS (for profit estimation)
    let todayCogs = 0;
    if (canViewFinancials) {
      const [cogsRes] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.unitCost}), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(
          and(
            eq(sales.businessId, ctx.businessId),
            eq(sales.status, "completed"),
            gte(sales.createdAt, start),
            lte(sales.createdAt, end)
          )
        );
      todayCogs = parseFloat(cogsRes?.total || "0");
    }

    // 3. Today's Expenses
    let todayExpenses = 0;
    if (canViewExpenses) {
      const [expensesRes] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.businessId, ctx.businessId),
            eq(expenses.status, "approved"),
            gte(expenses.expenseDate, start),
            lte(expenses.expenseDate, end)
          )
        );
      todayExpenses = parseFloat(expensesRes?.total || "0");
    }

    const todayGrossProfit = todaySales - todayCogs;
    const todayProfit = canViewFinancials ? todayGrossProfit - todayExpenses : 0;
    const todayMarginPercent = todaySales > 0 ? (todayProfit / todaySales) * 100 : 0;

    // 4. Cash Position & Digital Collections
    const [cashInRes] = await db
      .select({ total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)` })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "in"),
          eq(financialTransactions.accountType, "cash")
        )
      );

    const [cashOutRes] = await db
      .select({ total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)` })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "out"),
          eq(financialTransactions.accountType, "cash")
        )
      );

    const [digitalRes] = await db
      .select({ total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)` })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "in"),
          sql`${financialTransactions.accountType} IN ('bank', 'card')`,
          gte(financialTransactions.transactionDate, start),
          lte(financialTransactions.transactionDate, end)
        )
      );

    const cashPosition = parseFloat(cashInRes?.total || "0") - parseFloat(cashOutRes?.total || "0");
    const digitalCollections = parseFloat(digitalRes?.total || "0");

    // 5. Customer Receivables & Supplier Obligations
    let customerReceivables = 0;
    let supplierObligations = 0;

    if (canViewFinancials || hasPermission(ctx.permissions, "customers.view")) {
      const [custRes] = await db
        .select({
          balance: sql<string>`COALESCE(SUM(${customerTransactions.debit}), 0) - COALESCE(SUM(${customerTransactions.credit}), 0)`,
        })
        .from(customerTransactions)
        .where(eq(customerTransactions.businessId, ctx.businessId));
      customerReceivables = Math.max(0, parseFloat(custRes?.balance || "0"));
    }

    if (canViewFinancials || hasPermission(ctx.permissions, "suppliers.view")) {
      const [suppRes] = await db
        .select({
          balance: sql<string>`COALESCE(SUM(${supplierTransactions.credit}), 0) - COALESCE(SUM(${supplierTransactions.debit}), 0)`,
        })
        .from(supplierTransactions)
        .where(eq(supplierTransactions.businessId, ctx.businessId));
      supplierObligations = Math.max(0, parseFloat(suppRes?.balance || "0"));
    }

    // 6. Alerts (Low Stock Count & Notifications)
    const [lowStockRes] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(
        and(
          eq(products.businessId, ctx.businessId),
          eq(products.status, "active"),
          eq(products.trackInventory, true),
          lessOrEqual(products.currentStock, products.minimumStockLevel)
        )
      );

    const lowStockCount = Number(lowStockRes?.count || 0);

    const recentNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.businessId, ctx.businessId))
      .orderBy(desc(notifications.createdAt))
      .limit(5);

    // 7. Recent Activity (from Audit Logs)
    const recentActivity = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        userId: auditLogs.userId,
        createdAt: auditLogs.createdAt,
        details: auditLogs.newValues,
      })
      .from(auditLogs)
      .where(eq(auditLogs.businessId, ctx.businessId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return {
      kpis: {
        todaySales,
        todayExpenses: canViewExpenses ? todayExpenses : 0,
        todayProfit: canViewFinancials ? todayProfit : 0,
        todayMarginPercent: canViewFinancials ? todayMarginPercent : 0,
        cashPosition: canViewFinancials ? cashPosition : 0,
        digitalCollections,
        customerReceivables,
        supplierObligations,
      },
      alerts: {
        lowStockCount,
        unreadNotifications: recentNotifs.filter((n) => !n.readAt).length,
        recentNotifications: recentNotifs,
      },
      recentActivity,
    };
  }
}
