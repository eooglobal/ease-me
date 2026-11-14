"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Building,
  TrendingUp,
  CreditCard,
  Users,
  Search,
  Activity,
  Server,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ExternalLink,
  LogOut,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface TenantStore {
  id: string;
  name: string;
  type: string;
  ownerEmail: string;
  plan: "Starter" | "Growth" | "Business" | "Enterprise";
  mrr: number;
  status: "active" | "suspended";
  createdDate: string;
  totalSales: number;
}

interface SuperAdminDashboardProps {
  onLogout?: () => void;
  onSwitchToTenant?: (tenantName: string) => void;
  triggerToast: (msg: string) => void;
}

type SuperAdminTab = "overview" | "tenants" | "infrastructure" | "audit";

export function SuperAdminDashboard({
  onLogout,
  onSwitchToTenant,
  triggerToast,
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("all");

  const [tenants, setTenants] = useState<TenantStore[]>([
    {
      id: "ten-001",
      name: "Alpha Health & Retail Emporium Ltd",
      type: "Pharmacy & Retail",
      ownerEmail: "owner@alpha-retail.ng",
      plan: "Growth",
      mrr: 28000,
      status: "active",
      createdDate: "2026-09-15",
      totalSales: 4850000,
    },
    {
      id: "ten-002",
      name: "Lekki Superette & Cold Store",
      type: "Supermarket",
      ownerEmail: "manager@lekkisuperette.ng",
      plan: "Business",
      mrr: 38000,
      status: "active",
      createdDate: "2026-09-22",
      totalSales: 8920000,
    },
    {
      id: "ten-003",
      name: "Ikeja Provisions & Wholesale Hub",
      type: "Wholesale",
      ownerEmail: "orders@ikejawholesale.com",
      plan: "Enterprise",
      mrr: 58000,
      status: "active",
      createdDate: "2026-10-01",
      totalSales: 15400000,
    },
    {
      id: "ten-004",
      name: "Grace Mini Mart Yaba",
      type: "Retail Grocery",
      ownerEmail: "grace@minimartyaba.ng",
      plan: "Starter",
      mrr: 0,
      status: "active",
      createdDate: "2026-10-14",
      totalSales: 640000,
    },
    {
      id: "ten-005",
      name: "Victoria Island Organic Pantry",
      type: "Supermarket",
      ownerEmail: "finance@vi-organic.ng",
      plan: "Growth",
      mrr: 28000,
      status: "suspended",
      createdDate: "2026-08-30",
      totalSales: 2150000,
    },
  ]);

  const toggleTenantStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newStatus = t.status === "active" ? "suspended" : "active";
          triggerToast(
            `Tenant "${t.name}" status changed to ${newStatus.toUpperCase()}`
          );
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  const handleUpgradePlan = (id: string, newPlan: "Starter" | "Growth" | "Business" | "Enterprise") => {
    const prices = { Starter: 0, Growth: 28000, Business: 38000, Enterprise: 58000 };
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          triggerToast(`Tenant "${t.name}" tier modified to ${newPlan}`);
          return { ...t, plan: newPlan, mrr: prices[newPlan] };
        }
        return t;
      })
    );
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan =
      selectedPlanFilter === "all" || t.plan.toLowerCase() === selectedPlanFilter.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  const totalMRR = tenants.reduce((acc, t) => acc + (t.status === "active" ? t.mrr : 0), 0);
  const totalVolume = tenants.reduce((acc, t) => acc + t.totalSales, 0);
  const activeTenantsCount = tenants.filter((t) => t.status === "active").length;

  const navigationItems = [
    {
      id: "overview" as SuperAdminTab,
      label: "Platform Overview",
      description: "MRR telemetry & revenue scale",
      icon: BarChart3,
    },
    {
      id: "tenants" as SuperAdminTab,
      label: "Tenant Workspaces",
      description: "Stores, subscriptions & overrides",
      icon: Building,
      badge: `${tenants.length}`,
    },
    {
      id: "infrastructure" as SuperAdminTab,
      label: "Cloud Services Health",
      description: "Postgres, R2, Redis & Paystack",
      icon: Server,
    },
    {
      id: "audit" as SuperAdminTab,
      label: "Platform Security & Logs",
      description: "Security events & rate limits",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 select-none font-sans">
      {/* ======================= SIDEBAR NAVIGATION ======================= */}
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-16"
        } transition-all duration-200 flex flex-col shrink-0 bg-white border-r border-slate-200/90 z-20`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 font-mono">
              EM
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-slate-900 truncate">Ease Me Platform</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600">
                  Super Admin
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-orange-50 text-orange-950 font-bold border border-orange-200/80 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon
                  size={16}
                  className={`shrink-0 ${isActive ? "text-orange-600" : "text-slate-500"}`}
                />
                {sidebarOpen && (
                  <div className="flex-1 text-left flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/60">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-[11px] font-medium text-slate-600 truncate">
                  Cluster: Africa-Lagos (Primary)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 truncate">
                  superadmin@easeme.ng
                </span>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Cluster: Online"></span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ======================= MAIN CONTENT AREA ======================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div>
            <h1 className="text-sm font-bold text-slate-900 capitalize">
              {navigationItems.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-[11px] text-slate-500">
              {navigationItems.find((i) => i.id === activeTab)?.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
              Super Admin Shell
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>All Gateways Live</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-5 max-w-7xl w-full mx-auto space-y-6">
          {/* ======================= TAB: OVERVIEW ======================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* High-Density 4-Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <span>Platform SaaS MRR</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 num-mono tabular-nums tracking-tight">
                    ₦{totalMRR.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                    <TrendingUp size={13} />
                    <span>+18.4% vs last month</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <span>Active Workspaces</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 num-mono tabular-nums tracking-tight">
                    {activeTenantsCount} <span className="text-sm font-medium text-slate-500">/ {tenants.length}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">98.2% healthy retention</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <span>Total Processed GMV</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 num-mono tabular-nums tracking-tight">
                    ₦{(totalVolume / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Across all retail POS counters</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <span>Infrastructure Uptime</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span className="text-base font-bold text-slate-900">99.98% Available</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">Neon PG: 12ms · R2: 45ms</p>
                </div>
              </div>

              {/* Revenue & Tier Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Subscription Tier Breakdown</h3>
                    <span className="text-xs font-medium text-slate-500">Monthly recurring breakdown</span>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      { tier: "Growth (₦28,000/mo)", count: 2, mrr: 56000, pct: 45, color: "bg-orange-600" },
                      { tier: "Business (₦38,000/mo)", count: 1, mrr: 38000, pct: 30, color: "bg-blue-600" },
                      { tier: "Enterprise (₦58,000/mo)", count: 1, mrr: 58000, pct: 25, color: "bg-purple-600" },
                      { tier: "Starter (Freemium)", count: 1, mrr: 0, pct: 0, color: "bg-slate-300" },
                    ].map((row) => (
                      <div key={row.tier} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-800">{row.tier}</span>
                          <span className="num-mono tabular-nums text-slate-900 font-bold">
                            {row.count} store{row.count > 1 ? "s" : ""} · ₦{row.mrr.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-sm bg-slate-100 overflow-hidden">
                          <div className={`h-full ${row.color}`} style={{ width: `${Math.max(row.pct, 4)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Live Telemetry Summary</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600">Active Tenant Sessions</span>
                      <span className="font-bold text-slate-900 font-mono">14 live tokens</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600">Paystack Webhooks 24h</span>
                      <span className="font-bold text-slate-900 font-mono">48 processed (100%)</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600">R2 Storage Volume</span>
                      <span className="font-bold text-slate-900 font-mono">1.24 GB cached</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600">Daily Backup Snapshot</span>
                      <span className="font-bold text-emerald-700 font-mono">Verified 04:00 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: TENANT WORKSPACES ======================= */}
          {activeTab === "tenants" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Registered Business Workspaces</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search stores, override subscription plans, inspect databases, and enforce suspension.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search store or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-medium"
                    />
                  </div>

                  <select
                    value={selectedPlanFilter}
                    onChange={(e) => setSelectedPlanFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  >
                    <option value="all">All Plans</option>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Workspace Store</th>
                      <th className="py-3 px-4">Owner / Contact</th>
                      <th className="py-3 px-4">Active Plan</th>
                      <th className="py-3 px-4 text-right">MRR</th>
                      <th className="py-3 px-4 text-right">Processed GMV</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 text-xs">{t.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{t.type} · ID: {t.id}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {t.ownerEmail}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={t.plan}
                            onChange={(e) => handleUpgradePlan(t.id, e.target.value as any)}
                            className="bg-white border border-slate-300 text-slate-800 rounded-md px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="Starter">Starter (₦0)</option>
                            <option value="Growth">Growth (₦28k)</option>
                            <option value="Business">Business (₦38k)</option>
                            <option value="Enterprise">Enterprise (₦58k)</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 num-mono tabular-nums">
                          ₦{t.mrr.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700 num-mono tabular-nums">
                          ₦{t.totalSales.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                              t.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${t.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onSwitchToTenant && (
                              <button
                                onClick={() => onSwitchToTenant(t.name)}
                                className="px-2 py-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-[11px] border border-orange-200 transition-colors flex items-center gap-1"
                                title="Inspect store workspace as Admin"
                              >
                                <span>Inspect</span>
                                <ExternalLink size={11} />
                              </button>
                            )}
                            <button
                              onClick={() => toggleTenantStatus(t.id)}
                              className={`p-1 rounded-md border transition-colors ${
                                t.status === "active"
                                  ? "bg-white text-slate-500 hover:text-rose-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50"
                                  : "bg-white text-slate-500 hover:text-emerald-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                              }`}
                              title={t.status === "active" ? "Emergency Suspend Workspace" : "Reactivate Workspace"}
                            >
                              {t.status === "active" ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB: INFRASTRUCTURE ======================= */}
          {activeTab === "infrastructure" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900">Cloud Infrastructure Telemetry</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time health monitoring of database pools, encrypted object storage, and payment webhooks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">Neon Serverless PostgreSQL</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Connection Pool Latency:</span>
                      <span className="font-bold text-slate-900 font-mono">12ms (Target: &lt;50ms)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Active Tenant Schemas:</span>
                      <span className="font-bold text-slate-900 font-mono">Multi-Tenant RLS Enabled</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Compute Autoscaling:</span>
                      <span className="font-bold text-emerald-700 font-mono">0.25 - 2.0 vCPU Dynamic</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} className="text-orange-600" />
                      <h3 className="text-sm font-bold text-slate-900">Cloudflare R2 Object Storage</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Receipt Attachment Bucket:</span>
                      <span className="font-bold text-slate-900 font-mono">ease-me-receipts-prod</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Egress Fees Incurred:</span>
                      <span className="font-bold text-emerald-700 font-mono">$0.00 (Zero Egress Model)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Encryption Standard:</span>
                      <span className="font-bold text-slate-900 font-mono">AES-256 Server-Side</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">Paystack Webhooks Engine</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Webhook Signature Verification:</span>
                      <span className="font-bold text-slate-900 font-mono">HMAC-SHA512 Enforced</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Subscription Auto-Renewal:</span>
                      <span className="font-bold text-slate-900 font-mono">Active (Monthly / Yearly)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Settlement Currency:</span>
                      <span className="font-bold text-slate-900 font-mono">NGN (Nigerian Naira)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-amber-600" />
                      <h3 className="text-sm font-bold text-slate-900">Upstash Redis Token Bucket</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Brute Force / DDoS Shield:</span>
                      <span className="font-bold text-slate-900 font-mono">Active (10 req/10s per IP)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Session Cache Replication:</span>
                      <span className="font-bold text-slate-900 font-mono">&lt;2ms In-Memory</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Memory Pressure:</span>
                      <span className="font-bold text-emerald-700 font-mono">4.2% Utilization</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: AUDIT & SECURITY ======================= */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900">Platform Security & Audit Log</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable audit records of tenant state changes, impersonation events, and administrative actions.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Recent Security Activity</span>
                  <span className="text-xs text-slate-400 font-mono">Showing last 4 verified events</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <p className="font-bold text-slate-900">Paystack Webhook Verified & Processed</p>
                      </div>
                      <p className="text-slate-500 text-[11px] font-mono pl-3.5">
                        HMAC-SHA512 Signature confirmed · Transaction: ₦28,000 for "Alpha Health"
                      </p>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">2 mins ago</span>
                  </div>

                  <div className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <p className="font-bold text-slate-900">New Store Workspace Provisioned</p>
                      </div>
                      <p className="text-slate-500 text-[11px] font-mono pl-3.5">
                        Tenant "Grace Mini Mart Yaba" provisioned on Starter tier
                      </p>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">14 mins ago</span>
                  </div>

                  <div className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <p className="font-bold text-slate-900">R2 Receipt Attachment Uploaded</p>
                      </div>
                      <p className="text-slate-500 text-[11px] font-mono pl-3.5">
                        Expense slip upload encrypted (zero egress fee policy verified)
                      </p>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">1 hr ago</span>
                  </div>

                  <div className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        <p className="font-bold text-slate-900">Super Admin Impersonation Session</p>
                      </div>
                      <p className="text-slate-500 text-[11px] font-mono pl-3.5">
                        Super Admin authorized read-only store inspection for diagnostic testing
                      </p>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">2 hrs ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
