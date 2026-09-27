import { db } from "@/db";
import {
  sales,
  saleItems,
  products,
  productCategories,
  expenses,
  expenseCategories,
  customers,
  customerTransactions,
  suppliers,
  supplierTransactions,
  auditLogs,
  dailyClosings,
} from "@/db/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { FinancialEngine } from "@/lib/financials/financial-engine";
import {
  salesReportFilterSchema,
  expenseReportFilterSchema,
  inventoryReportFilterSchema,
  auditReportFilterSchema,
  dateRangeFilterSchema,
} from "./validation";
import { z } from "zod";

export class ReportService {
  /**
   * 1. SALES REPORT
   * Returns itemized sales summary by product, date, and cashier
   */
  static async getSalesReport(ctx: TenantContext, input?: z.infer<typeof salesReportFilterSchema>) {
    requirePermission(ctx, "reports.view");
    const validated = salesReportFilterSchema.parse(input || {});

    const startDate = validated.startDate ? new Date(validated.startDate) : undefined;
    const endDate = validated.endDate ? new Date(validated.endDate) : undefined;

    const salesList = await db
      .select({
        saleId: sales.id,
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
      .where(
        and(
          eq(sales.businessId, ctx.businessId),
          startDate ? gte(sales.createdAt, startDate) : undefined,
          endDate ? lte(sales.createdAt, endDate) : undefined,
          validated.soldBy ? eq(sales.soldBy, validated.soldBy) : undefined,
          validated.customerId ? eq(sales.customerId, validated.customerId) : undefined,
          validated.paymentStatus ? eq(sales.paymentStatus, validated.paymentStatus) : undefined
        )
      )
      .orderBy(desc(sales.createdAt))
      .limit(validated.limit);

    const totalRevenue = salesList
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + parseFloat(s.total), 0);

    return {
      period: { startDate, endDate },
      totalSalesCount: salesList.length,
      totalRevenue,
      sales: salesList,
    };
  }

  /**
   * 2. EXPENSE REPORT
   * Categorized breakdown of operating expenses
   */
  static async getExpenseReport(ctx: TenantContext, input?: z.infer<typeof expenseReportFilterSchema>) {
    requirePermission(ctx, "reports.view");
    const validated = expenseReportFilterSchema.parse(input || {});

    const startDate = validated.startDate ? new Date(validated.startDate) : undefined;
    const endDate = validated.endDate ? new Date(validated.endDate) : undefined;

    const expenseList = await db
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
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(
        and(
          eq(expenses.businessId, ctx.businessId),
          startDate ? gte(expenses.expenseDate, startDate) : undefined,
          endDate ? lte(expenses.expenseDate, endDate) : undefined,
          validated.categoryId ? eq(expenses.categoryId, validated.categoryId) : undefined,
          validated.status ? eq(expenses.status, validated.status) : undefined
        )
      )
      .orderBy(desc(expenses.expenseDate))
      .limit(validated.limit);

    const totalApprovedExpenses = expenseList
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Grouping by category
    const categoryBreakdown: Record<string, number> = {};
    for (const exp of expenseList.filter((e) => e.status === "approved")) {
      const cat = exp.categoryName || "Uncategorized";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(exp.amount);
    }

    return {
      period: { startDate, endDate },
      totalApprovedExpenses,
      categoryBreakdown,
      expenses: expenseList,
    };
  }

  /**
   * 3. INVENTORY VALUATION REPORT
   * Stock valuation (at Cost Price and Selling Price), low-stock warnings, and margin estimates
   */
  static async getInventoryValuationReport(ctx: TenantContext, input?: z.infer<typeof inventoryReportFilterSchema>) {
    requirePermission(ctx, "reports.view");
    const validated = inventoryReportFilterSchema.parse(input || {});

    const productList = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        unit: products.unit,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        currentStock: products.currentStock,
        minimumStockLevel: products.minimumStockLevel,
        status: products.status,
        categoryId: products.categoryId,
        categoryName: productCategories.name,
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(
        and(
          eq(products.businessId, ctx.businessId),
          eq(products.status, "active"),
          validated.categoryId ? eq(products.categoryId, validated.categoryId) : undefined,
          validated.lowStockOnly ? sql`${products.currentStock} <= ${products.minimumStockLevel}` : undefined
        )
      )
      .orderBy(asc(products.name))
      .limit(validated.limit);

    let totalValuationAtCost = 0;
    let totalValuationAtRetail = 0;

    const items = productList.map((p) => {
      const cost = parseFloat(p.costPrice);
      const retail = parseFloat(p.sellingPrice);
      const stock = p.currentStock;
      const totalCost = cost * stock;
      const totalRetail = retail * stock;

      totalValuationAtCost += totalCost;
      totalValuationAtRetail += totalRetail;

      return {
        ...p,
        totalValuationCost: totalCost,
        totalValuationRetail: totalRetail,
        potentialProfit: totalRetail - totalCost,
        isLowStock: stock <= p.minimumStockLevel,
      };
    });

    return {
      totalProductsCount: items.length,
      totalValuationAtCost,
      totalValuationAtRetail,
      potentialProfit: totalValuationAtRetail - totalValuationAtCost,
      items,
    };
  }

  /**
   * 4. CUSTOMER DEBT AGING & RECEIVABLES REPORT
   */
  static async getCustomerDebtReport(ctx: TenantContext) {
    requirePermission(ctx, "reports.view");

    const debtors = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        totalDebit: sql<string>`COALESCE(SUM(${customerTransactions.debit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${customerTransactions.credit}), 0)`,
        outstandingDebt: sql<string>`COALESCE(SUM(${customerTransactions.debit}), 0) - COALESCE(SUM(${customerTransactions.credit}), 0)`,
      })
      .from(customers)
      .innerJoin(customerTransactions, eq(customers.id, customerTransactions.customerId))
      .where(eq(customers.businessId, ctx.businessId))
      .groupBy(customers.id)
      .having(sql`COALESCE(SUM(${customerTransactions.debit}), 0) - COALESCE(SUM(${customerTransactions.credit}), 0) > 0`)
      .orderBy(desc(sql`COALESCE(SUM(${customerTransactions.debit}), 0) - COALESCE(SUM(${customerTransactions.credit}), 0)`));

