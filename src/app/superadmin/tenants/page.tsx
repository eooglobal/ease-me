"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Filter,
  Download,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Mail,
  Copy,
} from "lucide-react";
import { TenantService, TenantSummary } from "@/lib/superadmin/tenant-service";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

export default function SuperAdminTenantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bizTypeFilter, setBizTypeFilter] = useState("all");

  // Provisioning Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("Community Pharmacy");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [planName, setPlanName] = useState<"Starter" | "Growth" | "Business" | "Enterprise">("Growth");
  const [preset, setPreset] = useState<"Supermarket" | "Pharmacy" | "Wholesaler" | "Retail" | "Restaurant">("Pharmacy");
  const [trialDays, setTrialDays] = useState(14);
  const [provisionSuccess, setProvisionSuccess] = useState<{ token: string; email: string } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tenants = TenantService.listTenants({
    search: searchTerm,
    status: statusFilter,
    plan: planFilter,
    businessType: bizTypeFilter,
  });

  const handleExportCSV = () => {
    const headers = [
      "Tenant ID",
      "Business Name",
      "Business Type",
      "Plan",
      "Status",
      "Masked Owner Email",
      "Masked Phone",
      "Users",
      "Products Count",
      "Last Activity",
      "Renewal Date",
      "MRR (NGN)",
    ];

    const rows = tenants.map((t) => [
      t.id,
      t.businessName,
      t.businessType,
      t.planName,
      t.status,
      t.maskedEmail,
      t.maskedPhone,
      t.userCount,
      t.productCount,
      t.lastActivity,
      t.renewalDate.slice(0, 10),
      t.mrr,
    ]);

    downloadCSV(
      `Ease_Me_Tenants_${new Date().toISOString().slice(0, 10)}.csv`,
      buildCSV(headers, rows)
    );
    setToastMessage("Tenants directory exported to RFC 4180 CSV with masked personal data.");
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await TenantService.provisionTenant(
        {
          businessName: bizName,
          businessType: bizType,
          ownerName,
          ownerEmail,
          ownerPhone,
          planName,
          preset,
          trialDays,
        },
        {
          id: "usr-admin-01",
          name: "Chidinma Okafor",
          email: "chidinma.okafor@easeme.ng",
          role: "owner",
        }
      );

      setProvisionSuccess({
        token: result.invitationToken,
        email: result.tenant.maskedEmail,
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || "Failed to provision workspace.");
    }
  };

  const resetProvisionForm = () => {
    setBizName("");
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPhone("");
    setProvisionSuccess(null);
    setIsProvisionOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="text-indigo-700" size={22} />
            Tenant Workspaces Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Section 6.3 Operator Console: Search, provision, and monitor tenant workspaces with strict privacy shielding.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsProvisionOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Provision Workspace</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenant name, ID or masked email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Paying)</option>
              <option value="trial">Trial</option>
              <option value="grace">Grace Period</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-700"
            >
              <option value="all">All Plans</option>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Business">Business</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Table (Section 6.3 Columns) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Business Name & ID</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Owner Contact (Masked)</th>
                <th className="py-3 px-4 text-right">Users</th>
                <th className="py-3 px-4 text-right">Products</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4">Renewal Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No matching tenants found.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3 px-4">
                      <Link
                        href={`/superadmin/tenants/${t.id}`}
                        className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5"
                      >
                        <span>{t.businessName}</span>
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {t.id} • {t.businessType}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {t.planName}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          t.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : t.status === "trial"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : t.status === "grace"
                            ? "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
                            : "bg-slate-100 text-slate-800 border-slate-300"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700">{t.maskedEmail}</div>
                      <div className="text-[11px] font-mono text-slate-400">{t.maskedPhone}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      {t.userCount}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      {t.productCount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {t.lastActivity}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(t.renewalDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/superadmin/tenants/${t.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
                      >
                        <span>Manage</span>
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Workspace Modal (Section 6.3) */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-indigo-700" />
                <h3 className="text-sm font-bold text-slate-900">Provision Tenant Workspace</h3>
              </div>
              <button onClick={resetProvisionForm} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            {provisionSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>Workspace Provisioned Successfully</span>
                  </div>
                  <p>
                    An invitation was created for owner <strong>{provisionSuccess.email}</strong>. Per Section 6.3, no tenant is ever created with a default password.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Secure Invitation Link</span>
                  <div className="flex items-center justify-between font-mono bg-white p-2 rounded border border-slate-200 text-indigo-700 text-[11px]">
                    <span className="truncate">https://easeme.ng/onboarding?token={provisionSuccess.token}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://easeme.ng/onboarding?token=${provisionSuccess.token}`);
                        alert("Copied invitation link to clipboard.");
                      }}
                      className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-500"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={resetProvisionForm}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
                {/* Security Notice */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-md text-indigo-950 flex items-start gap-2">
                  <ShieldCheck size={16} className="text-indigo-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Zero Default Password Policy:</strong> The owner will be sent an invitation token to set their own secure password. The platform console never stores or transmits default credentials.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Business Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Pharmacy Ltd"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Business Classification</label>
                    <select
                      value={bizType}
                      onChange={(e) => setBizType(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-700 outline-none"
                    >
                      <option value="Community Pharmacy">Community Pharmacy</option>
                      <option value="Supermarket">Supermarket</option>
                      <option value="Wholesale & FMCG">Wholesale & FMCG</option>
                      <option value="Retail & Boutique">Retail & Boutique</option>
                      <option value="Restaurant & Cafe">Restaurant & Cafe</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Chukwuma Obi"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Owner Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="owner@store.ng"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-700 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Owner Phone</label>
                    <input
                      type="tel"
                      placeholder="0803 123 4567"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-700 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Initial Plan</label>
                    <select
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-700 outline-none"
                    >
                      <option value="Starter">Starter (₦15k/mo)</option>
                      <option value="Growth">Growth (₦28k/mo)</option>
                      <option value="Business">Business (₦45k/mo)</option>
                      <option value="Enterprise">Enterprise (₦85k/mo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Starting Preset (Section 6.7)</label>
                    <select
                      value={preset}
                      onChange={(e) => setPreset(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-700 outline-none"
                    >
                      <option value="Pharmacy">Pharmacy (Batch & Expiry on)</option>
                      <option value="Supermarket">Supermarket (High speed POS)</option>
                      <option value="Wholesaler">Wholesaler (Tiered pricing)</option>
                      <option value="Retail">Retail</option>
                      <option value="Restaurant">Restaurant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Trial Length</label>
                    <select
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-700 outline-none"
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days (Standard)</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetProvisionForm}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded border border-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-indigo-700 hover:bg-indigo-800 rounded shadow-xs font-semibold transition-colors"
                  >
                    Send Owner Invitation & Provision
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
