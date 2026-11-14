"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileCheck,
  Download,
  Calendar,
  Search,
  Filter,
  Receipt,
  CheckCircle2,
  Eye,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

interface StatementRow {
  id: string;
  date: string;
  type: "credit_purchase" | "payment_received";
  description: string;
  referenceNumber: string;
  amount: number;
  balanceAfter: number;
  items?: Array<{ name: string; quantity: number; price: number; lineTotal: number }>;
}

export default function CustomerStatementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<StatementRow | null>(null);

  const [statementRows] = useState<StatementRow[]>([
    {
      id: "STMT-001",
      date: "Nov 06, 2026",
      type: "credit_purchase",
      description: "Semi-Bulk Provisions Order",
      referenceNumber: "INV-20261106-9012",
      amount: -45000,
      balanceAfter: 142000,
      items: [
        { name: "Golden Penny Vegetable Oil 5L", quantity: 3, price: 10000, lineTotal: 30000 },
        { name: "Dangote Sugar 1kg Pack (Carton)", quantity: 1, price: 15000, lineTotal: 15000 },
      ],
    },
    {
      id: "STMT-002",
      date: "Nov 02, 2026",
      type: "payment_received",
      description: "Direct Bank Transfer Repayment",
      referenceNumber: "GTB/TRF/98124",
      amount: 50000,
      balanceAfter: 97000,
    },
    {
      id: "STMT-003",
      date: "Oct 28, 2026",
      type: "credit_purchase",
      description: "Sugar & Baking Ingredients Supply",
      referenceNumber: "INV-20261028-8941",
      amount: -97000,
      balanceAfter: 147000,
      items: [
        { name: "Dangote Granulated Sugar 50kg Bag", quantity: 1, price: 84000, lineTotal: 84000 },
        { name: "Peak Milk Powder 800g Tin", quantity: 2, price: 6500, lineTotal: 13000 },
      ],
    },
    {
      id: "STMT-004",
      date: "Oct 15, 2026",
      type: "payment_received",
      description: "Zenith Bank Mobile Transfer",
      referenceNumber: "ZEN/TRF/482019",
      amount: 40000,
      balanceAfter: 50000,
    },
    {
      id: "STMT-005",
      date: "Oct 10, 2026",
      type: "credit_purchase",
      description: "Opening Monthly Inventory Facility",
      referenceNumber: "INV-20261010-8802",
      amount: -90000,
      balanceAfter: 90000,
      items: [
        { name: "Paracetamol 500mg Pack", quantity: 50, price: 400, lineTotal: 20000 },
        { name: "Amoxicillin 250mg Capsules", quantity: 15, price: 3800, lineTotal: 57000 },
        { name: "Dettol Antiseptic 250ml", quantity: 3, price: 4333, lineTotal: 13000 },
      ],
    },
  ]);

  const filteredRows = statementRows.filter((r) => {
    const matchesSearch =
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || r.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const headers = [
      "Statement ID",
      "Date",
      "Type",
      "Description",
      "Reference #",
      "Debit / Credit (NGN)",
      "Balance (NGN)",
    ];

    const rows = filteredRows.map((r) => [
      r.id,
      r.date,
      r.type === "credit_purchase" ? "Credit Purchase (Invoice)" : "Payment Received",
      r.description,
      r.referenceNumber,
      r.amount,
      r.balanceAfter,
    ]);

    downloadCSV(
      `Customer_Statement_${new Date().toISOString().slice(0, 10)}.csv`,
      buildCSV(headers, rows)
    );
  };

  return (
    <AppShell role="customer">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Itemised Account Statement</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-full font-mono">
                {statementRows.length} Entries
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent ledger of all credited goods, verified payments, and current balance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Download Statement (CSV)</span>
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
                placeholder="Search description or reference #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-1 focus:ring-indigo-700 outline-none"
            >
              <option value="all">All Activities</option>
              <option value="credit_purchase">Credit Purchases Only</option>
              <option value="payment_received">Payments Credited Only</option>
            </select>
          </div>

          {/* Statement Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date & ID</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Reference #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount (₦)</th>
                    <th className="py-3 px-4 text-right">Running Balance (₦)</th>
                    <th className="py-3 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{row.date}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{row.id}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.description}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{row.referenceNumber}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            row.type === "payment_received"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-800 border-slate-300"
                          }`}
                        >
                          {row.type === "payment_received" ? "Payment Made" : "Credit Purchase"}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-bold text-sm ${
                          row.amount > 0 ? "text-emerald-700" : "text-slate-900"
                        }`}
                      >
                        {row.amount > 0 ? "+" : ""}₦{Math.abs(row.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                        ₦{row.balanceAfter.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.items ? (
                          <button
                            onClick={() => setSelectedInvoice(row)}
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                            title="View Invoice Breakdown"
                          >
                            <Eye size={14} />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Receipt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* VAT Invoice Breakdown Modal */}
        {selectedInvoice && selectedInvoice.items && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-mono">
                    {selectedInvoice.referenceNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">VAT Credit Invoice · {selectedInvoice.date}</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((it, idx) => (
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
                  <span>Invoice Total (Tax Included)</span>
                  <span className="font-mono tabular-nums text-base">
                    ₦{Math.abs(selectedInvoice.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

