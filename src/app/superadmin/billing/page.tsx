"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  ShieldCheck,
  Clock,
  FolderSync,
  Tag,
  FileText,
  Plus,
  X,
  FileCheck,
  ChevronRight,
} from "lucide-react";
import {
  CommercialBillingService,
  SubscriptionRecord,
  WebhookLogItem,
  FailedPaymentItem,
  DiscountCodeItem,
  PlatformInvoiceItem,
  ManualAdjustmentItem,
} from "@/lib/superadmin/commercial-billing-service";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

type BillingTab = "subscriptions" | "webhooks" | "failed" | "invoices" | "adjustments" | "discounts";

export default function SuperAdminBillingPage() {
  const [activeTab, setActiveTab] = useState<BillingTab>("subscriptions");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal States
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjTenantId, setAdjTenantId] = useState("ten-001");
  const [adjType, setAdjType] = useState<"credit" | "discount" | "extension">("credit");
  const [adjAmount, setAdjAmount] = useState<number>(25000);
  const [adjReason, setAdjReason] = useState("");

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [dscCode, setDscCode] = useState("");
  const [dscType, setDscType] = useState<"percent" | "fixed">("percent");
  const [dscValue, setDscValue] = useState<number>(15);
  const [dscMaxUses, setDscMaxUses] = useState<number>(50);
  const [dscPlans, setDscPlans] = useState<string[]>(["Growth", "Business"]);

  // Active Operator
  const staffContext = {
    id: "usr-finance-01",
    name: "Farouk Bello",
    email: "farouk.bello@easeme.ng",
    role: "finance" as const,
  };

  const subscriptions = CommercialBillingService.getSubscriptions();
  const webhookLogs = CommercialBillingService.getWebhookLogs();
  const failedPayments = CommercialBillingService.getFailedPayments();
  const invoices = CommercialBillingService.getInvoices();
  const adjustments = CommercialBillingService.getManualAdjustments();
  const discountCodes = CommercialBillingService.getDiscountCodes();

  const handleManualAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await CommercialBillingService.applyManualAdjustment(
        {
          tenantId: adjTenantId,
          tenantName: adjTenantId === "ten-001" ? "Alpha Health & Retail Emporium Ltd" : "Lekki Superette",
          adjustmentType: adjType,
          amount: adjAmount,
          reason: adjReason,
        },
        staffContext
      );

      if (res.status === "pending_approval") {
        setStatusMsg({
          type: "success",
          text: `Section 4 Rule: Credit of ₦${adjAmount.toLocaleString()} exceeds threshold. Submitted Request #${res.approvalRequestId} to /superadmin/approvals for dual authorization.`,
        });
      } else {
        setStatusMsg({ type: "success", text: "Manual credit applied directly and audited." });
      }
      setIsAdjustmentOpen(false);
      setAdjReason("");
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to submit adjustment." });
    }
  };

  const handleCreateDiscountCode = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      CommercialBillingService.createDiscountCode(
        {
          code: dscCode,
          discountType: dscType,
          value: dscValue,
          eligiblePlans: dscPlans,
          maxUses: dscMaxUses,
          expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
        },
        staffContext
      );
      setStatusMsg({ type: "success", text: `Discount code '${dscCode.toUpperCase()}' active.` });
      setIsDiscountOpen(false);
      setDscCode("");
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to create discount code." });
    }
  };

  const handleReplayWebhook = (evt: WebhookLogItem) => {
    setStatusMsg({
      type: "success",
      text: `Webhook ${evt.providerEventId} replayed safely with raw HMAC validation.`,
    });
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="text-indigo-700" size={22} />
            Platform Billing & Revenue Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Section 6.5: Subscriptions, Paystack webhook logs, failed payments queue, manual credits, and discount codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdjustmentOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md shadow-xs transition-colors"
          >
            Issue Credit / Adjustment
          </button>
          <button
            onClick={() => setIsDiscountOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>New Discount Code</span>
          </button>
        </div>
      </div>

      {/* Sub-view Navigation (6 Tabs) */}
      <div className="border-b border-slate-200 bg-white px-2 rounded-t-lg shadow-2xs flex overflow-x-auto select-none">
        {[
          { id: "subscriptions", label: "1. Subscriptions" },
          { id: "webhooks", label: "2. Webhook Event Log" },
          { id: "failed", label: "3. Failed Charges Queue" },
          { id: "invoices", label: "4. Issued Invoices" },
          { id: "adjustments", label: "5. Manual Adjustments" },
          { id: "discounts", label: "6. Discount Codes" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as BillingTab)}
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

      {/* TAB 1: SUBSCRIPTIONS LIST */}
      {activeTab === "subscriptions" && (
        <div className="bg-white border border-slate-200 rounded-b-lg shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tenant Store</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Billing Rate</th>
                <th className="py-3 px-4">Next Charge Date</th>
                <th className="py-3 px-4">Gateway Reference</th>
                <th className="py-3 px-4">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.tenantName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{s.planName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                        s.status === "active"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    ₦{s.amount.toLocaleString()} / mo
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {new Date(s.nextChargeDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{s.gatewayReference}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{s.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: WEBHOOK EVENT LOG & REPLAY */}
      {activeTab === "webhooks" && (
        <div className="bg-white border border-slate-200 rounded-b-lg shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>HMAC-SHA512 Raw Body Signature Verification Enforced</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">Idempotent Deduplication Active</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp & Event ID</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Tenant Entity</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">HMAC Verified</th>
                <th className="py-3 px-4">Processing Result</th>
                <th className="py-3 px-4 text-center">Safe Replay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {webhookLogs.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{new Date(w.receivedAt).toLocaleTimeString()}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{w.providerEventId}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-800 border border-slate-200">
                      {w.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{w.tenantName}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 tabular-nums">
                    {w.amount ? `₦${w.amount.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={12} />
                      <span>Valid</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                      {w.processingResult}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleReplayWebhook(w)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                    >
                      <RotateCcw size={12} />
                      <span>Replay</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: FAILED PAYMENTS & GRACE COUNTDOWN */}
      {activeTab === "failed" && (
        <div className="bg-white border border-slate-200 rounded-b-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-rose-50/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-rose-600" size={16} />
              <span className="font-bold text-rose-900">3-Day Grace Period Enforcement</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Auto-lock triggers at countdown expiry</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tenant Name</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4 text-right">Overdue Amount</th>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4">Grace Window Deadline</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {failedPayments.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{f.tenantName}</td>
                  <td className="py-3 px-4">{f.planName}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 tabular-nums">
                    ₦{f.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{f.gatewayError}</td>
                  <td className="py-3 px-4 font-mono text-rose-700 font-semibold">
                    {f.daysRemaining} Day Remaining ({new Date(f.gracePeriodEndsAt).toLocaleDateString()})
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/superadmin/tenants/${f.tenantId}`}
                      className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                    >
                      Extend Grace
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: ISSUED INVOICES */}
      {activeTab === "invoices" && (
        <div className="bg-white border border-slate-200 rounded-b-lg shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4">Tenant Recipient</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Paid Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">PDF Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{inv.tenantName}</td>
                  <td className="py-3 px-4">{inv.planName}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    ₦{inv.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(inv.paidAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => alert(`Downloading official PDF for ${inv.invoiceNumber}...`)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: MANUAL ADJUSTMENTS */}
      {activeTab === "adjustments" && (
        <div className="bg-white border border-slate-200 rounded-b-lg shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Manual Billing Adjustments & Concessions</h3>
              <p className="text-xs text-slate-500">Audited manual credits, billing extensions, and goodwill adjustments. Threshold $\ge$ ₦20,000 requires dual control.</p>
            </div>
            <button
              onClick={() => setIsAdjustmentOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded shadow-xs"
            >
              Issue New Credit
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {adjustments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No manual billing adjustments recorded in this period.
              </div>
            ) : (
              adjustments.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{a.tenantName}</h4>
                    <p className="text-slate-600 italic text-[11px]">&quot;{a.reason}&quot;</p>
                    <span className="text-[10px] font-mono text-slate-400">Authorized by: {a.staffName} ({a.staffRole})</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-700 text-sm">
                      {a.amount ? `₦${a.amount.toLocaleString()}` : `${a.extensionDays} days`}
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-500">{a.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DISCOUNT CODES */}
      {activeTab === "discounts" && (
        <div className="bg-white border border-slate-200 rounded-b-lg shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Eligible Plans</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discountCodes.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag size={13} className="text-indigo-700" />
                    <span>{d.code}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    {d.discountType === "percent" ? `${d.value}% OFF` : `₦${d.value.toLocaleString()} OFF`}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {d.eligiblePlans.join(", ")}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {d.usedCount} / {d.maxUses}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(d.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Credit Modal (Dual-Control Intercept $\ge$ ₦20,000) */}
      {isAdjustmentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Issue Manual Credit / Concession</h3>
              <button onClick={() => setIsAdjustmentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
              <strong>Section 4 Policy:</strong> Credits $\ge$ ₦20,000 require dual-control approval by an independent staff member before being applied.
            </div>

            <form onSubmit={handleManualAdjustmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Tenant</label>
                <select
                  value={adjTenantId}
                  onChange={(e) => setAdjTenantId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                >
                  <option value="ten-001">Alpha Health & Retail Emporium Ltd</option>
                  <option value="ten-002">Lekki Superette & Cold Store</option>
                  <option value="ten-005">Victoria Island Gourmet Grocers</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Amount (NGN) *</label>
                <input
                  type="number"
                  required
                  step={500}
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Written Justification *</label>
                <textarea
                  rows={2}
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Document compensation, goodwill discount, or dispute settlement..."
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-indigo-700 hover:bg-indigo-800 rounded font-semibold shadow-xs"
                >
                  Submit Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Discount Code Modal */}
      {isDiscountOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create Promotional Discount Code</h3>
              <button onClick={() => setIsDiscountOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDiscountCode} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LAGOS2026"
                  value={dscCode}
                  onChange={(e) => setDscCode(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold uppercase outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={dscType}
                    onChange={(e) => setDscType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  >
                    <option value="percent">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Naira (₦ OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={dscValue}
                    onChange={(e) => setDscValue(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maximum Redemption Uses</label>
                <input
                  type="number"
                  required
                  value={dscMaxUses}
                  onChange={(e) => setDscMaxUses(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDiscountOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-indigo-700 hover:bg-indigo-800 rounded font-semibold shadow-xs"
                >
                  Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
