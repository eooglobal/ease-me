"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  ShieldAlert,
  CreditCard,
  Users,
  Boxes,
  HardDrive,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  Send,
  Sliders,
  Calendar,
  Layers,
  ChevronRight,
  Database,
  Trash2,
  FileCheck,
} from "lucide-react";
import { TenantService } from "@/lib/superadmin/tenant-service";

type DetailTab = "summary" | "usage" | "subscription" | "entitlements" | "notes" | "activity" | "danger";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = (params.id as string) || "ten-001";

  const [activeTab, setActiveTab] = useState<DetailTab>("summary");
  const [data, setData] = useState<ReturnType<typeof TenantService.getTenantById> | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [graceDays, setGraceDays] = useState(7);
  const [graceReason, setGraceReason] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Danger Zone confirmation
  const [typedBizName, setTypedBizName] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active platform operator simulation
  const staffContext = {
    id: "usr-admin-01",
    name: "Chidinma Okafor",
    email: "chidinma.okafor@easeme.ng",
    role: "owner" as const,
  };

  const loadData = () => {
    try {
      const res = TenantService.getTenantById(tenantId);
      setData(res);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  if (!data) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 space-y-2">
        <p>Loading tenant workspace details...</p>
        <Link href="/superadmin/tenants" className="text-indigo-700 underline font-semibold">
          Return to directory
        </Link>
      </div>
    );
  }

  const { tenant, notes, activities, overrides, planLimits } = data;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      await TenantService.addNote(tenant.id, newNoteText, staffContext);
      setNewNoteText("");
      setStatusMsg({ type: "success", text: "Internal staff note recorded in audit log." });
      loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to add note." });
    }
  };

  const handleExtendGrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!graceReason.trim()) {
      setStatusMsg({ type: "error", text: "A written justification is mandatory to extend grace period." });
      return;
    }

    try {
      await TenantService.extendGracePeriod(tenant.id, graceDays, graceReason, staffContext);
      setGraceReason("");
      setStatusMsg({ type: "success", text: `Grace period extended by ${graceDays} days.` });
      loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to extend grace period." });
    }
  };

  const handleSuspend = async () => {
    if (typedBizName !== tenant.businessName) {
      setStatusMsg({ type: "error", text: "Please type the exact business name to confirm action." });
      return;
    }
    if (!suspendReason.trim()) {
      setStatusMsg({ type: "error", text: "A detailed written reason is required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await TenantService.suspendTenant(tenant.id, suspendReason, staffContext);
      if (res.status === "pending_approval") {
        setStatusMsg({
          type: "success",
          text: `Section 4 Dual-Control: Suspending a paying tenant requires approval. Request #${res.approvalRequestId} was submitted to /superadmin/approvals.`,
        });
      } else {
        setStatusMsg({ type: "success", text: "Tenant has been suspended." });
      }
      setTypedBizName("");
      setSuspendReason("");
      loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Suspension failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Return & Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/superadmin/tenants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Tenants</span>
        </Link>

        <span className="text-xs font-mono text-slate-400">ID: {tenant.id}</span>
      </div>

      {/* Tenant Identity Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
            {tenant.businessName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{tenant.businessName}</h1>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                  tenant.status === "active"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : tenant.status === "trial"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : tenant.status === "grace"
                    ? "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
                    : "bg-slate-100 text-slate-800 border-slate-300"
                }`}
              >
                {tenant.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {tenant.businessType} • Plan: <strong className="text-slate-800">{tenant.planName}</strong> • Masked Contact: {tenant.maskedEmail} ({tenant.maskedPhone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
            ₦{tenant.mrr.toLocaleString()} / mo
          </span>
        </div>
      </div>

      {/* Status Msg */}
      {statusMsg && (
        <div
          className={`p-3 rounded-md text-xs border flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold text-xs">×</button>
        </div>
      )}

      {/* Tabs Navigation (Section 6.3: 7 Tabs) */}
      <div className="border-b border-slate-200 bg-white px-2 rounded-t-lg shadow-2xs flex overflow-x-auto select-none">
        {[
          { id: "summary", label: "1. Summary" },
          { id: "usage", label: "2. Usage Telemetry" },
          { id: "subscription", label: "3. Subscription" },
          { id: "entitlements", label: "4. Entitlements" },
          { id: "notes", label: "5. Internal Notes" },
          { id: "activity", label: "6. Security Activity" },
          { id: "danger", label: "7. Danger Zone" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DetailTab)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-indigo-700 text-indigo-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === "summary" && (
        <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Business Profile
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Legal Entity Name</span>
                  <span className="font-semibold text-slate-900">{tenant.businessName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Business Classification</span>
                  <span className="font-medium text-slate-800">{tenant.businessType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Platform Tenant ID</span>
                  <span className="font-mono text-slate-700">{tenant.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Workspace Created Date</span>
                  <span className="font-mono text-slate-700">{new Date(tenant.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Owner Contact (Privacy Shielded)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Owner Name</span>
                  <span className="font-semibold text-slate-900">{tenant.ownerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Masked Email</span>
                  <span className="font-mono text-slate-700">{tenant.maskedEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Masked Telephone</span>
                  <span className="font-mono text-slate-700">{tenant.maskedPhone}</span>
                </div>
                {tenant.trialEnd && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Trial Expiration</span>
                    <span className="font-mono text-amber-700 font-semibold">{new Date(tenant.trialEnd).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USAGE (AGGREGATE COUNTS ONLY - HARD BOUNDARY) */}
      {activeTab === "usage" && (
        <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resource Consumption vs Plan Limits</h3>
              <p className="text-xs text-slate-500">Section 2 Strict Hard Boundary: Shows aggregate counts only. Never individual product or sales rows.</p>
            </div>
            <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border">
              Plan: {tenant.planName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Users */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">User Accounts</span>
                <Users size={16} className="text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {tenant.userCount}{" "}
                <span className="text-xs font-normal text-slate-500">/ {planLimits.maxUsers} max</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (tenant.userCount / planLimits.maxUsers) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Products */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Catalog Products</span>
                <Boxes size={16} className="text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {tenant.productCount.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-500">/ {planLimits.maxProducts.toLocaleString()} max</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (tenant.productCount / planLimits.maxProducts) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Sales Processed This Month (Count Only) */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Sales Processed (Month)</span>
                <FileCheck size={16} className="text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {tenant.salesThisMonth.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-500">orders</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Aggregate processed volume</p>
            </div>

            {/* Storage */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">R2 Storage Used</span>
                <HardDrive size={16} className="text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {tenant.storageUsedMb.toFixed(1)}{" "}
                <span className="text-xs font-normal text-slate-500">/ {planLimits.maxStorageMb} MB</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (tenant.storageUsedMb / planLimits.maxStorageMb) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION & GRACE EXTENSION */}
      {activeTab === "subscription" && (
        <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Paystack Subscription Details
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tier Name</span>
                  <span className="font-bold text-slate-900">{tenant.planName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Monthly Billing Rate</span>
                  <span className="font-mono font-bold text-emerald-700">₦{tenant.mrr.toLocaleString()} / mo</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Next Scheduled Charge</span>
                  <span className="font-mono text-slate-800">{new Date(tenant.renewalDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-semibold text-slate-800">{tenant.status.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Grace Period Extension Form (Section 6.3) */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-700" />
                <span>Grace Period Extension</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Extend the renewal countdown to prevent service disruption while payment issues are sorted.
              </p>

              <form onSubmit={handleExtendGrace} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Extension Length</label>
                  <select
                    value={graceDays}
                    onChange={(e) => setGraceDays(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs outline-none"
                  >
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days (Recommended)</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Mandatory Written Rationale *</label>
                  <textarea
                    rows={2}
                    required
                    value={graceReason}
                    onChange={(e) => setGraceReason(e.target.value)}
                    placeholder="Document exact reason for grace extension..."
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded shadow-xs text-xs"
                  >
                    Grant Extension & Audit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ENTITLEMENTS */}
      {activeTab === "entitlements" && (
        <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Custom Feature & Limit Overrides</h3>
              <p className="text-xs text-slate-500">Plan limits plus any staff-granted custom quota exemptions with mandatory justification.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {overrides.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active custom overrides. Workspace runs on default {tenant.planName} plan limits.
              </div>
            ) : (
              overrides.map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{o.label}</h4>
                    <p className="text-slate-500 italic text-[11px] mt-0.5">&quot;{o.reason}&quot;</p>
                    <span className="text-[10px] font-mono text-slate-400">Expires: {new Date(o.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-400 text-[11px]">Standard: {String(o.standardValue)}</span>
                    <div className="font-mono font-bold text-indigo-700 text-sm">Active: {String(o.overrideValue)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: INTERNAL STAFF NOTES */}
      {activeTab === "notes" && (
        <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Internal Operational Notes</h3>
            <p className="text-xs text-slate-500">Confidential staff ledger: Notes are strictly internal and never visible to the tenant.</p>
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Record support interaction, compliance check, or operational memo..."
              className="w-full text-xs p-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-700 outline-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded shadow-xs"
              >
                Save Internal Note
              </button>
            </div>
          </form>

          {/* Notes History */}
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {notes.map((n) => (
              <div key={n.id} className="py-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span className="font-semibold text-slate-700">
                    {n.staffName} ({n.staffRole})
                  </span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY ACTIVITY */}
      {activeTab === "activity" && (
        <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Tenant Level Activity Trail</h3>
            <p className="text-xs text-slate-500">Security and lifecycle events. No customer transaction records.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {activities.map((a) => (
              <div key={a.id} className="py-3 flex items-start justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900">{a.event}</span>
                  <p className="text-slate-600">{a.details}</p>
                  <span className="text-[11px] font-mono text-slate-400">By {a.performedBy}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{a.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: DANGER ZONE (DUAL CONTROL SUSPENSION) */}
      {activeTab === "danger" && (
        <div className="bg-white border border-rose-200 rounded-b-lg p-6 shadow-xs space-y-6">
          <div className="border-b border-rose-100 pb-3 flex items-center gap-2">
            <AlertTriangle className="text-rose-600" size={18} />
            <h3 className="text-sm font-bold text-rose-900">Tenant Danger Zone Operations</h3>
          </div>

          <div className="border border-rose-200 rounded-lg p-4 bg-rose-50/40 space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Suspend Tenant Workspace</h4>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Lock all POS cashier terminals and merchant access immediately. Data remains intact; tenant owner retains read-only export capability.
              </p>
              {tenant.status === "active" && (
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] flex items-center gap-1.5 font-medium">
                  <FileCheck size={14} className="text-amber-700 shrink-0" />
                  <span>
                    <strong>Section 4 Dual-Control Rule:</strong> Suspending a paying tenant requires two distinct staff members. This action submits a request to the approvals queue.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Type business legal name &quot;<span className="font-mono text-rose-700 font-bold">{tenant.businessName}</span>&quot; to confirm:
                </label>
                <input
                  type="text"
                  value={typedBizName}
                  onChange={(e) => setTypedBizName(e.target.value)}
                  placeholder={tenant.businessName}
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Suspension Rationale *</label>
                <textarea
                  rows={2}
                  required
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Mandatory justification for audit trail..."
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={typedBizName !== tenant.businessName || isSubmitting}
                  onClick={handleSuspend}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white font-semibold rounded shadow-xs transition-colors"
                >
                  {tenant.status === "active" ? "Submit Suspension for Dual Approval" : "Execute Direct Suspension"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

