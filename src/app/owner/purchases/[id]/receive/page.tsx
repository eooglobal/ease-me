"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowLeft,
  PackageCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  Save,
} from "lucide-react";
import { PurchaseCalc } from "@/lib/purchases/purchase-calc";

interface IntakeLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  receivedThisDelivery: number;
  landedUnitCost: number;
  currentStock: number;
  currentWAC: number;
  batchNumber: string;
  expiryDate: string;
  isBatchTracked: boolean;
}

export default function GoodsIntakeReceivingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "po-1";

  const [orderInfo] = useState({
    id: orderId,
    referenceNumber: "PO-20261105-1082",
    supplierName: "Mega Pharmaceuticals Ltd",
    orderDate: "Nov 5, 2026",
  });

  const [items, setItems] = useState<IntakeLineItem[]>([
    {
      id: "item-1",
      productId: "prod-1",
      productName: "Paracetamol 500mg Pack",
      sku: "MED-001",
      orderedQty: 200,
      previouslyReceivedQty: 100,
      receivedThisDelivery: 100,
      landedUnitCost: 574.44,
      currentStock: 120,
      currentWAC: 550,
      batchNumber: "LOT-PCM-2026B",
      expiryDate: "2027-11-30",
      isBatchTracked: true,
    },
    {
      id: "item-2",
      productId: "prod-2",
      productName: "Amoxicillin 500mg Strip",
      sku: "MED-002",
      orderedQty: 150,
      previouslyReceivedQty: 50,
      receivedThisDelivery: 100,
      landedUnitCost: 1253.33,
      currentStock: 45,
      currentWAC: 1200,
      batchNumber: "LOT-AMX-8801",
      expiryDate: "2027-08-15",
      isBatchTracked: true,
    },
  ]);

  const [isCompleting, setIsCompleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateItem = (
    index: number,
    field: "receivedThisDelivery" | "batchNumber" | "expiryDate",
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          [field]: field === "receivedThisDelivery" ? Math.max(0, parseInt(value, 10) || 0) : value,
        };
      })
    );
  };

  const handleCompleteIntake = () => {
    setIsCompleting(true);
    triggerToast("Processing intake: stock updated, WAC recalculated, lots generated.");

    setTimeout(() => {
      setIsCompleting(false);
      router.push("/owner/purchases");
    }, 1000);
  };

  return (
    <AppShell
      role="owner"
      userEmail="owner@alpha-retail.ng"
      userName="Chief Oladipo Alabi"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <Link
              href="/owner/purchases"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-semibold mb-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Purchase Orders</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Goods Intake &amp; Receiving</h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                {orderInfo.referenceNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supplier: {orderInfo.supplierName} • Intake delivery verification and WAC cost updates
            </p>
          </div>

          <button
            onClick={handleCompleteIntake}
            disabled={isCompleting}
            className="px-4 py-2 font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto text-xs"
          >
            <PackageCheck size={15} />
            <span>Complete Intake &amp; Update Stock</span>
          </button>
        </div>

        {/* Notice on WAC Recalculation */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
          <p className="font-bold">Weighted Average Cost (WAC) Governance:</p>
          <p className="text-blue-800 leading-relaxed">
            Completing this receiving intake recalculates the product Landed WAC across warehouse stock using the formula:
            <span className="font-mono block pt-1 font-semibold">
              New WAC = [(Current Stock × Current WAC) + (Intake Qty × Landed Unit Cost)] ÷ (Current Stock + Intake Qty)
            </span>
          </p>
        </div>

        {/* Intake Items Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Goods Delivery Verification</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect physical shipment, enter actual delivered count, batch lot, and expiration dates
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Product Name &amp; SKU</th>
                  <th className="px-4 py-3 text-right">Ordered / Prev. Received</th>
                  <th className="px-4 py-3 text-right w-36">Delivered Now *</th>
                  <th className="px-4 py-3 text-right">Landed Unit Cost</th>
                  <th className="px-4 py-3 text-right">Projected New WAC</th>
                  <th className="px-4 py-3 w-40">Batch Lot No</th>
                  <th className="px-4 py-3 w-36">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const projectedWAC = PurchaseCalc.recalculateWAC(
                    item.currentStock,
                    item.currentWAC,
                    item.receivedThisDelivery,
                    item.landedUnitCost
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{item.sku}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        <div>{item.orderedQty} ordered</div>
                        <div className="text-[10px] text-slate-400">
                          ({item.previouslyReceivedQty} received)
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={item.orderedQty - item.previouslyReceivedQty}
                          value={item.receivedThisDelivery}
                          onChange={(e) =>
                            handleUpdateItem(idx, "receivedThisDelivery", e.target.value)
                          }
                          className="w-full text-right px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                        />
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                        ₦{item.landedUnitCost.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-indigo-700">
                          ₦{projectedWAC.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          from ₦{item.currentWAC.toLocaleString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="e.g. LOT-2026-A"
                          value={item.batchNumber}
                          onChange={(e) => handleUpdateItem(idx, "batchNumber", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleUpdateItem(idx, "expiryDate", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                        />
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

