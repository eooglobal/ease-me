"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCheck,
  RotateCcw,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface CountItem {
  id: string;
  productName: string;
  sku: string;
  costPrice: number;
  systemStock: number;
  countedStock: number;
}

export default function StocktakePage() {
  const [sessionStatus, setSessionStatus] = useState<"IN_PROGRESS" | "REVIEW" | "APPROVED">("IN_PROGRESS");
  const [sessionTitle] = useState("Monthly Physical Count - November 2026");

  const [items, setItems] = useState<CountItem[]>([
    {
      id: "prod-1",
      productName: "Paracetamol 500mg (Pack of 20)",
      sku: "MED-001",
      costPrice: 1200.0,
      systemStock: 45,
      countedStock: 45, // Balanced (Variance: 0)
    },
    {
      id: "prod-2",
      productName: "Amoxicillin 250mg Capsules",
      sku: "MED-002",
      costPrice: 2400.0,
      systemStock: 8,
      countedStock: 7, // Variance: -1 (Shortage)
    },
    {
      id: "prod-3",
      productName: "Golden Penny Vegetable Oil 5L",
      sku: "GROC-010",
      costPrice: 8500.0,
      systemStock: 32,
      countedStock: 33, // Variance: +1 (Overage)
    },
    {
      id: "prod-4",
      productName: "Dano Milk Powder 800g",
      sku: "GROC-015",
      costPrice: 3800.0,
      systemStock: 5,
      countedStock: 5, // Balanced
    },
    {
      id: "prod-5",
      productName: "Oral-B Toothpaste 100ml",
      sku: "TOIL-005",
      costPrice: 1100.0,
      systemStock: 64,
      countedStock: 62, // Variance: -2 (Shortage)
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateCount = (id: string, val: string) => {
    const num = parseInt(val, 10);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, countedStock: isNaN(num) ? 0 : num } : item))
    );
  };

  const handleApproveSession = () => {
    setSessionStatus("APPROVED");
    triggerToast("Stocktake approved! Correction movements posted to inventory ledger.");
  };

  // Variance calculations
  const totalVarianceQty = items.reduce((acc, i) => acc + (i.countedStock - i.systemStock), 0);
  const totalVarianceValue = items.reduce(
    (acc, i) => acc + (i.countedStock - i.systemStock) * i.costPrice,
    0
  );
  const discrepanciesCount = items.filter((i) => i.countedStock !== i.systemStock).length;

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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stocktake & Count Sessions</h1>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  sessionStatus === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}
              >
                {sessionStatus === "APPROVED" ? "Approved & Posted" : "Count In Progress"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{sessionTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {sessionStatus === "IN_PROGRESS" && (
              <button
                onClick={handleApproveSession}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
              >
                <FileCheck size={15} />
                <span>Approve & Post Adjustments</span>
              </button>
            )}
            {sessionStatus === "APPROVED" && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
                <CheckCircle2 size={15} />
                <span>Adjustments Posted to Ledger</span>
              </div>
            )}
          </div>
        </div>

        {/* Variance Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Products Counted</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{items.length} SKUs</div>
            <p className="text-[11px] text-slate-500 mt-1">{discrepanciesCount} items have count variances</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Net Quantity Variance</span>
              <ClipboardList size={15} className="text-indigo-600" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
                totalVarianceQty < 0
                  ? "text-rose-600"
                  : totalVarianceQty > 0
                  ? "text-emerald-600"
                  : "text-slate-900"
              }`}
            >
              {totalVarianceQty > 0 ? `+${totalVarianceQty}` : totalVarianceQty} units
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Physical count vs system counter</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Net Discrepancy Value</span>
              <AlertTriangle size={15} className="text-amber-600" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
                totalVarianceValue < 0
                  ? "text-rose-600"
                  : totalVarianceValue > 0
                  ? "text-emerald-600"
                  : "text-slate-900"
              }`}
            >
              {totalVarianceValue < 0 ? "-" : "+"}₦
              {Math.abs(totalVarianceValue).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">P&L impact at snapshot WAC cost</p>
          </div>
        </div>

        {/* Count Items Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Product Name & SKU</th>
                  <th className="py-2.5 px-4 text-right">Unit Cost (WAC)</th>
                  <th className="py-2.5 px-4 text-right">System Stock</th>
                  <th className="py-2.5 px-4 text-right">Physical Count</th>
                  <th className="py-2.5 px-4 text-right">Variance</th>
                  <th className="py-2.5 px-4 text-right">Variance Impact</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const variance = item.countedStock - item.systemStock;
                  const varianceValue = variance * item.costPrice;
                  const isBalanced = variance === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ₦{item.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {item.systemStock}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {sessionStatus === "APPROVED" ? (
                          <span className="font-bold text-slate-900">{item.countedStock}</span>
                        ) : (
                          <input
                            type="number"
                            value={item.countedStock}
                            onChange={(e) => handleUpdateCount(item.id, e.target.value)}
                            className="w-20 text-right px-2 py-1 text-xs border border-slate-200 rounded-md font-mono font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-600"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            variance < 0
                              ? "text-rose-600"
                              : variance > 0
                              ? "text-emerald-600"
                              : "text-slate-500"
                          }
                        >
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        <span
                          className={
                            varianceValue < 0
                              ? "text-rose-600"
                              : varianceValue > 0
                              ? "text-emerald-600"
                              : "text-slate-500"
                          }
                        >
                          {varianceValue < 0 ? "-" : varianceValue > 0 ? "+" : ""}₦
                          {Math.abs(varianceValue).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isBalanced
                              ? "bg-slate-50 text-slate-600 border-slate-200"
                              : variance < 0
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isBalanced ? "Balanced" : variance < 0 ? "Shortage" : "Overage"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

