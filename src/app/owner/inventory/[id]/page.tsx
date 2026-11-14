"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowLeft,
  Boxes,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Tag,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

interface MovementRecord {
  id: string;
  type: "PURCHASE_INTAKE" | "SALE_DISPATCH" | "DAMAGE_EXPIRY" | "THEFT_SHRINKAGE" | "AUDIT_CORRECTION";
  quantityChange: number;
  resultingStock: number;
  unitCostSnapshot: number;
  reason: string;
  reference: string;
  performedBy: string;
  timestamp: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;

  // Mock product state
  const product = {
    id: productId,
    name: "Paracetamol 500mg (Pack of 20)",
    sku: "MED-001",
    barcode: "6151234567890",
    category: "Pharmaceuticals",
    costPrice: 1200.0,
    sellingPrice: 1800.0,
    currentStock: 45,
    minStock: 20,
    unit: "pack",
    status: "active",
  };

  const movements: MovementRecord[] = [
    {
      id: "mov-1",
      type: "SALE_DISPATCH",
      quantityChange: -5,
      resultingStock: 45,
      unitCostSnapshot: 1200.0,
      reason: "Customer POS checkout",
      reference: "REC-20261106-0042",
      performedBy: "Adaeze Okon (Cashier)",
      timestamp: "Today, 10:15 AM",
    },
    {
      id: "mov-2",
      type: "SALE_DISPATCH",
      quantityChange: -10,
      resultingStock: 50,
      unitCostSnapshot: 1200.0,
      reason: "Bulk wholesale order",
      reference: "REC-20261106-0038",
      performedBy: "Adaeze Okon (Cashier)",
      timestamp: "Today, 09:30 AM",
    },
    {
      id: "mov-3",
      type: "PURCHASE_INTAKE",
      quantityChange: +40,
      resultingStock: 60,
      unitCostSnapshot: 1200.0,
      reason: "PO Delivery & WAC Recalculation",
      reference: "PO-20261105-0012",
      performedBy: "Chukwuma Obi (Owner)",
      timestamp: "Yesterday, 04:00 PM",
    },
    {
      id: "mov-4",
      type: "DAMAGE_EXPIRY",
      quantityChange: -2,
      resultingStock: 20,
      unitCostSnapshot: 1150.0,
      reason: "Water damage during warehouse transport",
      reference: "ADJ-20261104-0008",
      performedBy: "Chinedu Obi (Manager)",
      timestamp: "Nov 04, 2026",
    },
    {
      id: "mov-5",
      type: "PURCHASE_INTAKE",
      quantityChange: +22,
      resultingStock: 22,
      unitCostSnapshot: 1150.0,
      reason: "Initial baseline opening intake",
      reference: "INTAKE-BASELINE",
      performedBy: "Chukwuma Obi (Owner)",
      timestamp: "Nov 01, 2026",
    },
  ];

  const margin = Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100);

  return (
    <AppShell role="owner" userEmail="owner@alpha-retail.ng" userName="Chukwuma Obi" businessName="Alpha Retail Ltd">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/owner/inventory"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md transition-colors shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Back to Inventory Catalog</span>
          </Link>
        </div>

        {/* Product Overview Header */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {product.sku}
                </span>
                <span className="text-xs text-slate-500 font-mono">• Barcode: {product.barcode}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">{product.name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Category: {product.category}</p>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-xs text-slate-500 block">Current Stock</span>
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {product.currentStock} {product.unit}s
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block">Current WAC Cost</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                ₦{product.costPrice.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Selling Price</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                ₦{product.sellingPrice.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Gross Margin</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">{margin}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">Reorder Threshold</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{product.minStock} {product.unit}s</span>
            </div>
          </div>
        </div>

        {/* Movement History Ledger */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-700" />
              <h2 className="text-sm font-bold text-slate-900">Perpetual Stock Movement Ledger</h2>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                {movements.length} Entries
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Append-only audit trail</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Movement Type</th>
                  <th className="py-2.5 px-4 text-right">Quantity Delta</th>
                  <th className="py-2.5 px-4 text-right">Stock Result</th>
                  <th className="py-2.5 px-4 text-right">Unit Cost Snapshot</th>
                  <th className="py-2.5 px-4">Reference & Reason</th>
                  <th className="py-2.5 px-4 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {m.timestamp}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            m.type === "PURCHASE_INTAKE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : m.type === "SALE_DISPATCH"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : m.type === "THEFT_SHRINKAGE"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {m.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-semibold">
                        {m.resultingStock}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        ₦{m.unitCostSnapshot.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.reference}</div>
                        <div className="text-[11px] text-slate-500">{m.reason}</div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 text-[11px] whitespace-nowrap">
                        {m.performedBy}
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

