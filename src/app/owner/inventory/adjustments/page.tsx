"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  SlidersHorizontal,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Clock,
  Plus,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface AdjustmentEntry {
  id: string;
  productName: string;
  sku: string;
  type: "DAMAGE" | "EXPIRY" | "THEFT_SHRINKAGE" | "AUDIT_CORRECTION";
  quantity: number;
  reason: string;
  recordedBy: string;
  timestamp: string;
  isTheft: boolean;
}

export default function StockAdjustmentsPage() {
  const [selectedProduct, setSelectedProduct] = useState("prod-1");
  const [adjustmentType, setAdjustmentType] = useState<"DAMAGE" | "EXPIRY" | "THEFT_SHRINKAGE" | "AUDIT_CORRECTION">("DAMAGE");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adjustments, setAdjustments] = useState<AdjustmentEntry[]>([
    {
      id: "adj-1",
      productName: "Paracetamol 500mg (Pack of 20)",
      sku: "MED-001",
      type: "DAMAGE",
      quantity: 2,
      reason: "Crushed packs during shelf restocking",
      recordedBy: "Chinedu Obi (Manager)",
      timestamp: "Today, 11:00 AM",
      isTheft: false,
    },
    {
      id: "adj-2",
      productName: "Golden Penny Vegetable Oil 5L",
      sku: "GROC-010",
      type: "THEFT_SHRINKAGE",
      quantity: 1,
      reason: "Missing bottle unaccounted for during evening till count",
      recordedBy: "Chukwuma Obi (Owner)",
      timestamp: "Yesterday, 06:45 PM",
      isTheft: true,
    },
    {
      id: "adj-3",
      productName: "Amoxicillin 250mg Capsules",
      sku: "MED-002",
      type: "EXPIRY",
      quantity: 4,
      reason: "Past manufacturer expiry date (Batch BN-9821)",
      recordedBy: "Chinedu Obi (Manager)",
      timestamp: "Nov 02, 2026",
      isTheft: false,
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      triggerToast("Error: Reason is strictly mandatory for stock adjustments.");
      return;
    }
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast("Error: Quantity must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const isTheft = adjustmentType === "THEFT_SHRINKAGE";
      const newEntry: AdjustmentEntry = {
        id: `adj-${Date.now()}`,
        productName: "Paracetamol 500mg (Pack of 20)",
        sku: "MED-001",
        type: adjustmentType,
        quantity: qtyNum,
        reason: reason.trim(),
        recordedBy: "Chukwuma Obi (Owner)",
        timestamp: "Just now",
        isTheft,
      };

      setAdjustments([newEntry, ...adjustments]);
      setReason("");
      setQuantity("1");
      setIsSubmitting(false);

      if (isTheft) {
        triggerToast("Adjustment recorded & flagged in Security Audit Log.");
      } else {
        triggerToast("Stock adjustment recorded in movement ledger.");
      }
    }, 400);
  };

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
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Adjustments & Shrinkage</h1>
            <span className="text-[11px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 font-semibold">
              Security Logged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record inventory loss, damaged items, expired pharmaceuticals, and shrinkage theft
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Record Adjustment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Target Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="mt-1 block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-800"
                >
                  <option value="prod-1">Paracetamol 500mg (MED-001)</option>
                  <option value="prod-2">Amoxicillin 250mg (MED-002)</option>
                  <option value="prod-3">Golden Penny Oil 5L (GROC-010)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Adjustment Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e: any) => setAdjustmentType(e.target.value)}
                  className="mt-1 block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-800"
                >
                  <option value="DAMAGE">Damaged / Broken Goods</option>
                  <option value="EXPIRY">Expired Pharmaceutical / Grocery</option>
                  <option value="THEFT_SHRINKAGE">Theft / Shrinkage (Security Alert)</option>
                  <option value="AUDIT_CORRECTION">Audit Count Variance Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Deduction Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Mandatory Reason / Root Cause Explanation
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this inventory loss occurred (mandatory for audit compliance)..."
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </div>

            {adjustmentType === "THEFT_SHRINKAGE" && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md flex items-center gap-2 text-xs text-purple-900">
                <ShieldAlert size={16} className="text-purple-700 shrink-0" />
                <span>
                  <strong>High Priority Audit Alert:</strong> Recording theft creates an indelible entry in the Security
                  Audit Log and notifies the Store Owner.
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
              >
                <Plus size={14} />
                <span>Submit Stock Adjustment</span>
              </button>
            </div>
          </form>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Adjustment Ledger</h2>
            <span className="text-xs text-slate-500 font-mono">{adjustments.length} logged events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Product & SKU</th>
                  <th className="py-2.5 px-4">Adjustment Type</th>
                  <th className="py-2.5 px-4 text-right">Quantity</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{a.timestamp}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{a.productName}</div>
                      <div className="font-mono text-[10px] text-slate-500">{a.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          a.isTheft
                            ? "bg-purple-50 text-purple-700 border-purple-200 font-bold"
                            : a.type === "DAMAGE"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {a.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">-{a.quantity}</td>
                    <td className="py-3 px-4 text-slate-700">{a.reason}</td>
                    <td className="py-3 px-4 text-right text-slate-600 text-[11px] whitespace-nowrap">{a.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

