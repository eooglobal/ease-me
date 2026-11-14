"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { AlertCircle, ArrowUpRight } from "lucide-react";

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  unit?: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: ProductItem) => void;
  productCount?: number;
  maxProducts?: number;
  onUpgradeClick?: () => void;
}

export function AddProductModal({
  isOpen,
  onClose,
  onAdd,
  productCount,
  maxProducts,
  onUpgradeClick,
}: AddProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [sku, setSku] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("10");

  const isQuotaReached =
    productCount !== undefined && maxProducts !== undefined && productCount >= maxProducts;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuotaReached) return;
    if (!name || !price || !cost) return;

    const generatedSku = sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

    onAdd({
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      category: category.trim(),
      sku: generatedSku.toUpperCase(),
      cost: parseFloat(cost) || 0,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 5,
    });

    // Reset
    setName("");
    setSku("");
    setCost("");
    setPrice("");
    setStock("");
    setMinStock("10");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Inventory Product"
      subtitle="Register a new SKU with cost valuation and reorder thresholds."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {isQuotaReached && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3 text-xs text-amber-900 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-950">
                Catalog Limit Reached ({productCount}/{maxProducts} products)
              </p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                The Freemium Starter tier is limited to {maxProducts} products. Upgrade to Growth to manage up to 1,000 products with barcode scanning & stock tracking.
              </p>
              {onUpgradeClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUpgradeClick();
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                >
                  <span>Explore Growth & Business Plans</span>
                  <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="font-semibold text-slate-800 text-xs">Product Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Paracetamol 500mg (100 Tabs)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Category</label>
            <input
              type="text"
              placeholder="e.g. Pharmacy, Groceries"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">SKU / Barcode (Optional)</label>
            <input
              type="text"
              placeholder="Auto-generated if empty"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none uppercase font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Unit Cost (₦) *</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              placeholder="e.g. 500"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 num-mono tabular-nums text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Selling Price (₦) *</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              placeholder="e.g. 800"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 num-mono tabular-nums text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Initial Stock Quantity</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 num-mono tabular-nums text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Reorder Alert Level</label>
            <input
              type="number"
              min="1"
              placeholder="10"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 num-mono tabular-nums text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
            />
          </div>
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
            disabled={isQuotaReached}
            className="px-4 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isQuotaReached ? "Product Limit Exceeded" : "Save Product to Catalog"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
