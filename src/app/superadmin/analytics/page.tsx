"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Repeat,
  Download,
  Calendar,
  Layers,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  HelpCircle,
} from "lucide-react";
import { PlatformOperationsService } from "@/lib/superadmin/operations-service";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

export default function SuperAdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"30d" | "90d" | "ytd">("30d");
  const [activeTab, setActiveTab] = useState<"all" | "growth" | "revenue" | "retention" | "usage" | "segments">("all");
  const data = PlatformOperationsService.getAnalyticsSummary();

  const handleExportCSV = () => {
    const rawRows = [
      ...data.growthTiles.map((t) => [ "Growth", t.question, t.headline, t.subtext, t.trend ]),
      ...data.revenueTiles.map((t) => [ "Revenue", t.question, t.headline, t.subtext, t.trend ]),
      ...data.retentionTiles.map((t) => [ "Retention", t.question, t.headline, t.subtext, t.trend ]),
      ...data.usageTiles.map((t) => [ "Usage", t.question, t.headline, t.subtext, t.trend ]),
    ];

    const csv = buildCSV(["Category", "Question", "Value", "Context", "Trend"], rawRows);
    downloadCSV(`platform-analytics-${timeframe}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Platform Growth, Revenue & Operations Analytics
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Zero Raw Sales Leakage
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 6.2: Platform-wide aggregate metrics. Every widget explicitly states the business question it answers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setTimeframe("30d")}
              className={`px-3 py-1.5 rounded-md transition ${
                timeframe === "30d" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeframe("90d")}
              className={`px-3 py-1.5 rounded-md transition ${
                timeframe === "90d" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => setTimeframe("ytd")}
              className={`px-3 py-1.5 rounded-md transition ${
                timeframe === "ytd" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Year to Date
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {[
          { id: "all", label: "All Analytics" },
          { id: "growth", label: "Acquisition & Activation" },
          { id: "revenue", label: "MRR & ARPU" },
          { id: "retention", label: "Cohort Retention & Churn" },
          { id: "usage", label: "Platform Usage & Concurrency" },
          { id: "segments", label: "Retail Segments & Geography" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === tab.id
                ? "bg-slate-100 text-slate-900 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section: Growth */}
      {(activeTab === "all" || activeTab === "growth") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Growth, Signups & Store Activation
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.growthTiles.map((tile, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium mb-3 min-h-[36px]">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{tile.question}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{tile.headline}</div>
                  <div className="text-xs text-slate-500 mt-1">{tile.subtext}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> {tile.trend}
                  </span>
                  <span className="text-[11px] text-slate-400">vs previous period</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Revenue */}
      {(activeTab === "all" || activeTab === "revenue") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Revenue, MRR & Unit Economics
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.revenueTiles.map((tile, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium mb-3 min-h-[36px]">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{tile.question}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{tile.headline}</div>
                  <div className="text-xs text-slate-500 mt-1">{tile.subtext}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> {tile.trend}
                  </span>
                  <span className="text-[11px] text-slate-400">Recurring Paystack MRR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Retention */}
      {(activeTab === "all" || activeTab === "retention") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Retention & Churn Dynamics
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.retentionTiles.map((tile, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium mb-3 min-h-[36px]">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{tile.question}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{tile.headline}</div>
                  <div className="text-xs text-slate-500 mt-1">{tile.subtext}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {tile.trend}
                  </span>
                  <span className="text-[11px] text-slate-400">Within healthy risk bounds</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Usage */}
      {(activeTab === "all" || activeTab === "usage") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              4. Platform Usage & Active Concurrency
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.usageTiles.map((tile, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium mb-3 min-h-[36px]">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{tile.question}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{tile.headline}</div>
                  <div className="text-xs text-slate-500 mt-1">{tile.subtext}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-indigo-700 font-semibold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> {tile.trend}
                  </span>
                  <span className="text-[11px] text-slate-400">Platform-wide aggregate</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Segments */}
      {(activeTab === "all" || activeTab === "segments") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              5. Tenant Segmentation by Business Type & Regional Hub
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Business Type */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">
                Distribution by Retail Vertical
              </h3>
              <div className="space-y-3">
                {data.segmentBreakdown.byBusinessType.map((seg, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{seg.type}</span>
                      <span>{seg.count} stores ({seg.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${seg.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Region */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">
                Distribution by Commercial Hub
              </h3>
              <div className="space-y-3">
                {data.segmentBreakdown.byRegion.map((reg, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{reg.region}</span>
                      <span>{reg.count} stores ({reg.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${reg.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
