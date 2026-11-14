"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  SlidersHorizontal,
  FileCheck,
  Calendar,
} from "lucide-react";
import { AddProductModal, ProductItem } from "@/components/modals/AddProductModal";
import { RestockIntakeModal } from "@/components/modals/RestockIntakeModal";
import { exportInventoryToCSV } from "@/lib/export/export-utils";

export default function ManagerInventoryPage() {
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
      cost: 2500,
      price: 3800,
      stock: 8,
      minStock: 15, // Low stock alert!
      unit: "box",
    },
    {
      id: "prod-3",
      name: "Golden Penny Vegetable Oil 5L",
      category: "Groceries",
      sku: "GROC-001",
      barcode: "6159876543210",
      cost: 8500,
      price: 10000,
      stock: 24,
      minStock: 10,
      unit: "gallon",
    },
    {
      id: "prod-4",
      name: "Dangote Granulated Sugar 50kg Bag",
      category: "Commodities",
      sku: "COMM-001",
      barcode: "6155554443332",
      cost: 72000,
      price: 84000,
      stock: 3,
      minStock: 5, // Low stock alert!
      unit: "bag",
    },
    {
      id: "prod-5",
      name: "Peak Milk Powder 800g Tin",
      category: "Groceries",
      sku: "GROC-002",
      barcode: "6154443332221",
      cost: 4100,
      price: 4900,
      stock: 36,
      minStock: 12,
      unit: "tin",
    },
  ]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));

    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || p.stock <= p.minStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const handleExport = () => {
    exportInventoryToCSV(filteredProducts);
  };

  const handleAddProduct = (newProd: ProductItem) => {
    setProducts([...products, newProd]);
  };

  return (
    <AppShell role="manager">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Operations</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-full font-mono">
                {products.length} Products
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage live stock on hand, safety reorder thresholds, and intake restocks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Sub-navigation pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/owner/inventory/adjustments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-xs transition-colors"
            >
              <SlidersHorizontal size={14} />
              <span>Stock Adjustments</span>
            </Link>
            <Link
              href="/owner/inventory/batches"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-xs transition-colors"
            >
              <Calendar size={14} />
              <span>Batches & FEFO Expiry</span>
            </Link>
            <Link
              href="/owner/inventory/stocktake"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-xs transition-colors"
            >
              <FileCheck size={14} />
              <span>Stocktake Audit</span>
            </Link>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-1 focus:ring-indigo-700 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Pharmaceuticals">Pharmaceuticals</option>
                <option value="Groceries">Groceries</option>
                <option value="Commodities">Commodities</option>
              </select>

              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 ${
                  showLowStockOnly
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <AlertTriangle size={13} className={showLowStockOnly ? "text-amber-600" : "text-slate-400"} />
                <span>Low Stock ({lowStockCount})</span>
              </button>
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Product & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Cost Price (WAC)</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Live Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.minStock;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {p.sku} {p.barcode ? `· ${p.barcode}` : ""}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-medium">
                          ₦{p.cost.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-medium">
                          ₦{p.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {p.stock} {p.unit}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              isLow
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {isLow ? `Low (Min ${p.minStock})` : "In Stock"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedProductForRestock(p);
                              setIsRestockModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Modals */}
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddProduct}
        />

        {selectedProductForRestock && (
          <RestockIntakeModal
            isOpen={isRestockModalOpen}
            onClose={() => {
              setIsRestockModalOpen(false);
              setSelectedProductForRestock(null);
            }}
            products={products}
            defaultSku={selectedProductForRestock.sku}
            onRestock={(data) => {
              setProducts(
                products.map((p) =>
                  p.sku === data.sku
                    ? { ...p, stock: p.stock + data.qty, cost: data.unitCost }
                    : p
                )
              );
              setIsRestockModalOpen(false);
              setSelectedProductForRestock(null);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
