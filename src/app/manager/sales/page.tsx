"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Eye,
  KeyRound,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";
import { ApprovalService } from "@/lib/approvals/approval-service";

interface ManagerSaleRecord {
  id: string;
  receiptNumber: string;
  time: string;
  cashierName: string;
  customerName?: string;
  paymentMethod: "cash" | "card" | "transfer" | "split";
  itemsCount: number;
  total: number;
  status: "completed" | "voided";
  voidReason?: string;
  voidedBy?: string;
  items: Array<{ name: string; quantity: number; price: number; lineTotal: number }>;
}

export default function ManagerSalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Void Sale Modal State
  const [selectedSaleForVoid, setSelectedSaleForVoid] = useState<ManagerSaleRecord | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [managerPin, setManagerPin] = useState("");
  const [voidError, setVoidError] = useState<string | null>(null);

  // Detail Drawer State
  const [activeSaleDetail, setActiveSaleDetail] = useState<ManagerSaleRecord | null>(null);

  const [sales, setSales] = useState<ManagerSaleRecord[]>([
    {
      id: "sale-1",
      receiptNumber: "REC-20261106-0048",
      time: "Today, 01:15 PM",
      cashierName: "Adaeze Okon",
      customerName: "Walk-in Retail Customer",
      paymentMethod: "cash",
      itemsCount: 3,
      total: 12500,
      status: "completed",
      items: [
        { name: "Golden Penny Vegetable Oil 750ml", quantity: 2, price: 3500, lineTotal: 7000 },
        { name: "Dangote Sugar 1kg Pack", quantity: 5, price: 1100, lineTotal: 5500 },
      ],
    },
    {
      id: "sale-2",
      receiptNumber: "REC-20261106-0047",
      time: "Today, 12:40 PM",
      cashierName: "John Danladi",
      customerName: "Alhaji Musa Provisions",
      paymentMethod: "transfer",
      itemsCount: 1,
      total: 35000,
      status: "completed",
      items: [{ name: "Peak Milk Powder 800g", quantity: 5, price: 7000, lineTotal: 35000 }],
    },
    {
      id: "sale-3",
      receiptNumber: "REC-20261106-0046",
      time: "Today, 11:22 AM",
      cashierName: "Adaeze Okon",
      customerName: "Walk-in Retail Customer",
      paymentMethod: "card",
      itemsCount: 2,
      total: 8400,
      status: "voided",
      voidReason: "Customer card was charged twice on POS machine due to terminal network glitch.",
      voidedBy: "Chidinma Eze (Store Manager)",
      items: [
        { name: "Indomie Onion Chicken 70g (Carton)", quantity: 1, price: 7200, lineTotal: 7200 },
        { name: "Paracetamol 500mg Pack", quantity: 3, price: 400, lineTotal: 1200 },
      ],
    },
    {
      id: "sale-4",
      receiptNumber: "REC-20261106-0045",
      time: "Today, 10:05 AM",
      cashierName: "John Danladi",
      customerName: "Mrs. Ngozi Eke",
      paymentMethod: "split",
      itemsCount: 4,
      total: 28500,
      status: "completed",
      items: [
        { name: "Golden Penny Semovita 2kg", quantity: 3, price: 4500, lineTotal: 13500 },
        { name: "Peak Milk 400g Tin", quantity: 5, price: 3000, lineTotal: 15000 },
      ],
    },
  ]);

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === "all" || s.paymentMethod === methodFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ["Receipt #", "Time", "Cashier", "Customer", "Method", "Items Count", "Status", "Total (NGN)"];
    const rows = filteredSales.map((s) => [
      s.receiptNumber,
      s.time,
      s.cashierName,
      s.customerName || "Walk-in",
      s.paymentMethod.toUpperCase(),
      s.itemsCount,
      s.status.toUpperCase(),
      s.total,
    ]);
    downloadCSV(`Manager_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, buildCSV(headers, rows));
  };

  const handleOpenVoid = (sale: ManagerSaleRecord) => {
    setSelectedSaleForVoid(sale);
    setVoidReason("");
    setManagerPin("");
    setVoidError(null);
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForVoid) return;

    const res = ApprovalService.processSaleVoid(
      {
        saleId: selectedSaleForVoid.id,
        receiptNumber: selectedSaleForVoid.receiptNumber,
        originalAmount: selectedSaleForVoid.total,
        reason: voidReason,
        managerPin: managerPin,
        managerName: "Chidinma Eze (Store Manager)",
      },
      "1234"
    );

    if (!res.success) {
      setVoidError(res.error || "Void failed");
      return;
    }

    setSales(
      sales.map((s) =>
        s.id === selectedSaleForVoid.id
          ? {
              ...s,
              status: "voided",
              voidReason: voidReason.trim(),
              voidedBy: "Chidinma Eze (Store Manager)",
            }
          : s
      )
    );

    setSelectedSaleForVoid(null);
  };

  return (
    <AppShell role="manager">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales & Voids Ledger</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-full font-mono">
                {sales.length} Transactions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review daily cashier transactions and authorize refunds or reversing voids with reason audit.
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
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt #, cashier, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-1 focus:ring-indigo-700 outline-none"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card (POS)</option>
                <option value="transfer">Bank Transfer</option>
                <option value="split">Split Tender</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-1 focus:ring-indigo-700 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="voided">Voided</option>
              </select>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Receipt & Time</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Tender</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount (₦)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 font-mono">{sale.receiptNumber}</p>
                        <p className="text-[11px] text-slate-400">{sale.time}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{sale.cashierName}</td>
                      <td className="py-3 px-4 text-slate-700">{sale.customerName || "Walk-in"}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-md border text-[11px] font-medium bg-slate-50 text-slate-700 border-slate-200">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wide ${
                            sale.status === "completed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                        ₦{sale.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveSaleDetail(sale)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="View Receipt Details"
                          >
                            <Eye size={14} />
                          </button>
                          {sale.status === "completed" && (
                            <button
                              onClick={() => handleOpenVoid(sale)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors"
                            >
                              Void Sale
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Void Confirmation Modal */}
        {selectedSaleForVoid && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-700" />
                  <h3 className="font-bold text-sm text-rose-950">Manager Void Authorization</h3>
                </div>
                <button
                  onClick={() => setSelectedSaleForVoid(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmVoid} className="p-5 space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                  <p className="text-slate-700">
                    Voiding Receipt:{" "}
                    <strong className="font-mono text-slate-900">
                      {selectedSaleForVoid.receiptNumber}
                    </strong>
                  </p>
                  <p className="text-slate-700 mt-1">
                    Total Amount:{" "}
                    <strong className="font-mono text-slate-900 font-bold">
                      ₦{selectedSaleForVoid.total.toLocaleString()}
                    </strong>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    * Voiding creates reversing accounting records and restores inventory stock. No rows are deleted.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">Mandatory Void Reason *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Customer returned items immediately, terminal double charged..."
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">Manager Security PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="Enter 4-digit PIN (default: 1234)"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono tracking-widest text-center text-sm focus:ring-1 focus:ring-indigo-700 outline-none"
                  />
                </div>

                {voidError && <p className="text-rose-600 font-semibold">{voidError}</p>}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedSaleForVoid(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs transition-colors"
                  >
                    Confirm Reversing Void
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Receipt Detail Drawer / Modal */}
        {activeSaleDetail && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-mono">
                    {activeSaleDetail.receiptNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">{activeSaleDetail.time}</p>
                </div>
                <button
                  onClick={() => setActiveSaleDetail(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="divide-y divide-slate-100">
                  {activeSaleDetail.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{it.name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          {it.quantity} x ₦{it.price.toLocaleString()}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ₦{it.lineTotal.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono tabular-nums text-base">
                    ₦{activeSaleDetail.total.toLocaleString()}
                  </span>
                </div>

                {activeSaleDetail.status === "voided" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md">
                    <p className="font-bold text-rose-800">Void Audit Details:</p>
                    <p className="text-rose-700 mt-0.5">{activeSaleDetail.voidReason}</p>
                    <p className="text-[11px] text-rose-500 mt-1">
                      Authorized by: {activeSaleDetail.voidedBy}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

