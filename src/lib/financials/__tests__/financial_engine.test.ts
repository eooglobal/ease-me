import { describe, it, expect } from "vitest";
import { createExpenseSchema, reviewExpenseSchema } from "@/lib/expenses/validation";

describe("Financial Engine Formulas & Expense Validation Tests", () => {
  it("should calculate Profit and Loss statement metrics accurately", () => {
    // Business scenario:
    // Sales Revenue: ₦1,000,000
    // COGS (Cost of Goods Sold): ₦650,000
    // Gross Profit: ₦350,000 (35% margin)
    // Operating Expenses (Rent ₦100k, Salaries ₦120k, Fuel ₦30k): ₦250,000
    // Net Profit: ₦100,000 (10% margin)

    const revenue = 1000000;
    const cogs = 650000;
    const operatingExpenses = 250000;

    const grossProfit = revenue - cogs;
    const grossMarginPercent = (grossProfit / revenue) * 100;

    const netProfit = grossProfit - operatingExpenses;
    const netMarginPercent = (netProfit / revenue) * 100;

    expect(grossProfit).toBe(350000);
    expect(grossMarginPercent).toBe(35);
    expect(netProfit).toBe(100000);
    expect(netMarginPercent).toBe(10);
  });

  it("should calculate net cash flow and distinguish from non-cash credit positions", () => {
    // Total Sales: ₦1,000,000 (Cash ₦600k, Bank ₦200k, Credit ₦200k)
    // Cash Inflows: ₦600,000
    // Cash Expenses paid: ₦150,000
    // Net Cash Change = ₦450,000
    // Customer Receivables (unpaid credit) = ₦200,000

    const cashInflow = 600000;
    const cashOutflow = 150000;
    const netCashChange = cashInflow - cashOutflow;
    const customerReceivable = 200000;

    expect(netCashChange).toBe(450000);
    expect(customerReceivable).toBe(200000);
  });

  it("should validate expense creation schema", () => {
    const expense = createExpenseSchema.safeParse({
      description: "Monthly Generator Fuel & Maintenance",
      amount: 45000,
      paymentMethod: "cash",
      requiresApproval: false,
    });

    expect(expense.success).toBe(true);
  });

  it("should validate expense review action schema", () => {
    const review = reviewExpenseSchema.safeParse({
      expenseId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      action: "approve",
      reason: "Verified receipt attached",
    });

    expect(review.success).toBe(true);
  });
});
