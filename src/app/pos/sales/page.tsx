"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Receipt,
  Search,
  Printer,
  ArrowLeft,
  Calendar,
  Lock,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { ReceiptDetailModal } from "@/components/modals/ReceiptDetailModal";

interface ShiftReceipt {
  id: string;
  invoiceNumber: string;
  time: string;
  items: string;
  amount: number;
  paymentMethod: string;
  cashier: string;
}

export default function PosShiftSalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [managerPin, setManagerPin] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [selectedReceiptForVoid, setSelectedReceiptForVoid] = useState<ShiftReceipt | null>(null);

  const [receipts, setReceipts] = useState<ShiftReceipt[]>([
    {
      id: "sale-101",
      invoiceNumber: "INV-20261106-7812",
      time: "10:14 AM",
      items: "Paracetamol 500mg (x2), Eva Water 75cl (x4)",
      amount: 2700,
      paymentMethod: "Cash",
      cashier: "Adaeze Okon",
    },
    {
      id: "sale-102",
      invoiceNumber: "INV-20261106-7809",
      time: "09:42 AM",
      items: "Royal Stallion Rice 5kg (x1), Fearless Drink (x2)",
      amount: 12200,
      paymentMethod: "Bank Transfer",
      cashier: "Adaeze Okon",
    },
    {
      id: "sale-103",
      invoiceNumber: "INV-20261106-7798",
      time: "09:05 AM",
      items: "Artemether ACT (x1)",
      amount: 2600,
      paymentMethod: "POS Card",
      cashier: "Adaeze Okon",
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRequestVoid = (r: ShiftReceipt) => {
    setSelectedReceiptForVoid(r);
    setManagerPin("");
    setVoidReason("");
    setVoidModalOpen(true);
  };

  const handleAuthorizeVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerPin.trim() || !voidReason.trim()) {
      triggerToast("Manager PIN and Void Reason are required.");
      return;
    }
    if (managerPin !== "1234") {
      triggerToast("Invalid Manager PIN.");
      return;
    }

    if (selectedReceiptForVoid) {
      setReceipts(receipts.filter((r) => r.id !== selectedReceiptForVoid.id));
      triggerToast(`Sale ${selectedReceiptForVoid.invoiceNumber} voided by Manager. Reversing movement posted.`);
    }
    setVoidModalOpen(false);
  };

  const filtered = receipts.filter(
    (r) =>
      r.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalShiftSales = receipts.reduce((acc, r) => acc + r.amount, 0);

  return (
    <AppShell role="cashier" userEmail="cashier@alpha-retail.ng" userName="Adaeze Okon" businessName="Alpha Retail Ltd">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Today&apos;s Shift Receipts</h1>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                Terminal 1
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sales completed during your current active shift session
            </p>
          </div>

          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Register</span>
          </Link>
        </div>

        {/* Shift Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Shift Sales Count</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{receipts.length} Receipts</div>
            <p className="text-[11px] text-slate-500 mt-1">Processed on Terminal 1</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Shift Revenue</span>
            <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
              ₦{totalShiftSales.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Cash, Card & Transfer Tender</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt number or item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Line Items</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{r.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{r.time}</td>
                    <td className="py-3 px-4 text-slate-800">{r.items}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₦{r.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 border border-slate-200">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReceipt(r)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
                      >
                        Reprint
                      </button>
                      <button
                        onClick={() => handleRequestVoid(r)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                      >
                        Void
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manager Void Modal */}
      {voidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <ShieldAlert size={18} />
              <span>Manager Authorization Required for Void</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Cashiers cannot self-void sales. A Store Manager must enter their PIN to authorize reversing records.
            </p>

            <form onSubmit={handleAuthorizeVoid} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700">Manager Security PIN</label>
                <input
                  type="password"
                  required
                  placeholder="••••"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded font-mono text-center text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Mandatory Void Reason</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Why is this transaction being voided?"
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
                  className="px-4 py-1.5 font-bold text-white bg-rose-700 hover:bg-rose-800 rounded shadow-xs"
                >
                  Authorize Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Receipt Preview Modal */}
      {selectedReceipt && (
        <ReceiptDetailModal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          sale={{
            id: selectedReceipt.invoiceNumber || selectedReceipt.id,
            time: selectedReceipt.time,
            items: selectedReceipt.items,
            amount: selectedReceipt.amount,
            method: selectedReceipt.paymentMethod,
            cashier: selectedReceipt.cashier,
          }}
        />
      )}
    </AppShell>
  );
}

