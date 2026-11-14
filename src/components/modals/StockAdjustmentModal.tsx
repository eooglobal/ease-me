"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { ProductItem } from "./AddProductModal";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  defaultSku?: string;
  onAdjust: (data: { sku: string; countedQty: number; reason: string; note: string }) => void;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  products,
  defaultSku,
  onAdjust,
}: StockAdjustmentModalProps) {
  const [selectedSku, setSelectedSku] = useState(defaultSku || (products[0]?.sku ?? ""));
  const currentProduct = products.find((p) => p.sku === (selectedSku || defaultSku));
  const [countedStock, setCountedStock] = useState(currentProduct ? currentProduct.stock.toString() : "0");
  const [reason, setReason] = useState<"physical_count" | "damaged" | "expired" | "theft_loss">("physical_count");
  const [note, setNote] = useState("");

  const parsedCount = parseInt(countedStock) || 0;
  const variance = currentProduct ? parsedCount - currentProduct.stock : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSku = selectedSku || defaultSku || products[0]?.sku;
    if (!targetSku) return;

    onAdjust({
      sku: targetSku,
      countedQty: Math.max(0, parsedCount),
      reason,
      note: note.trim(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Count & Discrepancy Adjustment"
      subtitle="Adjust stock counts due to physical stocktake, shrinkage, expiration, or damage."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="space-y-1">
          <label className="font-semibold text-slate-800 text-xs">Select Item *</label>
          <select
            value={selectedSku || defaultSku}
            onChange={(e) => {
              setSelectedSku(e.target.value);
              const p = products.find((item) => item.sku === e.target.value);
              if (p) setCountedStock(p.stock.toString());
            }}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
          >
            {products.map((p) => (
              <option key={p.id} value={p.sku}>
                {p.name} ({p.sku}) — System: {p.stock}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Actual Physical Count *</label>
            <input
              type="number"
              required
              min="0"
              value={countedStock}
              onChange={(e) => setCountedStock(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 num-mono tabular-nums text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            >
              <option value="physical_count">Periodic Physical Count</option>
              <option value="damaged">Damaged Goods</option>
              <option value="expired">Expired Stock</option>
              <option value="theft_loss">Unexplained Shrinkage / Loss</option>
            </select>
          </div>
        </div>

        {/* Live Variance Calculation Alert */}
        <div
          className={`p-3 rounded-md border text-xs flex items-center justify-between font-semibold ${
            variance === 0
              ? "bg-slate-50 border-slate-200 text-slate-700"
              : variance > 0
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <span>Calculated Variance:</span>
          <span className="font-bold num-mono tabular-nums text-sm">
            {variance > 0 ? `+${variance}` : variance} units
          </span>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-800 text-xs">Audit Notes / Comments</label>
          <textarea
            rows={2}
            placeholder="e.g. Broken packaging discovered during shelf reorganisation..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
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
            Apply Adjustment & Log Audit
          </button>
        </div>
      </form>
    </Modal>
  );
}
