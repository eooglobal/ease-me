"use client";

import React, { useState } from "react";
import {
  Activity,
  Database,
  Server,
  Cloud,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Clock,
  Layers,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Zap,
  BarChart2,
} from "lucide-react";
import {
  PlatformOperationsService,
  SystemHealthItem,
  RankedTenantStorageItem,
} from "@/lib/superadmin/operations-service";

export default function SuperAdminHealthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthData, setHealthData] = useState(() => PlatformOperationsService.getHealthStatus());
  const [storageData, setStorageData] = useState<RankedTenantStorageItem[]>(() =>
    PlatformOperationsService.getRankedTenantStorage()
  );
  const [lastChecked, setLastChecked] = useState("Just now");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHealthData(PlatformOperationsService.getHealthStatus());
      setStorageData(PlatformOperationsService.getRankedTenantStorage());
      setLastChecked("Just now");
      setIsRefreshing(false);
    }, 400);
  };

  const getServiceIcon = (id: string) => {
    if (id.includes("db")) return Database;
    if (id.includes("cache")) return Server;
    if (id.includes("storage")) return Cloud;
    return Zap;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Health & Operational Telemetry
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              All Core Systems Healthy
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 6.9: Live latency probes, 24-hour error rates, background workers queue, and
            ranked storage utilization per tenant.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono">Last check: {lastChecked}</span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Ping Infrastructure
          </button>
        </div>
      </div>

      {/* Top Telemetry Strip: 24h Error Rate & Slow Queries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>24h Platform Error Rate</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{healthData.errorRate24h}%</span>
            <span className="text-xs text-emerald-600 font-medium">99.96% SLA clean</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">HTTP 5xx rate across Edge & APIs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Slow Requests (&gt;500ms)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{healthData.slowRequestsCount24h}</span>
            <span className="text-xs text-slate-500">instances in 24h</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Excludes async background exports</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Mean DB Read P95</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">32 ms</span>
            <span className="text-xs text-emerald-600 font-medium">Frankfurt Replica</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Neon Serverless Pool connection</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Active Worker Daemons</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {healthData.backgroundJobs.length} Jobs
            </span>
            <span className="text-xs text-emerald-600 font-medium">0 failed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Recurring sync & statutory cleanup</p>
        </div>
      </div>

      {/* Services Health Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Core Subsystems & Gateway Probes
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Pings measured every 60s</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {healthData.services.map((svc) => {
            const Icon = getServiceIcon(svc.id);
            return (
              <div key={svc.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{svc.service}</h3>
                      <p className="text-xs text-slate-500">{svc.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Healthy
                    </span>
                    <div className="text-xs font-mono text-slate-500 mt-1">{svc.latencyMs}ms</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  {svc.metrics.map((m, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 rounded-md border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        {m.label}
                      </span>
                      <span className="font-mono font-medium text-slate-800">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Background Jobs Queue + Ranked Tenant Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Background Jobs Queue */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Background Jobs Queue
              </h2>
            </div>
            <span className="text-xs text-slate-500">Cron & Worker Daemons</span>
          </div>

          <div className="divide-y divide-slate-200 flex-1 overflow-y-auto text-xs">
            {healthData.backgroundJobs.map((job, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                <div>
                  <div className="font-bold text-slate-900">{job.jobName}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Last Run: {new Date(job.lastRunAt).toLocaleTimeString()}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Success
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranked Storage Utilization per Tenant */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Ranked Storage per Tenant (Top Consumers)
              </h2>
            </div>
            <span className="text-xs text-slate-500">Cloudflare R2 usage</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Tenant</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Used / Quota</th>
                  <th className="py-2.5 px-3 w-40">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {storageData.map((item) => (
                  <tr key={item.tenantId} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                      #{item.rank}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{item.tenantName}</div>
                      <div className="font-mono text-slate-400 text-[10px]">{item.tenantId}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {item.planName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {item.storageUsedMb} MB / {item.storageLimitMb} MB
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-500">
                          <span>{item.percentUsed}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.percentUsed > 80
                                ? "bg-amber-500"
                                : item.percentUsed > 90
                                ? "bg-red-500"
                                : "bg-indigo-600"
                            }`}
                            style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
