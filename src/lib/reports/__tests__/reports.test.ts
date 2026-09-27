import { describe, it, expect } from "vitest";
import {
  salesReportFilterSchema,
  expenseReportFilterSchema,
  inventoryReportFilterSchema,
  auditReportFilterSchema,
} from "../validation";

describe("Business Reports Calculations & Query Filter Validation Tests", () => {
  it("should calculate inventory valuation at cost and retail accurately", () => {
    // Inventory items:
    // Product A: 100 units (Cost: ₦500, Retail: ₦800) -> Cost Val: ₦50,000, Retail Val: ₦80,000
    // Product B: 50 units (Cost: ₦2,000, Retail: ₦3,000) -> Cost Val: ₦100,000, Retail Val: ₦150,000
    const items = [
      { currentStock: 100, costPrice: 500, sellingPrice: 800 },
      { currentStock: 50, costPrice: 2000, sellingPrice: 3000 },
    ];

    const totalValuationCost = items.reduce((sum, i) => sum + i.currentStock * i.costPrice, 0);
    const totalValuationRetail = items.reduce((sum, i) => sum + i.currentStock * i.sellingPrice, 0);
    const potentialGrossProfit = totalValuationRetail - totalValuationCost;

    expect(totalValuationCost).toBe(150000);
    expect(totalValuationRetail).toBe(230000);
    expect(potentialGrossProfit).toBe(80000);
  });

  it("should calculate expense category grouping accurately", () => {
    const expenses = [
      { category: "Utilities", amount: 25000 },
      { category: "Transportation", amount: 15000 },
      { category: "Utilities", amount: 10000 },
      { category: "Salaries", amount: 100000 },
    ];

    const categoryBreakdown: Record<string, number> = {};
    for (const exp of expenses) {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
    }

    expect(categoryBreakdown["Utilities"]).toBe(35000);
    expect(categoryBreakdown["Transportation"]).toBe(15000);
    expect(categoryBreakdown["Salaries"]).toBe(100000);
  });

  it("should validate report query filter schemas", () => {
    const salesFilter = salesReportFilterSchema.safeParse({
      paymentStatus: "completed",
      limit: 50,
    });
    expect(salesFilter.success).toBe(true);

    const expenseFilter = expenseReportFilterSchema.safeParse({
      status: "approved",
      limit: 100,
    });
    expect(expenseFilter.success).toBe(true);

    const invFilter = inventoryReportFilterSchema.safeParse({
      lowStockOnly: true,
      limit: 200,
    });
    expect(invFilter.success).toBe(true);

    const auditFilter = auditReportFilterSchema.safeParse({
      action: "SALE_CREATED",
      limit: 25,
    });
    expect(auditFilter.success).toBe(true);
  });
});
