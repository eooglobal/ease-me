"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  ExternalLink,
  Receipt,
  Wallet,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { LogExpenseModal } from "@/components/modals/LogExpenseModal";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

export interface ExpenseRecord {
  id: string;
  date: string;
  description: string;
  category: "utilities" | "logistics" | "petty_cash" | "repairs" | "staff" | "other";
  source: "cash" | "bank";
  amount: number;
  recordedBy: string;
  receiptUrl?: string;
}

const CATEGORY_LABELS: Record<string, { label: string; badgeClass: string }> = {
  utilities: { label: "Utilities & Power", badgeClass: "bg-amber-50 text-amber-800 border-amber-200" },
  logistics: { label: "Logistics & Transport", badgeClass: "bg-blue-50 text-blue-800 border-blue-200" },
  petty_cash: { label: "Petty Cash", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  repairs: { label: "Repairs & Maintenance", badgeClass: "bg-purple-50 text-purple-800 border-purple-200" },
  staff: { label: "Staff Welfare", badgeClass: "bg-rose-50 text-rose-800 border-rose-200" },
  other: { label: "Other Overhead", badgeClass: "bg-slate-100 text-slate-800 border-slate-300" },
};

export default function OwnerExpensesPage() {
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: "EXP-20261106-01",
      date: "Nov 06, 2026",
      description: "Generator Fuel (25 Litres Diesel)",
      category: "utilities",
      source: "cash",
      amount: 28500,
      recordedBy: "Adaeze Okon",
      receiptUrl: "https://r2.easeme.store/receipts/diesel-20261106.jpg",
    },
    {
      id: "EXP-20261106-02",
      date: "Nov 06, 2026",
      description: "Dispatch bike delivery to Ikoyi customer",
      category: "logistics",
      source: "cash",
      amount: 3500,
      recordedBy: "Adaeze Okon",
      receiptUrl: undefined,
    },
    {
      id: "EXP-20261105-01",
      date: "Nov 05, 2026",
      description: "Shop cleaning supplies & disinfectant",
      category: "petty_cash",
      source: "cash",
      amount: 4200,
      recordedBy: "Emeka Chidi",
      receiptUrl: "https://r2.easeme.store/receipts/clean-20261105.jpg",
    },
    {
      id: "EXP-20261104-01",
      date: "Nov 04, 2026",
      description: "Store shelf reinforcement welding",
      category: "repairs",
      source: "bank",
      amount: 18000,
      recordedBy: "Owner Admin",
      receiptUrl: "https://r2.easeme.store/receipts/welder-invoice.pdf",
    },
    {
      id: "EXP-20261103-01",
      date: "Nov 03, 2026",
      description: "Monthly Internet Fibre Subscription",
      category: "utilities",
      source: "bank",
      amount: 24500,
      recordedBy: "Owner Admin",
      receiptUrl: "https://r2.easeme.store/receipts/spectranet-nov.pdf",
    },
    {
      id: "EXP-20261102-01",
      date: "Nov 02, 2026",
      description: "Overtime dinner for inventory audit team",
      category: "staff",
      source: "cash",
      amount: 7500,
      recordedBy: "Adaeze Okon",
      receiptUrl: undefined,
    },
  ]);

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter;
    const matchesSource = sourceFilter === "all" || exp.source === sourceFilter;

    return matchesSearch && matchesCategory && matchesSource;
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cashExpenses = expenses.filter((e) => e.source === "cash").reduce((sum, e) => sum + e.amount, 0);
  const bankExpenses = expenses.filter((e) => e.source === "bank").reduce((sum, e) => sum + e.amount, 0);
  const withReceiptCount = expenses.filter((e) => !!e.receiptUrl).length;
  const receiptRate = expenses.length > 0 ? Math.round((withReceiptCount / expenses.length) * 100) : 0;

  const handleExportCSV = () => {
    const headers = [
      "Expense ID",
      "Date",
      "Description",
      "Category",
      "Paid From",
      "Amount (NGN)",
      "Recorded By",
      "Receipt Attached",
    ];

    const rows = filteredExpenses.map((e) => [
      e.id,
      e.date,
      e.description,
      CATEGORY_LABELS[e.category]?.label || e.category,
      e.source === "cash" ? "Drawer Petty Cash" : "Bank Transfer",
      e.amount,
      e.recordedBy,
      e.receiptUrl ? "Yes (R2)" : "No",
    ]);

    const csvData = buildCSV(headers, rows);
    downloadCSV(`Operating_Expenses_${new Date().toISOString().slice(0, 10)}.csv`, csvData);
  };

  const handleAddExpense = (newExp: {
    description: string;
    amount: number;
    category: string;
    source: "cash" | "bank";
    receiptUrl?: string;
  }) => {
    const record: ExpenseRecord = {
      id: `EXP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(expenses.length + 1).padStart(2, "0")}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      description: newExp.description,
      category: newExp.category as any,
      source: newExp.source,
      amount: newExp.amount,
      recordedBy: "Owner Admin",
      receiptUrl: newExp.receiptUrl,
    };
    setExpenses([record, ...expenses]);
  };

  return (
    <AppShell role="owner">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operating Expenses</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-full font-mono">
                {expenses.length} records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Record overhead, diesel disbursements, repairs, and audit proof receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsLogExpenseOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Log Expense</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Total Expenses</span>
                <DollarSign size={16} className="text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                ₦{totalExpenseAmount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">This billing cycle</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Paid via Till Cash</span>
                <Wallet size={16} className="text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
                ₦{cashExpenses.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">Deducted from drawer sessions</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Paid via Bank Transfer</span>
                <Building2 size={16} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
                ₦{bankExpenses.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">Corporate bank disbursements</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Receipt Audit Rate</span>
                <FileText size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
                {receiptRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {withReceiptCount} of {expenses.length} with proof document
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search description, ID, or recorded by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-700 focus:border-indigo-700 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter size={14} />
                <span>Category:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-1 focus:ring-indigo-700 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="utilities">Utilities & Power</option>
                <option value="logistics">Logistics & Transport</option>
                <option value="petty_cash">Petty Cash</option>
                <option value="repairs">Repairs & Maintenance</option>
                <option value="staff">Staff Welfare</option>
                <option value="other">Other Overhead</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-1 focus:ring-indigo-700 outline-none"
              >
                <option value="all">All Sources</option>
                <option value="cash">Drawer Cash</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date & ID</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid From</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4">Receipt Proof</th>
                    <th className="py-3 px-4 text-right">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No expenses match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const cat = CATEGORY_LABELS[exp.category] || {
                        label: exp.category,
                        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
                      };

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{exp.date}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{exp.id}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{exp.description}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${cat.badgeClass}`}
                            >
                              {cat.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                exp.source === "cash" ? "text-amber-800" : "text-blue-800"
                              }`}
                            >
                              {exp.source === "cash" ? "Till Cash" : "Bank Transfer"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{exp.recordedBy}</td>
                          <td className="py-3 px-4">
                            {exp.receiptUrl ? (
                              <a
                                href={exp.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                              >
                                <span>View Receipt</span>
                                <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No receipt</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                            ₦{exp.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Log Expense Modal */}
        <LogExpenseModal
          isOpen={isLogExpenseOpen}
          onClose={() => setIsLogExpenseOpen(false)}
          cashInDrawer={285400}
          onAddExpense={handleAddExpense}
        />
      </div>
    </AppShell>
  );
}

