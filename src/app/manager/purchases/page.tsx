"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  Eye,
  PackageCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface PurchaseOrderView {
  id: string;
  referenceNumber: string;
  supplierName: string;
  orderDate: string;
  status: "draft" | "ordered" | "partial" | "received";
  total: number;
}

export default function ManagerPurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [orders] = useState<PurchaseOrderView[]>([
    {
      id: "po-1",
      referenceNumber: "PO-20261105-1082",
      supplierName: "Mega Pharmaceuticals Ltd",
      orderDate: "Nov 5, 2026",
      status: "partial",
      total: 470000,
    },
    {
      id: "po-2",
      referenceNumber: "PO-20261103-9912",
      supplierName: "Olam Grains & Wholesale Nig",
      orderDate: "Nov 3, 2026",
      status: "received",
      total: 1300000,
    },
    {
      id: "po-3",
      referenceNumber: "PO-20261101-7721",
      supplierName: "Nestle Consumer Depot",
      orderDate: "Nov 1, 2026",
      status: "ordered",
      total: 330000,
    },
  ]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell
      role="manager"
      userEmail="manager@alpha-retail.ng"
      userName="Chinedu Obi"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders &amp; Receiving</h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inbound stock procurement, supplier goods intake, and delivery verification
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/owner/purchases/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle size={14} />
              <span>Create Purchase Order</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference or supplier..."
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
              <option value="ordered">Ordered (Awaiting Intake)</option>
              <option value="partial">Partial Delivery</option>
              <option value="received">Received</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">PO Reference &amp; Date</th>
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3 text-right">Total Landed Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Intake Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-slate-900">{order.referenceNumber}</div>
                      <div className="text-[11px] text-slate-400">{order.orderDate}</div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900">{order.supplierName}</td>

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
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <PackageCheck size={11} />
                          <span>Ordered</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {order.status !== "received" ? (
                        <Link
                          href={`/owner/purchases/${order.id}/receive`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md transition-colors shadow-xs"
                        >
                          <PackageCheck size={12} />
                          <span>Receive Goods</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

