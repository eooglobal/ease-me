"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  TrendingUp,
  ShoppingCart,
  Coins,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { LogExpenseModal } from "@/components/modals/LogExpenseModal";

interface AttentionItem {
  id: string;
  type: "low_stock" | "expiring_batch" | "overdue_debtor" | "unsigned_shift" | "shrinkage";
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  actionText: string;
  actionHref: string;
}

export default function OwnerOverviewPage() {
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [attentionFilter, setAttentionFilter] = useState<"all" | "inventory" | "finance">("all");

  // Production-mode overview metrics
  const metrics = {
    todaySales: 342850,
    todayTransactions: 48,
    todayGrossProfit: 89400,
    grossMarginPercent: 26.1,
    lastWeekSameDaySales: 298500,
    salesGrowthPercent: 14.86,
    cashInTills: 285400,
    openShiftsCount: 2,
    closedWithVarianceCount: 1,
    unreconciledShortage: 2200,
  };

  const attentionItems: AttentionItem[] = [
    {
      id: "att-1",
      type: "unsigned_shift",
      title: "Shift SHF-20261106-01 closed with shortage",
      subtitle: "Cashier Adaeze Okon reported -₦2,200 shortage on POS-01. Manager co-sign required.",
      badge: "-₦2,200 Shortage",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      actionText: "Review Till",
      actionHref: "/owner/shifts",
    },
    {
      id: "att-2",
      type: "expiring_batch",
      title: "Paracetamol 500mg (Batch BATCH-2024-001) expiring soon",
      subtitle: "45 packs expire on Nov 28, 2026 (22 days remaining). First-to-expire discount suggested.",
      badge: "Expires in 22d",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      actionText: "View Batches",
      actionHref: "/owner/inventory/batches",
    },
    {
      id: "att-3",
      type: "overdue_debtor",
      title: "Emeka Obi has ₦45,000 overdue for 71 days",
      subtitle: "Incurred Sep 12, 2026. Credit terms (14 days) exceeded. WhatsApp reminder ready.",
      badge: "71 Days Overdue",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      actionText: "Open Debtor",
      actionHref: "/owner/debtors",
    },
    {
      id: "att-4",
      type: "low_stock",
      title: "Golden Penny Semovita 2kg critically low",
      subtitle: "Current stock: 4 units. Minimum safety reorder threshold: 15 units.",
      badge: "4 left (Min 15)",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      actionText: "Reorder Stock",
      actionHref: "/owner/purchases/new",
    },
    {
      id: "att-5",
      type: "shrinkage",
      title: "Peak Milk 400g Tin dented & spoiled (2 units)",
      subtitle: "Shrinkage recorded by Warehouse Staff. Total write-off loss: ₦5,200.",
      badge: "₦5,200 Loss",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
      actionText: "Loss Report",
      actionHref: "/owner/reports",
    },
  ];

  const filteredAttention = attentionItems.filter((item) => {
    if (attentionFilter === "all") return true;
    if (attentionFilter === "inventory") {
      return item.type === "low_stock" || item.type === "expiring_batch" || item.type === "shrinkage";
    }
    if (attentionFilter === "finance") {
      return item.type === "unsigned_shift" || item.type === "overdue_debtor";
    }
    return true;
  });

  const sevenDaySales = [
    { day: "Sat", date: "Oct 31", revenue: 310500, profit: 78200, orders: 42 },
    { day: "Sun", date: "Nov 01", revenue: 245000, profit: 61800, orders: 35 },
    { day: "Mon", date: "Nov 02", revenue: 289000, profit: 73500, orders: 39 },
    { day: "Tue", date: "Nov 03", revenue: 315400, profit: 82100, orders: 44 },
    { day: "Wed", date: "Nov 04", revenue: 275000, profit: 69800, orders: 37 },
    { day: "Thu", date: "Nov 05", revenue: 298500, profit: 76400, orders: 41 },
    { day: "Today", date: "Nov 06", revenue: 342850, profit: 89400, orders: 48 },
  ];

  const topProducts = [
    { name: "Golden Penny Vegetable Oil 5L", unitsSold: 28, revenue: 280000, grossProfit: 42000, margin: 15.0 },
    { name: "Dangote Sugar 1kg Pack (Carton)", unitsSold: 14, revenue: 168000, grossProfit: 25200, margin: 15.0 },
    { name: "Peak Milk Powder 800g", unitsSold: 32, revenue: 144000, grossProfit: 21600, margin: 15.0 },
    { name: "Indomie Onion Chicken 70g (Carton)", unitsSold: 18, revenue: 126000, grossProfit: 18900, margin: 15.0 },
    { name: "Paracetamol 500mg Pack", unitsSold: 65, revenue: 32500, grossProfit: 13000, margin: 40.0 },
  ];

  return (
    <AppShell role="owner">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Owner Command Center</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Store Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time cash flow, inventory alerts, and profitability across registers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogExpenseOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md shadow-xs transition-colors"
            >
              Log Expense
            </button>
            <Link
              href="/owner/reports"
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>View P&L Report</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* 4 Primary Answer Cards (Six Questions Filter) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Sales */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Today&apos;s Sales</span>
                  <ShoppingCart size={16} className="text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  ₦{metrics.todaySales.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {metrics.todayTransactions} receipts issued
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">vs last Friday</span>
                <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 font-mono">
                  <TrendingUp size={12} />
                  +{metrics.salesGrowthPercent}%
                </span>
              </div>
            </div>

            {/* Card 2: Gross Profit */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Realized Gross Profit</span>
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
                  ₦{metrics.todayGrossProfit.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Revenue minus WAC inventory cost
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Gross Margin</span>
                <span className="font-semibold text-slate-900 font-mono">{metrics.grossMarginPercent}%</span>
              </div>
            </div>

            {/* Card 3: Cash in Tills */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Cash in Tills</span>
                  <Coins size={16} className="text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  ₦{metrics.cashInTills.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {metrics.openShiftsCount} active cashier drawer sessions
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Shift status</span>
                <Link
                  href="/owner/shifts"
                  className="font-semibold text-indigo-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Reconcile tills</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>

            {/* Card 4: Action Required */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Tills with Variance</span>
                  <ShieldAlert size={16} className="text-rose-600" />
                </div>
                <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
                  {metrics.closedWithVarianceCount} Shift
                </div>
                <div className="text-xs text-rose-600 font-medium mt-0.5 font-mono">
                  -₦{metrics.unreconciledShortage.toLocaleString()} pending signature
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Requires co-sign</span>
                <Link
                  href="/owner/shifts"
                  className="font-semibold text-rose-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Sign now</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Section 2 & 4: Attention Panel (No Filler, Actionable Rows Only) */}
          <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Attention Panel</h2>
                  <p className="text-xs text-slate-500">
                    High-priority operational alerts requiring owner decision.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAttentionFilter("all")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    attentionFilter === "all"
                      ? "bg-indigo-700 text-white"
                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  All ({attentionItems.length})
                </button>
                <button
                  onClick={() => setAttentionFilter("inventory")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    attentionFilter === "inventory"
                      ? "bg-indigo-700 text-white"
                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Stock & Expiry
                </button>
                <button
                  onClick={() => setAttentionFilter("finance")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    attentionFilter === "finance"
                      ? "bg-indigo-700 text-white"
                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Cash & Debts
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredAttention.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md border shrink-0 mt-0.5 font-mono ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={item.actionHref}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <span>{item.actionText}</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Two-Column Grid: 7-Day Performance & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: 7-Day Sales Breakdown */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">7-Day Sales Breakdown</h3>
                  <p className="text-xs text-slate-500">Daily revenue and gross profit</p>
                </div>
                <Link
                  href="/owner/sales"
                  className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-0.5"
                >
                  <span>All Sales</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-medium">
                      <th className="pb-2">Day</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2 text-right">Orders</th>
                      <th className="pb-2 text-right">Revenue (₦)</th>
                      <th className="pb-2 text-right">Gross Profit (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sevenDaySales.map((s, idx) => (
                      <tr
                        key={s.date}
                        className={idx === sevenDaySales.length - 1 ? "bg-indigo-50/40 font-semibold" : "hover:bg-slate-50"}
                      >
                        <td className="py-2.5 text-slate-900">{s.day}</td>
                        <td className="py-2.5 text-slate-500">{s.date}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-slate-600">{s.orders}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-slate-900 font-medium">
                          {s.revenue.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                          {s.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Top 5 Products by Gross Profit */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Top Products by Gross Profit</h3>
                  <p className="text-xs text-slate-500">Real profit contributors this week</p>
                </div>
                <Link
                  href="/owner/reports"
                  className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Reports</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.name}
                    className="p-2.5 rounded-md border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[11px] font-mono">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {p.unitsSold} units sold · ₦{p.revenue.toLocaleString()} rev
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-700 font-mono tabular-nums">
                        +₦{p.grossProfit.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">{p.margin}% margin</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Log Expense Modal */}
        <LogExpenseModal
          isOpen={isLogExpenseOpen}
          onClose={() => setIsLogExpenseOpen(false)}
          cashInDrawer={metrics.cashInTills}
          onAddExpense={(exp) => {
            console.log("Logged expense:", exp);
            setIsLogExpenseOpen(false);
          }}
        />
      </div>
    </AppShell>
  );
}
