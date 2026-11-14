"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

interface PurchaseOrderView {
  id: string;
  referenceNumber: string;
  supplierName: string;
  orderDate: string;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  paymentStatus: "paid" | "pending" | "partial";
  subtotal: number;
  freightCharge: number;
  otherFees: number;
  total: number;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    receivedQuantity: number;
    unitCost: number;
    landedUnitCost: number;
    total: number;
  }>;
}

export default function OwnerPurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderView | null>(null);

  const [orders, setOrders] = useState<PurchaseOrderView[]>([
    {
      id: "po-1",
      referenceNumber: "PO-20261105-1082",
      supplierName: "Mega Pharmaceuticals Ltd",
      orderDate: "Nov 5, 2026",
      status: "partial",
      paymentStatus: "pending",
      subtotal: 450000,
      freightCharge: 15000,
      otherFees: 5000,
      total: 470000,
      items: [
        {
          name: "Paracetamol 500mg Pack",
          sku: "MED-001",
          quantity: 200,
          receivedQuantity: 100,
          unitCost: 550,
          landedUnitCost: 574.44,
          total: 114888,
        },
        {
          name: "Amoxicillin 500mg Strip",
          sku: "MED-002",
          quantity: 150,
          receivedQuantity: 150,
          unitCost: 1200,
          landedUnitCost: 1253.33,
          total: 188000,
        },
      ],
    },
    {
      id: "po-2",
      referenceNumber: "PO-20261103-9912",
      supplierName: "Olam Grains & Wholesale Nig",
      orderDate: "Nov 3, 2026",
      status: "received",
      paymentStatus: "paid",
      subtotal: 1250000,
      freightCharge: 40000,
      otherFees: 10000,
      total: 1300000,
      items: [
        {
          name: "Royal Stallion Rice 50kg",
          sku: "GRN-010",
          quantity: 20,
          receivedQuantity: 20,
          unitCost: 62500,
          landedUnitCost: 65000,
          total: 1300000,
        },
      ],
    },
    {
      id: "po-3",
      referenceNumber: "PO-20261101-7721",
      supplierName: "Nestle Consumer Depot",
      orderDate: "Nov 1, 2026",
      status: "ordered",
      paymentStatus: "pending",
      subtotal: 320000,
      freightCharge: 10000,
      otherFees: 0,
      total: 330000,
      items: [
        {
          name: "Milo 500g Refill Pack",
          sku: "BEV-003",
          quantity: 100,
          receivedQuantity: 0,
          unitCost: 3200,
          landedUnitCost: 3300,
          total: 330000,
        },
      ],
    },
  ]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSpend = orders.reduce((acc, o) => acc + o.total, 0);
  const pendingIntakeCount = orders.filter((o) => o.status === "ordered" || o.status === "partial").length;

  const handleExportCSV = () => {
    const headers = [
      "PO Number",
      "Supplier",
      "Date",
      "Status",
      "Payment",
      "Subtotal (NGN)",
      "Freight (NGN)",
      "Other Fees (NGN)",
      "Total Landed (NGN)",
    ];

    const rows = filteredOrders.map((o) => [
      o.referenceNumber,
      o.supplierName,
      o.orderDate,
      o.status.toUpperCase(),
      o.paymentStatus.toUpperCase(),
      o.subtotal,
      o.freightCharge,
      o.otherFees,
      o.total,
    ]);

    const csv = buildCSV(headers, rows);
    downloadCSV(`EaseMe_Purchase_Orders_${new Date().toISOString().slice(0, 10)}`, csv);
  };

  return (
    <AppShell
      role="owner"
      userEmail="owner@alpha-retail.ng"
      userName="Chief Oladipo Alabi"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders &amp; Inbound</h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Procurement
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Purchase order lifecycle, landed cost allocations, and receiving intake
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <Link
              href="/owner/suppliers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Truck size={14} />
              <span>Suppliers</span>
            </Link>

            <Link
              href="/owner/purchases/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle size={14} />
              <span>New Purchase Order</span>
            </Link>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Purchase Orders</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{orders.length}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Recorded purchase history</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Orders Awaiting Receiving Intake</span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{pendingIntakeCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Ordered or partially delivered</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Landed Procurement Cost</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ₦{totalSpend.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Including freight &amp; fees</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO reference or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-semibold focus:bg-white outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="ordered">Ordered (Awaiting Goods)</option>
              <option value="partial">Partial Delivery</option>
              <option value="received">Fully Received</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">PO Number &amp; Date</th>
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3 text-right">Base Subtotal</th>
                  <th className="px-4 py-3 text-right">Landed Fees</th>
                  <th className="px-4 py-3 text-right">Total Landed Cost</th>
                  <th className="px-4 py-3">Order Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const landedFees = order.freightCharge + order.otherFees;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-slate-900">
                          {order.referenceNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">{order.orderDate}</div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900">{order.supplierName}</td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        ₦{order.subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {landedFees > 0
                          ? `+₦${landedFees.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                          : "₦0.00"}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ₦{order.total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3">
                        {order.status === "received" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            <span>Received</span>
                          </span>
                        ) : order.status === "partial" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={11} />
                            <span>Partial</span>
                          </span>
                        ) : order.status === "ordered" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <PackageCheck size={11} />
                            <span>Ordered</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <span>Draft</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-medium ${
                            order.paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {order.paymentStatus === "paid" ? "Fully Paid" : "Unpaid Obligation"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status !== "received" && (
                            <Link
                              href={`/owner/purchases/${order.id}/receive`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md transition-colors shadow-xs"
                            >
                              <PackageCheck size={12} />
                              <span>Receive</span>
                            </Link>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                          >
                            <Eye size={12} />
                            <span>Drawer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PO Detail Drawer */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end">
            <div className="bg-white h-full w-full max-w-lg shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Purchase Order Details</h2>
                    <span className="font-mono text-slate-500">#{selectedOrder.referenceNumber}</span>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplier:</span>
                    <span className="font-semibold text-slate-900">{selectedOrder.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order Date:</span>
                    <span className="text-slate-900">{selectedOrder.orderDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lifecycle Status:</span>
                    <span className="font-semibold uppercase">{selectedOrder.status}</span>
                  </div>
                </div>

                {/* Landed Cost Breakdown */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-1.5">
                  <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100">
                    Landed Cost Summary
                  </span>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Items Subtotal:</span>
                    <span className="font-mono">
                      ₦{selectedOrder.subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Freight / Transport:</span>
                    <span className="font-mono">
                      +₦{selectedOrder.freightCharge.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Handling &amp; Other Fees:</span>
                    <span className="font-mono">
                      +₦{selectedOrder.otherFees.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Landed Cost:</span>
                    <span className="font-mono text-indigo-700">
                      ₦{selectedOrder.total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Items & Landed Allocations */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block">Ordered Items &amp; Landed Unit Costs</span>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2 text-left">Item</th>
                          <th className="p-2 text-right">Qty</th>
                          <th className="p-2 text-right">Base Cost</th>
                          <th className="p-2 text-right">Landed Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items.map((i, idx) => (
                          <tr key={idx}>
                            <td className="p-2">
                              <div className="font-medium text-slate-900">{i.name}</div>
                              <div className="text-[10px] text-slate-400">{i.sku}</div>
                            </td>
                            <td className="p-2 text-right font-mono">
                              {i.receivedQuantity}/{i.quantity}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-600">
                              ₦{i.unitCost.toLocaleString()}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              ₦{i.landedUnitCost.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                {selectedOrder.status !== "received" ? (
                  <Link
                    href={`/owner/purchases/${selectedOrder.id}/receive`}
                    className="px-4 py-2 font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <PackageCheck size={14} />
                    <span>Open Goods Intake Screen</span>
                  </Link>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    <span>Intake Completed</span>
                  </span>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

