"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Tag,
  Clock,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { AddProductModal, ProductItem } from "@/components/modals/AddProductModal";
import { RestockIntakeModal } from "@/components/modals/RestockIntakeModal";
import { exportInventoryToCSV } from "@/lib/export/export-utils";

export default function OwnerInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<ProductItem | null>(null);

  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: "prod-1",
      name: "Paracetamol 500mg (Pack of 20)",
      category: "Pharmaceuticals",
      sku: "MED-001",
      barcode: "6151234567890",
      cost: 1200,
      price: 1800,
      stock: 45,
      minStock: 20,
      unit: "pack",
    },
    {
      id: "prod-2",
      name: "Amoxicillin 250mg Capsules",
      category: "Pharmaceuticals",
      sku: "MED-002",
      barcode: "6151234567891",
      cost: 2400,
      price: 3500,
      stock: 8, // Low stock
      minStock: 15,
      unit: "pack",
    },
    {
      id: "prod-3",
      name: "Golden Penny Vegetable Oil 5L",
      category: "Groceries",
      sku: "GROC-010",
      barcode: "6159876543210",
      cost: 8500,
      price: 10200,
      stock: 32,
      minStock: 10,
      unit: "bottle",
    },
    {
      id: "prod-4",
      name: "Dano Full Cream Milk Powder 800g",
      category: "Groceries",
      sku: "GROC-015",
      barcode: "6159876543211",
      cost: 3800,
      price: 4600,
      stock: 5, // Low stock
      minStock: 12,
      unit: "tin",
    },
    {
      id: "prod-5",
      name: "Oral-B Pro-Expert Toothpaste 100ml",
      category: "Toiletries",
      sku: "TOIL-005",
      barcode: "6155555555555",
      cost: 1100,
      price: 1650,
      stock: 64,
      minStock: 15,
      unit: "tube",
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddProduct = (item: ProductItem) => {
    setProducts([item, ...products]);
    triggerToast(`Created product: ${item.name}`);
  };

  const handleRestockComplete = (data: { sku: string; qty: number; unitCost: number; supplierName: string }) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === data.sku) {
          const currentQty = p.stock;
          const currentCost = p.cost;
          const newQty = currentQty + data.qty;
          // Weighted Average Cost recalculation
          const newWac = Math.round(((currentQty * currentCost) + (data.qty * data.unitCost)) / newQty);
          return {
            ...p,
            stock: newQty,
            cost: newWac,
          };
        }
        return p;
      })
    );
    triggerToast(`Restocked ${data.qty} units of ${data.sku}. WAC updated.`);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || p.stock <= p.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const totalStockValuation = products.reduce((acc, p) => acc + p.stock * p.cost, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Catalog</h1>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                {products.length} SKUs
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Perpetual stock valuation, WAC landed costs, and minimum threshold reorder alerts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportInventoryToCSV(products)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
            >
              <Plus size={15} />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs for Inventory Sub-Modules */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
          <Link
            href="/owner/inventory"
            className="px-3 py-1.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
          >
            Catalog & Products
          </Link>
          <Link
            href="/owner/inventory/adjustments"
            className="px-3 py-1.5 rounded-md font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            Stock Adjustments & Loss
          </Link>
          <Link
            href="/owner/inventory/batches"
            className="px-3 py-1.5 rounded-md font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            Batches & Expiry (FEFO)
          </Link>
          <Link
            href="/owner/inventory/stocktake"
            className="px-3 py-1.5 rounded-md font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            Stocktake & Count Sessions
          </Link>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Stock Valuation (WAC)</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ₦{totalStockValuation.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Calculated at current landed cost</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Catalogued SKUs</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{products.length} Items</div>
            <p className="text-[11px] text-slate-500 mt-1">Across {categories.length} active categories</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Low Stock Reorders</span>
              <AlertTriangle size={15} className="text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1">{lowStockCount} SKUs</div>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Below minimum threshold</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-700 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                showLowStockOnly
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Low Stock Only ({lowStockCount})
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Product & Category</th>
                  <th className="py-2.5 px-4">SKU / Barcode</th>
                  <th className="py-2.5 px-4 text-right">Cost (WAC)</th>
                  <th className="py-2.5 px-4 text-right">Selling Price</th>
                  <th className="py-2.5 px-4 text-right">Margin (%)</th>
                  <th className="py-2.5 px-4 text-right">Stock Level</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  const marginPct = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/owner/inventory/${p.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-700 hover:underline block"
                        >
                          {p.name}
                        </Link>
                        <span className="text-[11px] text-slate-500">{p.category}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>{p.sku}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400">{p.barcode}</div>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                        ₦{p.cost.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₦{p.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                        {marginPct}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`font-bold ${isLow ? "text-rose-600" : "text-slate-900"}`}>
                          {p.stock} {p.unit || "unit"}s
                        </span>
                        <div className="text-[10px] text-slate-400">Min: {p.minStock}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isLow
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isLow ? (
                            <>
                              <AlertTriangle size={10} />
                              <span>Reorder</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={10} />
                              <span>In Stock</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProductForRestock(p);
                            setIsRestockModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
                        >
                          Restock
                        </button>
                        <Link
                          href={`/owner/inventory/${p.id}`}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                        >
                          History
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProduct}
      />

      {/* Restock Intake Modal (with WAC calculation) */}
      <RestockIntakeModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        products={products}
        defaultSku={selectedProductForRestock?.sku}
        onRestock={handleRestockComplete}
      />
    </AppShell>
  );
}
