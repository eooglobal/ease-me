"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileCheck,
  CalendarCheck,
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  Users,
  ShoppingCart,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default function ManagerOperationsBoardPage() {
  const operations = {
    openShifts: 2,
    pendingApprovalsCount: 3,
    lowStockCount: 2,
    expiringBatchesCount: 1,
    todaySalesVolume: 48,
    todaySalesTotal: 342850,
  };

  const pendingApprovals = [
    {
      id: "APP-01",
      title: "Till Shortage Co-Sign (-₦2,200)",
      requester: "Adaeze Okon (POS-01)",
      category: "Shift Shortage",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      link: "/manager/approvals",
    },
    {
      id: "APP-02",
      title: "Damaged Stock Write-off (₦5,200 loss)",
      requester: "Emeka Chidi (Warehouse)",
      category: "Stock Write-off",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      link: "/manager/approvals",
    },
    {
      id: "APP-03",
      title: "Credit Headroom Override (Alhaji Musa)",
      requester: "John Danladi (POS-02)",
      category: "Credit Override",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      link: "/manager/approvals",
    },
  ];

  const operationalAlerts = [
    {
      id: "alt-1",
      title: "Amoxicillin 250mg Capsules critically low (8 left)",
      sub: "Safety reorder threshold is 15 units. PO order suggested.",
      actionText: "Manage Stock",
      href: "/manager/inventory",
      badge: "Stock Alert",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "alt-2",
      title: "Paracetamol 500mg Batch 2024-001 expires in 22 days",
      sub: "45 packs remaining. First-expired first-out prioritization advised.",
      actionText: "Batches",
      href: "/owner/inventory/batches",
      badge: "FEFO Alert",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "alt-3",
      title: "Till POS-01 has active session with ₦203,800 cash",
      sub: "Blind count required at shift close. Cashier: Adaeze Okon.",
      actionText: "Review Shifts",
      href: "/manager/shifts",
      badge: "Active Till",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ];

  return (
    <AppShell role="manager">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manager Operations Board</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Floor Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily floor oversight: till sessions, authorization queue, stock exceptions, and staff shifts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/manager/approvals"
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileCheck size={14} />
              <span>Approvals Queue ({operations.pendingApprovalsCount})</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Operations KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/manager/approvals"
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors block"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Pending Approvals</span>
                <FileCheck size={16} className="text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
                {operations.pendingApprovalsCount}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>Requires manager sign</span>
                <ChevronRight size={13} className="text-slate-400" />
              </div>
            </Link>

            <Link
              href="/manager/shifts"
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors block"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Open Till Shifts</span>
                <CalendarCheck size={16} className="text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {operations.openShifts} Registers
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>POS-01, POS-02 live</span>
                <ChevronRight size={13} className="text-slate-400" />
              </div>
            </Link>

            <Link
              href="/manager/inventory"
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors block"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Low Stock Alerts</span>
                <Boxes size={16} className="text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
                {operations.lowStockCount} Products
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>Below reorder point</span>
                <ChevronRight size={13} className="text-slate-400" />
              </div>
            </Link>

            <Link
              href="/manager/sales"
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors block"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Today&apos;s Receipts</span>
                <ShoppingCart size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {operations.todaySalesVolume}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span className="font-mono tabular-nums font-semibold text-slate-700">
                  ₦{operations.todaySalesTotal.toLocaleString()}
                </span>
                <ChevronRight size={13} className="text-slate-400" />
              </div>
            </Link>
          </div>

          {/* Actionable Exceptions List */}
          <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Immediate Operational Exceptions</h2>
              </div>
              <span className="text-xs text-slate-500">Live feed</span>
            </div>

            <div className="divide-y divide-slate-100">
              {operationalAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md border shrink-0 mt-0.5 ${alt.badgeClass}`}
                    >
                      {alt.badge}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">{alt.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alt.sub}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={alt.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <span>{alt.actionText}</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Two-Column Grid: Pending Approvals & Operations Shortcuts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Approvals Teaser */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Queue Items Awaiting Authorization</h3>
                  <p className="text-xs text-slate-500">Fast sign-off for registers and inventory</p>
                </div>
                <Link
                  href="/manager/approvals"
                  className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Open Queue</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              <div className="space-y-3">
                {pendingApprovals.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-md border mb-1 ${app.badgeClass}`}
                      >
                        {app.category}
                      </span>
                      <p className="font-bold text-slate-900 truncate">{app.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">By {app.requester}</p>
                    </div>

                    <Link
                      href={app.link}
                      className="shrink-0 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Operations Actions */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Quick Operational Actions</h3>
                <p className="text-xs text-slate-500 mb-4">Direct paths for floor management</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Link
                    href="/manager/shifts"
                    className="p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors block"
                  >
                    <CalendarCheck size={18} className="text-indigo-700 mb-1.5" />
                    <p className="font-bold text-slate-900">Co-Sign Tills</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Resolve shift variances</p>
                  </Link>

                  <Link
                    href="/manager/purchases"
                    className="p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors block"
                  >
                    <Truck size={18} className="text-blue-700 mb-1.5" />
                    <p className="font-bold text-slate-900">Receive Orders</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Intake PO deliveries</p>
                  </Link>

                  <Link
                    href="/manager/customers"
                    className="p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors block"
                  >
                    <Users size={18} className="text-purple-700 mb-1.5" />
                    <p className="font-bold text-slate-900">Customer Debts</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Log repayments & limits</p>
                  </Link>

                  <Link
                    href="/manager/schedule"
                    className="p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors block"
                  >
                    <Clock size={18} className="text-emerald-700 mb-1.5" />
                    <p className="font-bold text-slate-900">Shift Roster</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Assign staff schedules</p>
                  </Link>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Role: Store Manager</span>
                <span className="font-mono">Security Level: Admin</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
