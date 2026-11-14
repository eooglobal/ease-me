"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowLeft,
  Truck,
  Plus,
  Trash2,
  DollarSign,
  Calculator,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PurchaseCalc, PurchaseOrderItemInput } from "@/lib/purchases/purchase-calc";

interface ProductCatalogOption {
  id: string;
  name: string;
  sku: string;
  currentCost: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState("supp-1");
  const [freight, setFreight] = useState("15000");
  const [otherFees, setOtherFees] = useState("5000");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [catalog] = useState<ProductCatalogOption[]>([
    { id: "prod-1", name: "Paracetamol 500mg Pack", sku: "MED-001", currentCost: 550 },
    { id: "prod-2", name: "Amoxicillin 500mg Strip", sku: "MED-002", currentCost: 1200 },
    { id: "prod-3", name: "Royal Stallion Rice 50kg", sku: "GRN-010", currentCost: 62500 },
    { id: "prod-4", name: "Milo 500g Refill Pack", sku: "BEV-003", currentCost: 3200 },
  ]);

  const [items, setItems] = useState<PurchaseOrderItemInput[]>([
    { productId: "prod-1", productName: "Paracetamol 500mg Pack", quantity: 200, unitCost: 550 },
    { productId: "prod-2", productName: "Amoxicillin 500mg Strip", quantity: 150, unitCost: 1200 },
  ]);

  const parsedFreight = parseFloat(freight) || 0;
  const parsedOtherFees = parseFloat(otherFees) || 0;

  // Live Landed Cost Calculation
  const landedCalculation = PurchaseCalc.distributeLandedCosts(
    items,
    parsedFreight,
    parsedOtherFees
  );

  const handleAddItem = () => {
    const available = catalog.find((p) => !items.some((i) => i.productId === p.id)) || catalog[0];
    setItems((prev) => [
      ...prev,
      {
        productId: available.id,
        productName: available.name,
        quantity: 50,
        unitCost: available.currentCost,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, field: "productId" | "quantity" | "unitCost", value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "productId") {
          const match = catalog.find((c) => c.id === value);
          return {
            ...item,
            productId: value,
            productName: match?.name || "Product",
            unitCost: match?.currentCost || item.unitCost,
          };
        }
        return {
          ...item,
          [field]: field === "quantity" ? Math.max(1, parseInt(value, 10) || 1) : Math.max(0, parseFloat(value) || 0),
        };
      })
    );
  };

  const handleSaveOrder = (status: "draft" | "ordered") => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/owner/purchases");
    }, 500);
  };

  return (
    <AppShell
      role="owner"
      userEmail="owner@alpha-retail.ng"
      userName="Chief Oladipo Alabi"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <Link
              href="/owner/purchases"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-semibold mb-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Purchases</span>
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Purchase Order Builder</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Build inbound order, allocate freight and handling landed additions proportionally across goods
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleSaveOrder("draft")}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSaveOrder("ordered")}
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Truck size={14} />
              <span>Place Purchase Order</span>
            </button>
          </div>
        </div>

        {/* Supplier & Landed Fees Header Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Supplier Select */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2 text-xs">
            <label className="font-semibold text-slate-900 block">Select Supplier *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-700 outline-none"
            >
              <option value="supp-1">Mega Pharmaceuticals Ltd</option>
              <option value="supp-2">Olam Grains & Wholesale Nig</option>
              <option value="supp-3">Nestle Consumer Depot</option>
              <option value="supp-4">Dangote Sugar & Flour Refinery</option>
            </select>
            <span className="text-[11px] text-slate-400 block">Standard delivery terms: Net 14 Days</span>
          </div>

          {/* Freight / Transport Addition */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2 text-xs">
            <label className="font-semibold text-slate-900 block">Freight / Transport Cost (₦)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-mono">₦</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-700 outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-400 block">Distributed across items by value</span>
          </div>

          {/* Other Landed Fees (Customs/Handling) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2 text-xs">
            <label className="font-semibold text-slate-900 block">Handling &amp; Other Fees (₦)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-mono">₦</span>
              <input
                type="number"
                min="0"
                step="500"
                value={otherFees}
                onChange={(e) => setOtherFees(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-700 outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-400 block">Offloading, demurrage, or port clearance</span>
          </div>
        </div>

        {/* Items Table & Landed Cost Distribution Preview */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Purchase Order Items</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Landed Unit Cost is automatically computed proportionally based on item value
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              <Plus size={14} />
              <span>Add Product Row</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 text-right w-28">Order Qty</th>
                  <th className="px-4 py-3 text-right w-36">Base Cost (₦)</th>
                  <th className="px-4 py-3 text-right">Base Subtotal</th>
                  <th className="px-4 py-3 text-right">Landed Share</th>
                  <th className="px-4 py-3 text-right">Landed Unit Cost</th>
                  <th className="px-4 py-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {landedCalculation.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(idx, "productId", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-medium focus:ring-1 focus:ring-indigo-700 outline-none"
                      >
                        {catalog.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.sku})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)}
                        className="w-full text-right px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                      />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitCost}
                        onChange={(e) => handleUpdateItem(idx, "unitCost", e.target.value)}
                        className="w-full text-right px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                      />
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      ₦{item.baseTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      +₦{item.allocatedFee.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                      ₦{item.landedUnitCost.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className={`p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors ${
                          items.length <= 1 ? "opacity-30 cursor-not-allowed" : ""
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Landed Summary Totals Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 block">Distribution Note:</span>
              <p className="text-slate-500">
                ₦{landedCalculation.totalLandedAdditions.toLocaleString()} total fees distributed across {items.length} items by value.
              </p>
            </div>

            <div className="space-y-1 text-right">
              <div className="text-slate-500">
                Items Base: ₦{landedCalculation.totalBaseValue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                Total Landed Purchase Cost: ₦
                {landedCalculation.grandTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Order Notes */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2 text-xs">
          <label className="font-semibold text-slate-900 block">Purchase Order Delivery Instructions</label>
          <textarea
            rows={2}
            placeholder="e.g. Deliver to main warehouse gate between 9 AM and 3 PM. Batch inspection required."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-700 outline-none"
          />
        </div>
      </div>
    </AppShell>
  );
}

