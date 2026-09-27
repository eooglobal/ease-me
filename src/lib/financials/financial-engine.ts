import { db } from "@/db";
import {
  sales,
  saleItems,
  expenses,
  financialTransactions,
  customerTransactions,
  supplierTransactions,
} from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";

export interface FinancialSummary {
  period: {
    startDate?: Date;
    endDate?: Date;
  };
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPercent: number;
  cashFlow: {
    cashInflow: number;
    cashOutflow: number;
    netCashChange: number;
    bankInflows: number;
    cardInflows: number;
  };
  balances: {
    customerReceivables: number;
    supplierPayables: number;
  };
}

export class FinancialEngine {
  /**
   * Computes the complete Profit & Loss and Cash Flow summary for a given business over any date range
   */
  static async getFinancialSummary(
    ctx: TenantContext,
    dateRange?: { startDate?: Date; endDate?: Date }
  ): Promise<FinancialSummary> {
    requirePermission(ctx, "financials.view");

    const startDate = dateRange?.startDate;
    const endDate = dateRange?.endDate;

    // 1. Calculate Revenue (Total from completed sales in period)
    const [revenueRes] = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.businessId, ctx.businessId),
          eq(sales.status, "completed"),
          startDate ? gte(sales.createdAt, startDate) : undefined,
          endDate ? lte(sales.createdAt, endDate) : undefined
        )
      );

    const revenue = parseFloat(revenueRes?.totalRevenue || "0");

    // 2. Calculate COGS (Sum of historical unitCost * quantity for completed sales)
    const [cogsRes] = await db
      .select({
        totalCogs: sql<string>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.unitCost}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(
        and(
          eq(sales.businessId, ctx.businessId),
          eq(sales.status, "completed"),
          startDate ? gte(sales.createdAt, startDate) : undefined,
          endDate ? lte(sales.createdAt, endDate) : undefined
        )
      );

    const cogs = parseFloat(cogsRes?.totalCogs || "0");
    const grossProfit = revenue - cogs;
    const grossMarginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // 3. Calculate Operating Expenses (Approved expenses in period)
    const [expensesRes] = await db
      .select({
        totalExpenses: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.businessId, ctx.businessId),
          eq(expenses.status, "approved"),
          startDate ? gte(expenses.expenseDate, startDate) : undefined,
          endDate ? lte(expenses.expenseDate, endDate) : undefined
        )
      );

    const operatingExpenses = parseFloat(expensesRes?.totalExpenses || "0");
    const netProfit = grossProfit - operatingExpenses;
    const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // 4. Calculate Cash & Digital Collections from Financial Transactions
    const [cashInRes] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "in"),
          eq(financialTransactions.accountType, "cash"),
          startDate ? gte(financialTransactions.transactionDate, startDate) : undefined,
          endDate ? lte(financialTransactions.transactionDate, endDate) : undefined
        )
      );

    const [cashOutRes] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "out"),
          eq(financialTransactions.accountType, "cash"),
          startDate ? gte(financialTransactions.transactionDate, startDate) : undefined,
          endDate ? lte(financialTransactions.transactionDate, endDate) : undefined
        )
      );

    const [bankInRes] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "in"),
          eq(financialTransactions.accountType, "bank"),
          startDate ? gte(financialTransactions.transactionDate, startDate) : undefined,
          endDate ? lte(financialTransactions.transactionDate, endDate) : undefined
        )
      );

    const [cardInRes] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "in"),
          eq(financialTransactions.accountType, "card"),
          startDate ? gte(financialTransactions.transactionDate, startDate) : undefined,
          endDate ? lte(financialTransactions.transactionDate, endDate) : undefined
        )
      );

    const cashInflow = parseFloat(cashInRes?.total || "0");
    const cashOutflow = parseFloat(cashOutRes?.total || "0");
    const netCashChange = cashInflow - cashOutflow;
    const bankInflows = parseFloat(bankInRes?.total || "0");
    const cardInflows = parseFloat(cardInRes?.total || "0");

    // 5. Total Customer Receivables (All outstanding customer debt)
    const [receivablesRes] = await db
      .select({
        totalDebit: sql<string>`COALESCE(SUM(${customerTransactions.debit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${customerTransactions.credit}), 0)`,
      })
      .from(customerTransactions)
      .where(eq(customerTransactions.businessId, ctx.businessId));

    const customerReceivables =
      parseFloat(receivablesRes?.totalDebit || "0") - parseFloat(receivablesRes?.totalCredit || "0");

    // 6. Total Supplier Payables (All outstanding supplier obligations)
    const [payablesRes] = await db
      .select({
        totalCredit: sql<string>`COALESCE(SUM(${supplierTransactions.credit}), 0)`,
        totalDebit: sql<string>`COALESCE(SUM(${supplierTransactions.debit}), 0)`,
      })
      .from(supplierTransactions)
      .where(eq(supplierTransactions.businessId, ctx.businessId));

    const supplierPayables =
      parseFloat(payablesRes?.totalCredit || "0") - parseFloat(payablesRes?.totalDebit || "0");

    return {
      period: {
        startDate,
        endDate,
      },
      revenue,
      cogs,
      grossProfit,
      grossMarginPercent,
      operatingExpenses,
      netProfit,
      netMarginPercent,
      cashFlow: {
        cashInflow,
        cashOutflow,
        netCashChange,
        bankInflows,
        cardInflows,
      },
      balances: {
        customerReceivables: Math.max(0, customerReceivables),
        supplierPayables: Math.max(0, supplierPayables),
      },
    };
  }
}
