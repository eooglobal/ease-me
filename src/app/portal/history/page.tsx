"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShoppingCart,
  Receipt,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { ShieldedCustomerPurchase } from "@/lib/parties/customer-portal-service";

export default function CustomerPurchaseHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<ShieldedCustomerPurchase | null>(null);

  const [purchases] = useState<ShieldedCustomerPurchase[]>([
    {
      id: "PUR-001",
      receiptNumber: "REC-20261106-0047",
      date: "Nov 06, 2026 · 12:40 PM",
      totalAmount: 35000,
      paymentMethod: "transfer",
      items: [
        { name: "Peak Milk Powder 800g Tin", quantity: 5, unitPrice: 7000, lineTotal: 35000 },
      ],
    },
    {
      id: "PUR-002",
      receiptNumber: "REC-20261028-0089",
      date: "Oct 28, 2026 · 04:15 PM",
      totalAmount: 97000,
      paymentMethod: "credit",
      items: [
        { name: "Dangote Granulated Sugar 50kg Bag", quantity: 1, unitPrice: 84000, lineTotal: 84000 },
        { name: "Peak Milk Powder 800g Tin", quantity: 2, unitPrice: 6500, lineTotal: 13000 },
      ],
    },
    {
      id: "PUR-003",
      receiptNumber: "REC-20261010-0012",
      date: "Oct 10, 2026 · 11:30 AM",
      totalAmount: 90000,
      paymentMethod: "credit",
      items: [
        { name: "Paracetamol 500mg Pack", quantity: 50, unitPrice: 400, lineTotal: 20000 },
        { name: "Amoxicillin 250mg Capsules", quantity: 15, unitPrice: 3800, lineTotal: 57000 },
        { name: "Dettol Antiseptic 250ml", quantity: 3, unitPrice: 4333, lineTotal: 13000 },
      ],
    },
    {
      id: "PUR-004",
      receiptNumber: "REC-20260924-0056",
      date: "Sep 24, 2026 · 02:10 PM",
      totalAmount: 50000,
      paymentMethod: "card",
      items: [
        { name: "Golden Penny Vegetable Oil 5L", quantity: 5, unitPrice: 10000, lineTotal: 50000 },
      ],
    },
  ]);

  const filteredPurchases = purchases.filter((p) => {
    return (
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <AppShell role="customer">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase History</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-full font-mono">
                {purchases.length} Receipts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review all past orders, items purchased, and payment method details.
            </p>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none"
              />
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Receipt # & Date</th>
                    <th className="py-3 px-4">Items Count</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Order Total (₦)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 font-mono">{pur.receiptNumber}</p>
                        <p className="text-[11px] text-slate-400">{pur.date}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {pur.items.reduce((s, it) => s + it.quantity, 0)} units ({pur.items.length} line items)
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-md border text-[11px] font-medium bg-slate-50 text-slate-700 border-slate-200">
                          {pur.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                        ₦{pur.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(pur)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors inline-flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Receipt Detail Modal (Staff names & costs strictly masked!) */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-mono">
                    {selectedReceipt.receiptNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedReceipt.date}</p>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="divide-y divide-slate-100">
                  {selectedReceipt.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{it.name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          {it.quantity} x ₦{it.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ₦{it.lineTotal.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm text-slate-900">
                  <span>Total Paid ({selectedReceipt.paymentMethod.toUpperCase()})</span>
                  <span className="font-mono tabular-nums text-base text-indigo-700">
                    ₦{selectedReceipt.totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-[11px] text-slate-500 text-center">
                  Thank you for your business! · Store Terminal Receipt
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

