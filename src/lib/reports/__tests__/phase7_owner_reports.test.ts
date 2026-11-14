import { describe, it, expect } from "vitest";
import { ShrinkageCalc, ShrinkageItem } from "../shrinkage-calc";

describe("Phase 7: Owner Reports, P&L, Cash Flow & Shrinkage Calculations", () => {
  describe("P&L and Profit Metrics Calculation", () => {
    it("computes gross profit and gross margin percentage correctly with single-pass rounding", () => {
      const revenue = 3415000;
      const cogs = 2520000;
      const operatingExpenses = 152000;

      const metrics = ShrinkageCalc.calculateProfitMetrics(revenue, cogs, operatingExpenses);

      expect(metrics.grossProfit).toBe(895000);
      // (895000 / 3415000) * 100 = 26.2079% -> 26.21%
      expect(metrics.grossMarginPercent).toBe(26.21);
    });

    it("computes net operating profit and net margin percentage after deducting operating expenses", () => {
      const revenue = 3415000;
      const cogs = 2520000;
      const operatingExpenses = 152000;

      const metrics = ShrinkageCalc.calculateProfitMetrics(revenue, cogs, operatingExpenses);

      // 895000 - 152000 = 743000
      expect(metrics.netProfit).toBe(743000);
      // (743000 / 3415000) * 100 = 21.7569% -> 21.76%
      expect(metrics.netMarginPercent).toBe(21.76);
    });

    it("handles zero revenue gracefully without division by zero error", () => {
      const metrics = ShrinkageCalc.calculateProfitMetrics(0, 0, 5000);

      expect(metrics.grossProfit).toBe(0);
      expect(metrics.grossMarginPercent).toBe(0);
      expect(metrics.netProfit).toBe(-5000);
      expect(metrics.netMarginPercent).toBe(0);
    });
  });

  describe("Direct Cash Flow Statement Calculations", () => {
    it("computes total cash inflows from cash sales and customer debt settlements", () => {
      const cashSales = 2150000;
      const debtRepayments = 185000;
      const cashExpenses = 68700;
      const supplierPayouts = 1840000;

      const cf = ShrinkageCalc.calculateCashFlow(
        cashSales,
        debtRepayments,
        cashExpenses,
        supplierPayouts
      );

      // Inflows = 2150000 + 185000 = 2335000
      expect(cf.totalInflows).toBe(2335000);
      // Outflows = 68700 + 1840000 = 1908700
      expect(cf.totalOutflows).toBe(1908700);
      // Net change = 2335000 - 1908700 = 426300
      expect(cf.netCashChange).toBe(426300);
    });

    it("accurately handles negative net cash change when payouts exceed inflows", () => {
      const cashSales = 500000;
      const debtRepayments = 50000;
      const cashExpenses = 100000;
      const supplierPayouts = 800000;

      const cf = ShrinkageCalc.calculateCashFlow(
        cashSales,
        debtRepayments,
        cashExpenses,
        supplierPayouts
      );

      expect(cf.totalInflows).toBe(550000);
      expect(cf.totalOutflows).toBe(900000);
      expect(cf.netCashChange).toBe(-350000);
    });
  });

  describe("Shrinkage and Loss Valuation", () => {
    const sampleItems: ShrinkageItem[] = [
      {
        id: "SHR-1",
        productName: "Peak Milk 400g Tin",
        sku: "PM-400",
        quantityLost: 2,
        unitCost: 2600,
        reason: "damaged",
        recordedAt: "2026-11-06",
        recordedBy: "Staff 1",
      },
      {
        id: "SHR-2",
        productName: "Paracetamol 500mg Pack",
        sku: "PARA-500",
        quantityLost: 10,
        unitCost: 350,
        reason: "expired",
        recordedAt: "2026-11-04",
        recordedBy: "Staff 2",
      },
      {
        id: "SHR-3",
        productName: "Indomie Onion Chicken 70g",
        sku: "IND-OC",
        quantityLost: 8,
        unitCost: 220,
        reason: "damaged",
        recordedAt: "2026-11-02",
        recordedBy: "Staff 1",
      },
      {
        id: "SHR-4",
        productName: "Golden Penny Vegetable Oil 750ml",
        sku: "GP-VO750",
        quantityLost: 1,
        unitCost: 2800,
        reason: "theft",
        recordedAt: "2026-10-30",
        recordedBy: "Staff 3",
      },
    ];

    it("evaluates total units lost and total loss valuation at WAC purchase cost", () => {
      const result = ShrinkageCalc.calculateShrinkage(sampleItems);

      // Total units: 2 + 10 + 8 + 1 = 21 units
      expect(result.totalUnitsLost).toBe(21);

      // Valuations:
      // Peak milk: 2 * 2600 = 5200
      // Paracetamol: 10 * 350 = 3500
      // Indomie: 8 * 220 = 1760
      // Oil: 1 * 2800 = 2800
      // Total = 5200 + 3500 + 1760 + 2800 = 13260
      expect(result.totalLossValuation).toBe(13260);
    });

    it("breaks down total shrinkage loss by categorical reason correctly", () => {
      const result = ShrinkageCalc.calculateShrinkage(sampleItems);

      // Damaged: 5200 + 1760 = 6960
      expect(result.lossByReason.damaged).toBe(6960);
      // Expired: 3500
      expect(result.lossByReason.expired).toBe(3500);
      // Theft: 2800
      expect(result.lossByReason.theft).toBe(2800);
      // Internal use: 0
      expect(result.lossByReason.internal_use).toBe(0);
    });
  });

  describe("Inventory Valuation at WAC vs Retail", () => {
    it("calculates cost and retail valuation, unrealized profit, and potential margin", () => {
      const inventory = [
        { quantity: 100, costPrice: 2000, sellingPrice: 2500 }, // cost 200,000, retail 250,000
        { quantity: 50, costPrice: 4000, sellingPrice: 6000 },  // cost 200,000, retail 300,000
      ];

      const val = ShrinkageCalc.calculateInventoryValuation(inventory);

      expect(val.totalUnits).toBe(150);
      expect(val.totalCostValuation).toBe(400000);
      expect(val.totalRetailValuation).toBe(550000);
      expect(val.potentialGrossProfit).toBe(150000);
      // (150000 / 550000) * 100 = 27.27%
      expect(val.potentialMarginPercent).toBe(27.27);
    });
  });
});

