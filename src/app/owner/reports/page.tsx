"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  PackageCheck,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ShrinkageCalc, ShrinkageItem } from "@/lib/reports/shrinkage-calc";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

type ReportTab = "pnl" | "cashflow" | "inventory" | "shrinkage";

export default function OwnerReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("pnl");
  const [dateRange, setDateRange] = useState("this_month");

  // Sample production-grade data for the 4 reports
  // 1. P&L Data
  const pnlData = {
    grossRevenue: 3450000,
    discounts: 35000,
    netRevenue: 3415000,
    cogs: 2520000, // Based on WAC snapshot at sale
    operatingExpenses: {
      utilities: 53000,
      logistics: 18500,
      petty_cash: 12200,
      repairs: 18000,
      staff: 22500,
      other: 11000,
    },
    shrinkageLoss: 16800,
  };

  const totalExpenses =
    Object.values(pnlData.operatingExpenses).reduce((a, b) => a + b, 0) + pnlData.shrinkageLoss;
  const pnlMetrics = ShrinkageCalc.calculateProfitMetrics(
    pnlData.netRevenue,
    pnlData.cogs,
    totalExpenses
  );

  // 2. Cash Flow Data
  const cashFlowData = {
    cashSales: 2150000,
    bankSales: 1265000,
    debtRepayments: 185000,
    cashExpenses: 68700,
    supplierPayouts: 1840000,
    openingCashBalance: 420000,
  };

  const cashFlowMetrics = ShrinkageCalc.calculateCashFlow(
    cashFlowData.cashSales,
    cashFlowData.debtRepayments,
    cashFlowData.cashExpenses,
    cashFlowData.supplierPayouts
  );
  const closingCashBalance = cashFlowData.openingCashBalance + cashFlowMetrics.netCashChange;

  // 3. Inventory Valuation Data
  const inventoryData = [
    { category: "Beverages & Milk", units: 1420, costValue: 2840000, retailValue: 3550000 },
    { category: "Grains & Flours", units: 890, costValue: 3115000, retailValue: 3780000 },
    { category: "Oils & Condiments", units: 410, costValue: 2460000, retailValue: 2952000 },
    { category: "Pharmaceuticals & First Aid", units: 1850, costValue: 925000, retailValue: 1387500 },
    { category: "Toiletries & Cleaning", units: 620, costValue: 744000, retailValue: 992000 },
  ];

  const totalInventoryUnits = inventoryData.reduce((s, i) => s + i.units, 0);
  const totalCostValuation = inventoryData.reduce((s, i) => s + i.costValue, 0);
  const totalRetailValuation = inventoryData.reduce((s, i) => s + i.retailValue, 0);
  const unrealizedProfit = totalRetailValuation - totalCostValuation;
  const unrealizedMargin =
    totalRetailValuation > 0 ? Math.round((unrealizedProfit / totalRetailValuation) * 10000) / 100 : 0;

  // 4. Shrinkage & Loss Data
  const shrinkageItems: ShrinkageItem[] = [
    {
      id: "SHR-001",
      productName: "Peak Milk 400g Tin",
      sku: "PM-400",
      quantityLost: 2,
      unitCost: 2600,
      reason: "damaged",
      recordedAt: "Nov 06, 2026",
      recordedBy: "Warehouse Clerk",
    },
    {
      id: "SHR-002",
      productName: "Paracetamol 500mg Pack",
      sku: "PARA-500",
      quantityLost: 10,
      unitCost: 350,
      reason: "expired",
      recordedAt: "Nov 04, 2026",
      recordedBy: "Inventory Auditor",
    },
    {
      id: "SHR-003",
      productName: "Indomie Onion Chicken 70g",
      sku: "IND-OC",
      quantityLost: 8,
      unitCost: 220,
      reason: "damaged",
      recordedAt: "Nov 02, 2026",
      recordedBy: "Floor Supervisor",
    },
    {
      id: "SHR-004",
      productName: "Golden Penny Vegetable Oil 750ml",
      sku: "GP-VO750",
      quantityLost: 1,
      unitCost: 2800,
      reason: "theft",
      recordedAt: "Oct 30, 2026",
      recordedBy: "Store Manager",
    },
    {
      id: "SHR-005",
      productName: "Dettol Antiseptic 250ml",
      sku: "DET-250",
      quantityLost: 1,
      unitCost: 3540,
      reason: "internal_use",
      recordedAt: "Oct 28, 2026",
      recordedBy: "Owner Admin",
    },
  ];

  const shrinkageSummary = ShrinkageCalc.calculateShrinkage(shrinkageItems);
  const shrinkagePercentOfRevenue =
    pnlData.netRevenue > 0
      ? Math.round((shrinkageSummary.totalLossValuation / pnlData.netRevenue) * 10000) / 100
      : 0;

  // CSV Export handler for currently active tab
  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (activeTab === "pnl") {
      const headers = ["Financial Line Item", "Amount (NGN)", "Notes"];
      const rows = [
        ["Gross Revenue", pnlData.grossRevenue, "Total sales before discounts"],
        ["Sales Discounts", -pnlData.discounts, "POS line item & basket discounts"],
        ["Net Revenue", pnlData.netRevenue, "Gross Revenue minus Discounts"],
        ["Cost of Goods Sold (COGS)", -pnlData.cogs, "WAC inventory cost snapshot at sale"],
        ["Gross Profit", pnlMetrics.grossProfit, `${pnlMetrics.grossMarginPercent}% gross margin`],
        ["Operating Expense - Utilities & Power", -pnlData.operatingExpenses.utilities, "Generator diesel, PHCN electricity"],
        ["Operating Expense - Logistics", -pnlData.operatingExpenses.logistics, "Dispatch & transport"],
        ["Operating Expense - Petty Cash", -pnlData.operatingExpenses.petty_cash, "Store supplies"],
        ["Operating Expense - Maintenance", -pnlData.operatingExpenses.repairs, "Welding & fixtures"],
        ["Operating Expense - Staff Welfare", -pnlData.operatingExpenses.staff, "Meals & tea allowance"],
        ["Operating Expense - Other", -pnlData.operatingExpenses.other, "Miscellaneous"],
        ["Shrinkage & Write-Off Loss", -pnlData.shrinkageLoss, "Damaged, expired, theft write-offs"],
        ["Total Operating Expenses & Losses", -totalExpenses, "Total deductions from gross profit"],
        ["Net Operating Income (EBITDA)", pnlMetrics.netProfit, `${pnlMetrics.netMarginPercent}% net margin`],
      ];
      downloadCSV(`Income_Statement_PL_${timestamp}.csv`, buildCSV(headers, rows));
    } else if (activeTab === "cashflow") {
      const headers = ["Cash Flow Activity", "Inflow (NGN)", "Outflow (NGN)", "Net (NGN)"];
      const rows = [
        ["Cash Sales Collected", cashFlowData.cashSales, 0, cashFlowData.cashSales],
        ["Customer Debt Repayments Collected", cashFlowData.debtRepayments, 0, cashFlowData.debtRepayments],
        ["Cash Operating Expenses Paid", 0, cashFlowData.cashExpenses, -cashFlowData.cashExpenses],
        ["Supplier Payouts & Intake Payments", 0, cashFlowData.supplierPayouts, -cashFlowData.supplierPayouts],
        ["Opening Cash Balance", cashFlowData.openingCashBalance, 0, cashFlowData.openingCashBalance],
        ["Net Cash Change", cashFlowMetrics.totalInflows, cashFlowMetrics.totalOutflows, cashFlowMetrics.netCashChange],
        ["Closing Cash Position", closingCashBalance, 0, closingCashBalance],
      ];
      downloadCSV(`Cash_Flow_Statement_${timestamp}.csv`, buildCSV(headers, rows));
    } else if (activeTab === "inventory") {
      const headers = [
        "Product Category",
        "Units in Stock",
        "Valuation at Cost (NGN)",
        "Valuation at Retail (NGN)",
        "Unrealized Margin (NGN)",
        "Margin (%)",
      ];
      const rows = inventoryData.map((i) => {
        const marginVal = i.retailValue - i.costValue;
        const marginPct = i.retailValue > 0 ? Math.round((marginVal / i.retailValue) * 10000) / 100 : 0;
        return [i.category, i.units, i.costValue, i.retailValue, marginVal, `${marginPct}%`];
      });
      rows.push([
        "TOTAL",
        totalInventoryUnits,
        totalCostValuation,
        totalRetailValuation,
        unrealizedProfit,
        `${unrealizedMargin}%`,
      ]);
      downloadCSV(`Inventory_Valuation_${timestamp}.csv`, buildCSV(headers, rows));
    } else if (activeTab === "shrinkage") {
      const headers = [
        "Adjustment ID",
        "Product Name",
        "SKU",
        "Units Lost",
        "Unit Cost (NGN)",
        "Total Loss (NGN)",
        "Reason",
        "Recorded At",
        "Recorded By",
      ];
      const rows = shrinkageItems.map((s) => [
        s.id,
        s.productName,
        s.sku,
        s.quantityLost,
        s.unitCost,
        Math.round(s.quantityLost * s.unitCost),
        s.reason,
        s.recordedAt,
        s.recordedBy,
      ]);
      downloadCSV(`Shrinkage_Loss_Report_${timestamp}.csv`, buildCSV(headers, rows));
    }
  };

  return (
    <AppShell role="owner">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial & Operational Reports</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-mono">
                WAC Basis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Accurate P&L, real cash flows, inventory valuation, and shrinkage audit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 shadow-xs">
              <Calendar size={14} className="text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-slate-700 font-medium outline-none cursor-pointer"
              >
                <option value="this_month">This Month (Nov 2026)</option>
                <option value="last_month">Last Month (Oct 2026)</option>
                <option value="q4">Q4 2026</option>
                <option value="year">Full Year 2026</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pnl")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "pnl"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <BarChart3 size={15} />
            <span>Income Statement (P&L)</span>
          </button>

          <button
            onClick={() => setActiveTab("cashflow")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "cashflow"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <TrendingUp size={15} />
            <span>Cash Flow</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "inventory"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <PackageCheck size={15} />
            <span>Inventory Valuation</span>
          </button>

          <button
            onClick={() => setActiveTab("shrinkage")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "shrinkage"
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <AlertTriangle size={15} />
            <span>Shrinkage & Loss ({shrinkageItems.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* TAB 1: INCOME STATEMENT (P&L) */}
          {activeTab === "pnl" && (
            <div className="space-y-6">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Revenue</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    ₦{pnlData.netRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    After ₦{pnlData.discounts.toLocaleString()} discounts
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cost of Goods Sold</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    ₦{pnlData.cogs.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Direct WAC intake costs
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Profit</span>
                  <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                    ₦{pnlMetrics.grossProfit.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mt-1 font-mono">
                    {pnlMetrics.grossMarginPercent}% Gross Margin
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Operating Income</span>
                  <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums mt-1">
                    ₦{pnlMetrics.netProfit.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 mt-1 font-mono">
                    {pnlMetrics.netMarginPercent}% Net Margin
                  </div>
                </div>
              </div>

              {/* Detailed Income Statement Table */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Income Statement Breakdown</h3>
                  <span className="text-xs text-slate-500">All figures in NGN (₦)</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {/* Revenue Section */}
                  <div className="p-4 bg-slate-50/30">
                    <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                      <span>Gross Sales Revenue</span>
                      <span className="font-mono tabular-nums">₦{pnlData.grossRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 mt-1.5 pl-4">
                      <span>Less: Sales Discounts & Markdown</span>
                      <span className="font-mono tabular-nums text-rose-600">-₦{pnlData.discounts.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-slate-800 mt-2 pt-2 border-t border-slate-200 pl-4">
                      <span>Net Sales Revenue</span>
                      <span className="font-mono tabular-nums">₦{pnlData.netRevenue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* COGS Section */}
                  <div className="p-4">
                    <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                      <span>Cost of Goods Sold (COGS)</span>
                      <span className="font-mono tabular-nums text-rose-700">-₦{pnlData.cogs.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 pl-4">
                      Calculated from exact weighted-average cost snapshot at time of sale.
                    </p>
                  </div>

                  {/* Gross Profit Subtotal */}
                  <div className="p-4 bg-emerald-50/30">
                    <div className="flex items-center justify-between font-bold text-emerald-800 text-sm">
                      <span>Gross Profit</span>
                      <span className="font-mono tabular-nums text-base">₦{pnlMetrics.grossProfit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-semibold mt-1 pl-4 font-mono text-[11px]">
                      <span>Gross Margin</span>
                      <span>{pnlMetrics.grossMarginPercent}%</span>
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div className="p-4 space-y-2">
                    <div className="font-bold text-slate-900 text-sm">Operating Overhead & Shrinkage</div>
                    <div className="pl-4 space-y-1.5 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Utilities & Power (Generator Fuel, PHCN)</span>
                        <span className="font-mono tabular-nums">₦{pnlData.operatingExpenses.utilities.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Logistics & Transport</span>
                        <span className="font-mono tabular-nums">₦{pnlData.operatingExpenses.logistics.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Petty Cash & Consumables</span>
                        <span className="font-mono tabular-nums">₦{pnlData.operatingExpenses.petty_cash.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Maintenance & Repairs</span>
                        <span className="font-mono tabular-nums">₦{pnlData.operatingExpenses.repairs.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Staff Welfare & Meals</span>
                        <span className="font-mono tabular-nums">₦{pnlData.operatingExpenses.staff.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Other Operational Expenses</span>
                        <span className="font-mono tabular-nums">₦{pnlData.operatingExpenses.other.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-rose-700 font-semibold">
                        <span>Inventory Shrinkage & Damaged Write-offs</span>
                        <span className="font-mono tabular-nums">₦{pnlData.shrinkageLoss.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between font-semibold text-slate-800 pt-2 border-t border-slate-200 pl-4">
                      <span>Total Operating Overhead</span>
                      <span className="font-mono tabular-nums text-rose-700">-₦{totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Net Operating Income */}
                  <div className="p-4 bg-indigo-50/50">
                    <div className="flex items-center justify-between font-bold text-indigo-950 text-base">
                      <span>Net Operating Income (EBITDA)</span>
                      <span className="font-mono tabular-nums text-lg">₦{pnlMetrics.netProfit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-indigo-800 font-semibold mt-1 pl-4 font-mono text-xs">
                      <span>Net Profit Margin</span>
                      <span>{pnlMetrics.netMarginPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CASH FLOW */}
          {activeTab === "cashflow" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Opening Cash</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    ₦{cashFlowData.openingCashBalance.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Period starting float</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Operating Inflows</span>
                  <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                    +₦{cashFlowMetrics.totalInflows.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Cash sales + Debt repayments</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Operating Outflows</span>
                  <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums mt-1">
                    -₦{cashFlowMetrics.totalOutflows.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Suppliers + Till Petty cash</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Cash Position</span>
                  <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums mt-1">
                    ₦{closingCashBalance.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 mt-1 font-mono">
                    {cashFlowMetrics.netCashChange >= 0 ? "+" : ""}₦{cashFlowMetrics.netCashChange.toLocaleString()} net change
                  </div>
                </div>
              </div>

              {/* Cash Flow Ledger */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900">Direct Cash Flow Statement</h3>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-4 space-y-2">
                    <div className="font-bold text-emerald-700 text-sm flex items-center gap-1.5">
                      <ArrowDownRight size={16} />
                      <span>Cash Inflows (Collected)</span>
                    </div>
                    <div className="pl-5 space-y-1.5 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Cash Sales (Received in Tills)</span>
                        <span className="font-mono tabular-nums text-slate-900 font-semibold">
                          ₦{cashFlowData.cashSales.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Customer Debt Repayments (Cash)</span>
                        <span className="font-mono tabular-nums text-slate-900 font-semibold">
                          ₦{cashFlowData.debtRepayments.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="font-bold text-rose-700 text-sm flex items-center gap-1.5">
                      <ArrowUpRight size={16} />
                      <span>Cash Outflows (Disbursed)</span>
                    </div>
                    <div className="pl-5 space-y-1.5 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Supplier Purchase Intake Disbursements</span>
                        <span className="font-mono tabular-nums text-rose-700 font-semibold">
                          -₦{cashFlowData.supplierPayouts.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Till Petty Cash Operating Expenses</span>
                        <span className="font-mono tabular-nums text-rose-700 font-semibold">
                          -₦{cashFlowData.cashExpenses.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/70 flex items-center justify-between font-bold text-sm text-slate-900">
                    <span>Net Operating Cash Flow</span>
                    <span className="font-mono tabular-nums text-base text-emerald-700">
                      +₦{cashFlowMetrics.netCashChange.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY VALUATION */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stock Count</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {totalInventoryUnits.toLocaleString()} units
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Across 5 categories</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Valuation at Cost (WAC)</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    ₦{totalCostValuation.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Weighted-average inventory asset</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Potential Retail Value</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    ₦{totalRetailValuation.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">At active selling prices</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unrealized Gross Margin</span>
                  <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                    ₦{unrealizedProfit.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mt-1 font-mono">
                    {unrealizedMargin}% Potential Margin
                  </div>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Units in Stock</th>
                        <th className="py-3 px-4 text-right">Cost Value (WAC)</th>
                        <th className="py-3 px-4 text-right">Retail Value</th>
                        <th className="py-3 px-4 text-right">Unrealized Margin (₦)</th>
                        <th className="py-3 px-4 text-right">Margin (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryData.map((cat) => {
                        const marginVal = cat.retailValue - cat.costValue;
                        const marginPct =
                          cat.retailValue > 0 ? Math.round((marginVal / cat.retailValue) * 10000) / 100 : 0;

                        return (
                          <tr key={cat.category} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{cat.category}</td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                              {cat.units.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-medium">
                              ₦{cat.costValue.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-medium">
                              ₦{cat.retailValue.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                              ₦{marginVal.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 font-semibold">
                              {marginPct}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                        <td className="py-3 px-4 text-slate-900">TOTAL</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                          {totalInventoryUnits.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                          ₦{totalCostValuation.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                          ₦{totalRetailValuation.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                          ₦{unrealizedProfit.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                          {unrealizedMargin}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHRINKAGE & LOSS */}
          {activeTab === "shrinkage" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Units Written Off</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {shrinkageSummary.totalUnitsLost} items
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Recorded shrinkage adjustments</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Loss Valuation</span>
                  <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums mt-1">
                    ₦{shrinkageSummary.totalLossValuation.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Valued at WAC purchase cost</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Shrinkage Rate</span>
                  <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
                    {shrinkagePercentOfRevenue}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">As % of net sales revenue</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Top Shrinkage Cause</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 capitalize">
                    Damaged / Broken
                  </div>
                  <div className="text-xs text-slate-500 mt-1">₦6,960 loss from dented packs</div>
                </div>
              </div>

              {/* Shrinkage Table */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Adjustment ID & Date</th>
                        <th className="py-3 px-4">Product Name & SKU</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4 text-right">Units Lost</th>
                        <th className="py-3 px-4 text-right">Unit Cost (WAC)</th>
                        <th className="py-3 px-4 text-right">Total Loss (₦)</th>
                        <th className="py-3 px-4">Logged By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shrinkageItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{item.id}</p>
                            <p className="text-[11px] text-slate-400">{item.recordedAt}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{item.sku}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border capitalize ${
                                item.reason === "theft"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : item.reason === "expired"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-slate-100 text-slate-800 border-slate-300"
                              }`}
                            >
                              {item.reason.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-semibold">
                            {item.quantityLost}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                            ₦{item.unitCost.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-700">
                            -₦{(item.quantityLost * item.unitCost).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{item.recordedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}

