"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldAlert,
  Boxes,
  HelpCircle,
} from "lucide-react";

interface BatchItem {
  id: string;
  productName: string;
  sku: string;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  expiryDate: string; // YYYY-MM-DD
  daysUntilExpiry: number;
}

export default function BatchesExpiryPage() {
  const [batches, setBatches] = useState<BatchItem[]>([
    {
      id: "b-1",
      productName: "Amoxicillin 250mg Capsules",
      sku: "MED-002",
      batchNumber: "BN-2026-081",
      quantity: 8,
      costPrice: 2400.0,
      expiryDate: "2026-11-20",
      daysUntilExpiry: 14, // Critical < 30 days
    },
    {
      id: "b-2",
      productName: "Paracetamol 500mg (Pack of 20)",
      sku: "MED-001",
      batchNumber: "BN-2026-095",
      quantity: 20,
      costPrice: 1200.0,
      expiryDate: "2026-12-15",
      daysUntilExpiry: 39,
    },
    {
      id: "b-3",
      productName: "Paracetamol 500mg (Pack of 20)",
      sku: "MED-001",
      batchNumber: "BN-2027-012",
      quantity: 25,
      costPrice: 1200.0,
      expiryDate: "2027-04-30",
      daysUntilExpiry: 175,
    },
    {
      id: "b-4",
      productName: "Dano Milk Powder 800g",
      sku: "GROC-015",
      batchNumber: "LOT-DN-441",
      quantity: 5,
      costPrice: 3800.0,
      expiryDate: "2026-11-01",
      daysUntilExpiry: -5, // Expired
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBatchProduct, setNewBatchProduct] = useState("MED-001");
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newBatchQty, setNewBatchQty] = useState("20");
  const [newBatchCost, setNewBatchCost] = useState("1200.00");
  const [newBatchExpiry, setNewBatchExpiry] = useState("2027-06-30");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchNumber.trim()) {
      triggerToast("Error: Batch number is required.");
      return;
    }

    const item: BatchItem = {
      id: `b-${Date.now()}`,
      productName: "Paracetamol 500mg (Pack of 20)",
      sku: newBatchProduct,
      batchNumber: newBatchNumber.trim(),
      quantity: parseInt(newBatchQty, 10) || 0,
      costPrice: parseFloat(newBatchCost) || 0,
      expiryDate: newBatchExpiry,
      daysUntilExpiry: 236,
    };

    setBatches([...batches, item].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)));
    setIsAddModalOpen(false);
    setNewBatchNumber("");
    triggerToast(`Added batch ${item.batchNumber} with FEFO tracking`);
  };

  const expiredCount = batches.filter((b) => b.daysUntilExpiry <= 0).length;
  const criticalCount = batches.filter((b) => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 30).length;

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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Batches & Expiry (FEFO)</h1>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                FEFO Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              First-Expired, First-Out guidance for pharmaceutical lots and perishable retail inventory
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>Add Product Batch</span>
          </button>
        </div>

        {/* FEFO Advisory Banner */}
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-3">
          <Clock size={20} className="text-indigo-700 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 space-y-1">
            <span className="font-bold">FEFO (First-Expired, First-Out) Protocol Active:</span>
            <p className="leading-relaxed text-indigo-900">
              Cashier terminals are automatically instructed to dispense the earliest expiring batch first. Batches expiring
              within 30 days are flagged in amber; expired batches are locked from frontline sale.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Active Tracked Batches</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{batches.length} Batches</div>
            <p className="text-[11px] text-slate-500 mt-1">Ordered by earliest expiration date</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Expiring Soon (&lt;30 days)</span>
              <AlertTriangle size={15} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{criticalCount} Batches</div>
            <p className="text-[11px] text-amber-600 font-medium mt-1">Prioritize for sales dispatch</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Expired Batches (Locked)</span>
              <ShieldAlert size={15} className="text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1">{expiredCount} Batches</div>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Requires write-off adjustment</p>
          </div>
        </div>

        {/* Batches Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">FEFO Priority</th>
                  <th className="py-2.5 px-4">Product Name & SKU</th>
                  <th className="py-2.5 px-4">Batch / Lot Number</th>
                  <th className="py-2.5 px-4 text-right">Batch Units</th>
                  <th className="py-2.5 px-4 text-right">Intake Cost</th>
                  <th className="py-2.5 px-4">Expiry Date</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b, idx) => {
                  const isExpired = b.daysUntilExpiry <= 0;
                  const isCritical = b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 30;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 inline-flex items-center justify-center text-[11px]">
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.productName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{b.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {b.quantity} units
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        ₦{b.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-slate-900">{b.expiryDate}</div>
                        <div className={`text-[10px] ${isExpired ? "text-rose-600 font-bold" : isCritical ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                          {isExpired ? "Expired" : `${b.daysUntilExpiry} days remaining`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isExpired
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : isCritical
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isExpired ? "Expired (Locked)" : isCritical ? "Expiring Soon" : "Active (Good)"}
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

      {/* Add Batch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Product Batch (FEFO)</h3>
            <form onSubmit={handleAddBatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Product</label>
                <select
                  value={newBatchProduct}
                  onChange={(e) => setNewBatchProduct(e.target.value)}
                  className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white font-medium"
                >
                  <option value="MED-001">Paracetamol 500mg (MED-001)</option>
                  <option value="MED-002">Amoxicillin 250mg (MED-002)</option>
                  <option value="GROC-015">Dano Milk Powder 800g (GROC-015)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Batch / Lot Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BN-2027-099"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Batch Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newBatchQty}
                    onChange={(e) => setNewBatchQty(e.target.value)}
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Intake Cost (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBatchCost}
                    onChange={(e) => setNewBatchCost(e.target.value)}
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={newBatchExpiry}
                  onChange={(e) => setNewBatchExpiry(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md shadow-xs"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

