"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  X,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { exportSalesToCSV } from "@/lib/export/export-utils";

interface SaleTransactionDetail {
  id: string;
  invoiceNumber: string;
  cashierName: string;
  customerName?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  totalCostSnapshot: number; // Historical WAC
  grossProfit: number;
  paymentMethod: "cash" | "card" | "bank_transfer" | "credit_debt" | "split";
  status: "completed" | "voided" | "refunded";
  timestamp: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    totalPrice: number;
    totalCost: number;
  }>;
}

export default function OwnerSalesHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedSale, setSelectedSale] = useState<SaleTransactionDetail | null>(null);

  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  const [salesList, setSalesList] = useState<SaleTransactionDetail[]>([
    {
      id: "sale-1",
      invoiceNumber: "INV-20261106-7812",
      cashierName: "Adaeze Okon",
      customerName: "Walk-in Retail Customer",
      subtotal: 2700,
      discount: 0,
      tax: 0,
      total: 2700,
      totalCostSnapshot: 1700,
      grossProfit: 1000,
      paymentMethod: "cash",
      status: "completed",
      timestamp: "Today, 10:14 AM",
      items: [
        {
          name: "Paracetamol 500mg Pack (100s)",
          sku: "MED-001",
          quantity: 2,
          unitPrice: 850,
          unitCost: 550,
          totalPrice: 1700,
          totalCost: 1100,
        },
        {
          name: "Eva Mineral Water 75cl",
          sku: "BEV-201",
          quantity: 4,
          unitPrice: 250,
          unitCost: 150,
          totalPrice: 1000,
          totalCost: 600,
        },
      ],
    },
    {
      id: "sale-2",
      invoiceNumber: "INV-20261106-7809",
      cashierName: "Adaeze Okon",
      customerName: "Alhaji Danladi Enterprises",
      subtotal: 12200,
      discount: 0,
      tax: 0,
      total: 12200,
      totalCostSnapshot: 9400,
      grossProfit: 2800,
      paymentMethod: "bank_transfer",
      status: "completed",
      timestamp: "Today, 09:42 AM",
      items: [
        {
          name: "Royal Stallion Rice 5kg",
          sku: "GROC-102",
          quantity: 1,
          unitPrice: 11200,
          unitCost: 8800,
          totalPrice: 11200,
          totalCost: 8800,
        },
        {
          name: "Fearless Energy Drink 500ml",
          sku: "BEV-203",
          quantity: 2,
          unitPrice: 500,
          unitCost: 300,
          totalPrice: 1000,
          totalCost: 600,
        },
      ],
    },
    {
      id: "sale-3",
      invoiceNumber: "INV-20261106-7798",
      cashierName: "Ibrahim Musa",
      customerName: "Mrs. Folashade Adeleke",
      subtotal: 2600,
      discount: 0,
      tax: 0,
      total: 2600,
      totalCostSnapshot: 1800,
      grossProfit: 800,
      paymentMethod: "card",
      status: "completed",
      timestamp: "Today, 09:05 AM",
      items: [
        {
          name: "Artemether-Lumefantrine ACT (24s)",
          sku: "MED-005",
          quantity: 1,
          unitPrice: 2600,
          unitCost: 1800,
          totalPrice: 2600,
          totalCost: 1800,
        },
      ],
    },
    {
      id: "sale-4",
      invoiceNumber: "INV-20261105-7740",
      cashierName: "Ibrahim Musa",
      customerName: "Walk-in Customer",
      subtotal: 5900,
      discount: 0,
      tax: 0,
      total: 5900,
      totalCostSnapshot: 4800,
      grossProfit: 1100,
      paymentMethod: "cash",
      status: "voided",
      timestamp: "Yesterday, 05:20 PM",
      items: [
        {
          name: "Refined Sunflower Oil 3L",
          sku: "GROC-103",
          quantity: 1,
          unitPrice: 5900,
          unitCost: 4800,
          totalPrice: 5900,
          totalCost: 4800,
        },
      ],
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleVoidSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim() || !selectedSale) {
      triggerToast("A mandatory reason is required to void a sale.");
      return;
    }

    setIsVoiding(true);
    setTimeout(() => {
      setSalesList((prev) =>
        prev.map((s) => (s.id === selectedSale.id ? { ...s, status: "voided" as const } : s))
      );
      setSelectedSale({ ...selectedSale, status: "voided" });
      setIsVoiding(false);
      setVoidModalOpen(false);
      setVoidReason("");
      triggerToast(`Sale ${selectedSale.invoiceNumber} voided. Restock movement posted to ledger.`);
    }, 400);
  };

  const filteredSales = salesList.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMethod = filterMethod === "all" || s.paymentMethod === filterMethod;
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalRevenue = salesList.filter((s) => s.status === "completed").reduce((sum, s) => sum + s.total, 0);
  const totalGrossProfit = salesList
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.grossProfit, 0);

  return (
    <AppShell role="owner" userEmail="owner@alpha-retail.ng" userName="Chukwuma Obi" businessName="Alpha Retail Ltd">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales & Orders Ledger</h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Audit Trail
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable historical transactions with snapshot costs, gross profit margins, and tender breakdown
            </p>
          </div>

          <button
            onClick={() =>
              exportSalesToCSV(
                salesList.map((s) => ({
                  id: s.invoiceNumber,
                  time: s.timestamp,
                  items: s.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
                  amount: s.total,
                  method: s.paymentMethod,
                  cashier: s.cashierName,
                  customer: s.customerName,
                }))
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors self-start sm:self-auto"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Gross Sales Revenue</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ₦{totalRevenue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Total completed transactions</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Historical Gross Profit</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              ₦{totalGrossProfit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Calculated from snapshot WAC costs
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Transaction Count</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{salesList.length} Orders</div>
            <p className="text-[11px] text-slate-500 mt-1">Across all registered till terminals</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, cashier, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-700"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash Tender</option>
              <option value="card">POS Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_debt">Customer Debt</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="voided">Voided</option>
            </select>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Cashier</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4 text-right">Revenue</th>
                  <th className="py-2.5 px-4 text-right">Cost (COGS)</th>
                  <th className="py-2.5 px-4 text-right">Profit</th>
                  <th className="py-2.5 px-4">Tender</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{s.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">{s.timestamp}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{s.cashierName}</td>
                    <td className="py-3 px-4 text-slate-600">{s.customerName || "Walk-in"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₦{s.total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₦{s.totalCostSnapshot.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₦{s.grossProfit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 border border-slate-200 capitalize">
                        {s.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          s.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Detail Drawer */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full p-6 flex flex-col shadow-2xl text-xs overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Order Detail: {selectedSale.invoiceNumber}</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedSale.timestamp}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-4 flex-1">
              {/* Cashier & Customer Info */}
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>
                  <strong className="text-slate-900">{selectedSale.cashierName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <strong className="text-slate-900">{selectedSale.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Rail:</span>
                  <strong className="text-slate-900 capitalize">{selectedSale.paymentMethod.replace("_", " ")}</strong>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2">Line Items Breakdown</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                  {selectedSale.items.map((i, idx) => (
                    <div key={idx} className="p-3 bg-white space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{i.name} (x{i.quantity})</span>
                        <span className="font-mono">₦{i.totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>Snapshot Cost: ₦{i.unitCost.toFixed(2)} each</span>
                        <span>COGS: ₦{i.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Margin Summary */}
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Sales Total:</span>
                  <span className="font-mono font-bold text-slate-900">₦{selectedSale.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cost of Goods Sold (COGS Snapshot):</span>
                  <span className="font-mono text-slate-700">₦{selectedSale.totalCostSnapshot.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                  <span className="text-slate-800">Gross Margin Profit:</span>
                  <span className="font-mono text-emerald-700">₦{selectedSale.grossProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Void Action Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              {selectedSale.status === "completed" ? (
                <button
                  onClick={() => setVoidModalOpen(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-bold text-xs transition-colors"
                >
                  Void Sale & Return Inventory
                </button>
              ) : (
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-md">
                  This transaction is VOIDED (Reversing movements posted)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Owner Void Modal with Mandatory Reason */}
      {voidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <ShieldAlert size={18} />
              <span>Confirm Sale Void & Inventory Reversal</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Voiding this sale will restore sold units back into inventory and generate an offsetting financial reversal.
              The original transaction record is preserved in the audit trail.
            </p>

            <form onSubmit={handleVoidSale} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700">
                  Mandatory Reason for Void
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Customer returned items, wrong tender method recorded..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVoidModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVoiding}
                  className="px-4 py-1.5 font-bold text-white bg-rose-700 hover:bg-rose-800 rounded shadow-xs"
                >
                  {isVoiding ? "Reversing..." : "Confirm Void"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