    const totalOutstandingDebt = debtors.reduce(
      (sum, d) => sum + parseFloat(d.outstandingDebt),
      0
    );

    return {
      debtorCount: debtors.length,
      totalOutstandingDebt,
      debtors,
    };
  }

  /**
   * 5. SUPPLIER OBLIGATIONS REPORT
   */
  static async getSupplierObligationsReport(ctx: TenantContext) {
    requirePermission(ctx, "reports.view");

    const creditors = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        phone: suppliers.phone,
        totalCredit: sql<string>`COALESCE(SUM(${supplierTransactions.credit}), 0)`,
        totalDebit: sql<string>`COALESCE(SUM(${supplierTransactions.debit}), 0)`,
        outstandingObligation: sql<string>`COALESCE(SUM(${supplierTransactions.credit}), 0) - COALESCE(SUM(${supplierTransactions.debit}), 0)`,
      })
      .from(suppliers)
      .innerJoin(supplierTransactions, eq(suppliers.id, supplierTransactions.supplierId))
      .where(eq(suppliers.businessId, ctx.businessId))
      .groupBy(suppliers.id)
      .having(sql`COALESCE(SUM(${supplierTransactions.credit}), 0) - COALESCE(SUM(${supplierTransactions.debit}), 0) > 0`)
      .orderBy(desc(sql`COALESCE(SUM(${supplierTransactions.credit}), 0) - COALESCE(SUM(${supplierTransactions.debit}), 0)`));

    const totalObligations = creditors.reduce(
      (sum, c) => sum + parseFloat(c.outstandingObligation),
      0
    );

    return {
      supplierCount: creditors.length,
      totalObligations,
      creditors,
    };
  }

  /**
   * 6. PROFIT & LOSS STATEMENT
   */
  static async getProfitAndLossReport(ctx: TenantContext, input?: z.infer<typeof dateRangeFilterSchema>) {
    requirePermission(ctx, "reports.view");
    const validated = dateRangeFilterSchema.parse(input || {});

    const startDate = validated.startDate ? new Date(validated.startDate) : undefined;
    const endDate = validated.endDate ? new Date(validated.endDate) : undefined;

    return FinancialEngine.getFinancialSummary(ctx, { startDate, endDate });
  }

  /**
   * 7. AUDIT LOG REPORT
   */
  static async getAuditLogReport(ctx: TenantContext, input?: z.infer<typeof auditReportFilterSchema>) {
    requirePermission(ctx, "audit.view");
    const validated = auditReportFilterSchema.parse(input || {});

    const startDate = validated.startDate ? new Date(validated.startDate) : undefined;
    const endDate = validated.endDate ? new Date(validated.endDate) : undefined;

    return db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.businessId, ctx.businessId),
          startDate ? gte(auditLogs.createdAt, startDate) : undefined,
          endDate ? lte(auditLogs.createdAt, endDate) : undefined,
          validated.userId ? eq(auditLogs.userId, validated.userId) : undefined,
          validated.action ? eq(auditLogs.action, validated.action) : undefined,
          validated.entityType ? eq(auditLogs.entityType, validated.entityType) : undefined
        )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(validated.limit);
  }
}
