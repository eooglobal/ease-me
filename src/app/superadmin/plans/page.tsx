"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  CreditCard,
  Users,
  Boxes,
  Building2,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCheck,
  Sliders,
  X,
  Edit2,
} from "lucide-react";
import {
  CommercialBillingService,
  CommercialPlan,
} from "@/lib/superadmin/commercial-billing-service";

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<CommercialPlan[]>(CommercialBillingService.getPlans());
  const [editingPlan, setEditingPlan] = useState<CommercialPlan | null>(null);
  const [newMonthly, setNewMonthly] = useState<number>(0);
  const [newAnnual, setNewAnnual] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active operator simulation
  const staffContext = {
    id: "usr-finance-01",
    name: "Farouk Bello",
    email: "farouk.bello@easeme.ng",
    role: "finance" as const,
  };

  const handleOpenEdit = (plan: CommercialPlan) => {
    setEditingPlan(plan);
    setNewMonthly(plan.monthlyPrice);
    setNewAnnual(plan.annualPrice);
    setStatusMsg(null);
  };

  const handleSubmitPriceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setIsSubmitting(true);
    try {
      const res = await CommercialBillingService.updatePlanPrice(
        editingPlan.id,
        newMonthly,
        newAnnual,
        staffContext
      );

      setStatusMsg({
        type: "success",
        text: `Section 4 Dual Control: Price revision for ${editingPlan.name} Tier submitted as Request #${res.approvalRequestId} to /superadmin/approvals. Existing ${editingPlan.activeSubscriberCount} tenants stay grandfathered until migration.`,
      });
      setEditingPlan(null);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to submit price revision." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-md text-xs border flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold text-xs ml-2">×</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="text-indigo-700" size={22} />
            Subscription Plans & Quotas Architecture
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Section 6.4: Standard commercial tiers, server-side entitlement limits, and feature switches. Price revisions require dual control.
          </p>
        </div>

        <Link
          href="/superadmin/approvals"
          className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
        >
          <FileCheck size={14} className="text-amber-600" />
          <span>Pending Approvals</span>
        </Link>
      </div>

      {/* Plans Grid (4 Canonical Tiers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border border-slate-200 rounded-lg shadow-xs p-5 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors"
          >
            {/* Tier Header & Pricing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{plan.name} Tier</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {plan.activeSubscriberCount} Active Tenants
                </span>
              </div>

              <div>
                <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  ₦{plan.monthlyPrice.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-500">/ mo</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  ₦{plan.annualPrice.toLocaleString()} / year (save 2 months)
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold block mt-1">
                  {plan.trialDays}-day free trial included
                </span>
              </div>

              {/* Hard Quota Limits (Section 6.4) */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Hard Resource Quotas
                </span>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users size={13} />
                    <span>User Accounts</span>
                  </span>
                  <span className="font-mono font-bold">{plan.limits.maxUsers} seats</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Boxes size={13} />
                    <span>Catalog Products</span>
                  </span>
                  <span className="font-mono font-bold">{plan.limits.maxProducts.toLocaleString()} items</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Building2 size={13} />
                    <span>Store Branches</span>
                  </span>
                  <span className="font-mono font-bold">{plan.limits.maxBranches} location</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <HardDrive size={13} />
                    <span>Cloud Storage</span>
                  </span>
                  <span className="font-mono font-bold">{plan.limits.storageMb} MB</span>
                </div>
              </div>

              {/* Feature Switches (Section 6.4) */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Feature Switches
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Batch & Expiry Tracking</span>
                  {plan.features.batchTracking ? (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  ) : (
                    <XCircle size={14} className="text-slate-300" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Customer Debt Portal</span>
                  {plan.features.customerPortal ? (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  ) : (
                    <XCircle size={14} className="text-slate-300" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Advanced P&L Reports</span>
                  {plan.features.advancedReports ? (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  ) : (
                    <XCircle size={14} className="text-slate-300" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Offline Resilience</span>
                  {plan.features.offlineMode ? (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  ) : (
                    <XCircle size={14} className="text-slate-300" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">RFC 4180 Data Export</span>
                  {plan.features.dataExport ? (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  ) : (
                    <XCircle size={14} className="text-slate-300" />
                  )}
                </div>
              </div>
            </div>

            {/* Price Edit Action (Dual Control Trigger) */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(plan)}
                className="w-full py-1.5 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 size={13} />
                <span>Revise Plan Pricing</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Price Revision Modal (Section 4 Dual-Control Rule) */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Revise Pricing: {editingPlan.name} Tier
                </h3>
              </div>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            {/* Section 4 Sensitive Action Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <FileCheck size={15} />
                <span>Section 4 Dual-Control Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Changing a plan price affects <strong>{editingPlan.activeSubscriberCount} existing tenant(s)</strong>.
                Per policy, this will generate an approval request in the queue. Existing tenants stay on their current price until migrated.
              </p>
            </div>

            <form onSubmit={handleSubmitPriceChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Monthly Price (NGN) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={500}
                  value={newMonthly}
                  onChange={(e) => setNewMonthly(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Annual Price (NGN) *</label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={1000}
                  value={newAnnual}
                  onChange={(e) => setNewAnnual(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-700"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-white bg-indigo-700 hover:bg-indigo-800 rounded font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <FileCheck size={14} />
                  <span>Submit for Dual Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
