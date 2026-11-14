"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { ProductItem } from "./AddProductModal";

interface RestockIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  defaultSku?: string;
  onRestock: (data: { sku: string; qty: number; unitCost: number; supplierName: string }) => void;
}

export function RestockIntakeModal({
  isOpen,
  onClose,
  products,
  defaultSku,
  onRestock,
}: RestockIntakeModalProps) {
  const [selectedSku, setSelectedSku] = useState(defaultSku || (products[0]?.sku ?? ""));
  const [qty, setQty] = useState("20");
  const [unitCost, setUnitCost] = useState("");
  const [supplierName, setSupplierName] = useState("Direct Distribution");

  const currentProduct = products.find((p) => p.sku === (selectedSku || defaultSku));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = parseInt(qty);
    const parsedCost = parseFloat(unitCost) || (currentProduct?.cost ?? 0);
    const targetSku = selectedSku || defaultSku || products[0]?.sku;

    if (!targetSku || isNaN(parsedQty) || parsedQty <= 0) return;

    onRestock({
      sku: targetSku,
      qty: parsedQty,
      unitCost: parsedCost,
      supplierName: supplierName.trim() || "Supplier",
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Stock Batch (Intake)"
      subtitle="Record incoming inventory units and automatically recalculate Weighted Average Cost (WAC)."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="space-y-1">
          <label className="font-semibold text-slate-800 text-xs">Select Item to Restock *</label>
          <select
            value={selectedSku || defaultSku}
            onChange={(e) => {
              setSelectedSku(e.target.value);
              const p = products.find((item) => item.sku === e.target.value);
              if (p) setUnitCost(p.cost.toString());
            }}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
          >
            {products.map((p) => (
              <option key={p.id} value={p.sku}>
                {p.name} ({p.sku}) — Current Stock: {p.stock}
              </option>
            ))}
          </select>
        </div>

        {currentProduct && (
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200/90 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Current Stock on Hand:</span>
              <span className="font-bold text-slate-900 num-mono tabular-nums text-xs">{currentProduct.stock} units</span>
            </div>
            <div className="flex justify-between">
              <span>Current Unit Cost (WAC):</span>
              <span className="font-bold text-slate-900 num-mono tabular-nums text-xs">₦{currentProduct.cost.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Units Received *</label>
            <input
              type="number"
              required
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 num-mono tabular-nums text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Supplier Unit Cost (₦) *</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              placeholder={currentProduct?.cost.toString() ?? "0"}
              value={unitCost || (currentProduct?.cost ? currentProduct.cost.toString() : "")}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 num-mono tabular-nums text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-800 text-xs">Supplier / Source</label>
          <input
            type="text"
            placeholder="e.g. Dangote Distribution, Emzor Pharmaceuticals"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-xs transition-colors"
          >
            Confirm Stock Intake
          </button>
        </div>
      </form>
    </Modal>
  );
}
