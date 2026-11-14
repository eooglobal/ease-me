"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  CreditCard,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Server,
  Database,
  Cloud,
  ChevronRight,
  ShieldAlert,
  Flame,
  FileCheck,
} from "lucide-react";
import { TenantService } from "@/lib/superadmin/tenant-service";

export default function SuperAdminCommandOverviewPage() {
  const metrics = TenantService.getOverviewMetrics();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="text-indigo-700" size={22} />
            Platform Command Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time platform telemetry answering three questions: Is the platform healthy? Is money coming in? What needs attention today?
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/superadmin/tenants"
            className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md shadow-xs transition-colors"
          >
            Tenants Directory
          </Link>
          <Link
            href="/superadmin/approvals"
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileCheck size={14} />
            <span>Review Approvals</span>
          </Link>
        </div>
      </div>

      {/* QUESTION 1 & SUMMARY TILES: 7 Metrics (Section 6.1) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tenant Portfolio & Revenue Baseline
          </h2>
          <span className="text-[11px] font-mono text-slate-400">7 Core Platform Indicators</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Tile 1: Active Tenants */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block truncate">Active Tenants</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {metrics.summaryTiles.activeTenants}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold font-mono">Paying base</span>
          </div>

          {/* Tile 2: Trial Tenants */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block truncate">Trial Tenants</span>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">
              {metrics.summaryTiles.trialTenants}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">14-day window</span>
          </div>

          {/* Tile 3: Grace Period */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block truncate">In Grace Period</span>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">
              {metrics.summaryTiles.graceTenants}
            </div>
            <span className="text-[10px] text-rose-600 font-semibold font-mono">Failed charge</span>
          </div>

          {/* Tile 4: Suspended */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block truncate">Suspended</span>
            <div className="text-xl font-bold font-mono text-slate-700 mt-1">
              {metrics.summaryTiles.suspendedTenants}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Data locked</span>
          </div>

          {/* Tile 5: Monthly Recurring Revenue (MRR) */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs sm:col-span-1 lg:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 block truncate">Platform MRR</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
              ₦{(metrics.summaryTiles.mrr / 1000).toFixed(0)}k
            </div>
            <span className="text-[10px] text-emerald-700 font-mono font-semibold">₦{metrics.summaryTiles.mrr.toLocaleString()}</span>
          </div>

          {/* Tile 6: New Tenants This Month */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block truncate">New This Month</span>
            <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
              +{metrics.summaryTiles.newTenantsThisMonth}
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold font-mono">Net positive</span>
          </div>

          {/* Tile 7: Tenants Lost This Month */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block truncate">Tenants Lost</span>
            <div className="text-xl font-bold font-mono text-slate-500 mt-1">
              {metrics.summaryTiles.tenantsLostThisMonth}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">0% Churn rate</span>
          </div>
        </div>
      </section>

      {/* QUESTION 2: IS MONEY COMING IN? (Money Panel) */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Money Panel: Cash Inflow & Renewal Health
            </h2>
          </div>
          <Link
            href="/superadmin/billing"
            className="text-xs text-indigo-700 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Billing Console</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-5">
          {/* Revenue Collected This Month */}
          <div className="space-y-1 pr-4">
            <span className="text-xs font-medium text-slate-500">Revenue Collected This Month</span>
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              ₦{metrics.moneyPanel.revenueCollectedThisMonth.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Processed via Paystack SaaS recurring webhooks</span>
            </p>
          </div>

          {/* Failed Charges / At-Risk */}
          <div className="space-y-1 py-3 md:py-0 md:px-4">
            <span className="text-xs font-medium text-slate-500">Failed Charges in Grace</span>
            <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
              {metrics.moneyPanel.failedPaymentsCount} Tenant
              <span className="text-xs font-normal text-slate-500 ml-1.5">
                (₦{metrics.moneyPanel.failedPaymentsAmount.toLocaleString()})
              </span>
            </div>
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>Automatic 3-day retry countdown active</span>
            </p>
          </div>

          {/* Renewals Due in Next 7 Days */}
          <div className="space-y-1 pl-0 md:pl-4 pt-3 md:pt-0">
            <span className="text-xs font-medium text-slate-500">Renewals Due Next 7 Days</span>
            <div className="text-2xl font-bold font-mono text-indigo-900 tabular-nums">
              {metrics.moneyPanel.renewalsDueNext7Days} Subscriptions
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Expected Volume: ₦{metrics.moneyPanel.renewalsValueNext7Days.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* QUESTION 1 (CONT'D): IS THE PLATFORM HEALTHY? (Health Strip) */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Core Cloud Infrastructure Strip
            </h2>
          </div>
          <Link
            href="/superadmin/health"
            className="text-xs text-indigo-700 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Telemetry Detail</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-3">
          {metrics.healthStrip.map((item) => (
            <div key={item.service} className="p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 truncate">{item.service}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="text-emerald-700 font-bold">{item.status}</span>
                <span>{item.latency}</span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Checked {item.lastChecked}</span>
            </div>
          ))}
        </div>
      </section>

      {/* QUESTION 3: WHAT NEEDS ATTENTION TODAY? (Attention List) */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Attention Required Today
            </h2>
          </div>
          <span className="text-[11px] font-mono bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
            {metrics.attentionList.length} Action Items
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {metrics.attentionList.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    item.severity === "critical"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : item.severity === "warning"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[11px] font-mono text-slate-400">Triggered {item.age}</span>
                </div>
              </div>

              <Link
                href={item.href}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors flex items-center gap-1"
              >
                <span>Resolve</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
