/**
 * Pure calculation functions for Shrinkage, Financial Reports, and Dashboard Metrics
 * Client and server safe
 */

export interface ShrinkageItem {
  id: string;
  productName: string;
  sku: string;
  quantityLost: number;
  unitCost: number;
  reason: "theft" | "damaged" | "expired" | "internal_use" | "reconciliation_correction";
  recordedAt: string;
  recordedBy: string;
}

export interface ShrinkageSummary {
  totalUnitsLost: number;
  totalLossValuation: number;
  lossByReason: Record<string, number>;
}

export class ShrinkageCalc {
  /**
   * Section 4.2 & 7: Computes shrinkage loss valuation
   */
  public static calculateShrinkage(items: ShrinkageItem[]): ShrinkageSummary {
    let totalUnitsLost = 0;
    let totalLossValuation = 0;
    const lossByReason: Record<string, number> = {
      theft: 0,
      damaged: 0,
      expired: 0,
      internal_use: 0,
      reconciliation_correction: 0,
    };

    for (const item of items) {
      const units = Math.abs(Number(item.quantityLost));
      const valuation = Math.round(units * Number(item.unitCost) * 100) / 100;

      totalUnitsLost += units;
      totalLossValuation += valuation;

      if (lossByReason[item.reason] !== undefined) {
        lossByReason[item.reason] += valuation;
      } else {
        lossByReason[item.reason] = valuation;
      }
    }

    return {
      totalUnitsLost,
      totalLossValuation: Math.round(totalLossValuation * 100) / 100,
      lossByReason,
    };
  }

  /**
   * Section 7: Computes Gross & Net Profit Metrics
   */
  public static calculateProfitMetrics(
    revenue: number,
    cogs: number,
    operatingExpenses: number
  ): {
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPercent: number;
    operatingExpenses: number;
    netProfit: number;
    netMarginPercent: number;
  } {
    const rev = Math.round(Number(revenue) * 100) / 100;
    const cost = Math.round(Number(cogs) * 100) / 100;
    const exp = Math.round(Number(operatingExpenses) * 100) / 100;

    const grossProfit = Math.round((rev - cost) * 100) / 100;
    const grossMarginPercent = rev > 0 ? Math.round((grossProfit / rev) * 10000) / 100 : 0;

    const netProfit = Math.round((grossProfit - exp) * 100) / 100;
    const netMarginPercent = rev > 0 ? Math.round((netProfit / rev) * 10000) / 100 : 0;

    return {
      revenue: rev,
      cogs: cost,
      grossProfit,
      grossMarginPercent,
      operatingExpenses: exp,
      netProfit,
      netMarginPercent,
    };
  }

  /**
   * Computes Cash Flow Inflows, Outflows, and Net Change
   */
  public static calculateCashFlow(
    cashSales: number,
    debtRepayments: number,
    cashExpenses: number,
    supplierPayouts: number
  ): {
    totalInflows: number;
    totalOutflows: number;
    netCashChange: number;
  } {
    const totalInflows = Math.round((Number(cashSales) + Number(debtRepayments)) * 100) / 100;
    const totalOutflows = Math.round((Number(cashExpenses) + Number(supplierPayouts)) * 100) / 100;
    const netCashChange = Math.round((totalInflows - totalOutflows) * 100) / 100;

    return {
      totalInflows,
      totalOutflows,
      netCashChange,
    };
  }

  /**
   * Computes Inventory Valuation at WAC cost and Potential Retail Value
   */
  public static calculateInventoryValuation(
    items: Array<{ quantity: number; costPrice: number; sellingPrice: number }>
  ): {
    totalUnits: number;
    totalCostValuation: number;
    totalRetailValuation: number;
    potentialGrossProfit: number;
    potentialMarginPercent: number;
  } {
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    for (const item of items) {
      const q = Math.max(0, Number(item.quantity));
      const cost = Math.max(0, Number(item.costPrice));
      const retail = Math.max(0, Number(item.sellingPrice));

      totalUnits += q;
      totalCostValuation += Math.round(q * cost * 100) / 100;
      totalRetailValuation += Math.round(q * retail * 100) / 100;
    }

    const costVal = Math.round(totalCostValuation * 100) / 100;
    const retailVal = Math.round(totalRetailValuation * 100) / 100;
    const potentialGrossProfit = Math.round((retailVal - costVal) * 100) / 100;
    const potentialMarginPercent =
      retailVal > 0 ? Math.round((potentialGrossProfit / retailVal) * 10000) / 100 : 0;

    return {
      totalUnits,
      totalCostValuation: costVal,
      totalRetailValuation: retailVal,
      potentialGrossProfit,
      potentialMarginPercent,
    };
  }
}
