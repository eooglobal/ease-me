"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { ApprovalRecord, ApprovalService, ApprovalType } from "@/lib/approvals/approval-service";

const TYPE_CONFIG: Record<
  ApprovalType,
  { label: string; badgeClass: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  shift_shortage: {
    label: "Shift Shortage",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: ShieldAlert,
  },
  stock_writeoff: {
    label: "Stock Write-off",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: AlertTriangle,
  },
  purchase_intake: {
    label: "PO Delivery Intake",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: FileCheck,
  },
  credit_override: {
    label: "Credit Limit Override",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    icon: ShieldCheck,
  },
};

export default function ManagerApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Approval / Rejection Modal State
  const [activeItem, setActiveItem] = useState<ApprovalRecord | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [managerPin, setManagerPin] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const [approvals, setApprovals] = useState<ApprovalRecord[]>([
    {
      id: "APP-20261106-01",
      type: "shift_shortage",
      title: "Till Shift Shortage Co-Sign",
      requesterName: "Adaeze Okon",
      requesterRole: "Cashier (POS-01)",
      amountOrQuantity: "-₦2,200",
      numericValue: 2200,
      reason: "Customer change rounding error and unrecorded ice block purchase during evening rush.",
      createdAt: "Nov 06, 2026 · 12:45 PM",
      status: "pending",
    },
    {
      id: "APP-20261106-02",
      type: "stock_writeoff",
      title: "Damaged Stock Write-off",
      requesterName: "Emeka Chidi",
      requesterRole: "Inventory Auditor",
      amountOrQuantity: "2 units (₦5,200 loss)",
      numericValue: 5200,
      reason: "Peak Milk 400g Tin dented and leaking on shelf. Health and safety write-off required.",
      createdAt: "Nov 06, 2026 · 11:20 AM",
      status: "pending",
    },
    {
      id: "APP-20261106-03",
      type: "credit_override",
      title: "Credit Headroom Override (Alhaji Musa)",
      requesterName: "John Danladi",
      requesterRole: "Senior Cashier (POS-02)",
      amountOrQuantity: "₦35,000 above headroom",
      numericValue: 35000,
      reason: "Long-standing bulk buyer. Outstanding debt ₦142,000 on ₦250,000 limit. Customer promises bank transfer tonight.",
      createdAt: "Nov 06, 2026 · 10:15 AM",
      status: "pending",
    },
    {
      id: "APP-20261105-01",
      type: "purchase_intake",
      title: "PO Goods Receipt Intake Verification",
      requesterName: "Warehouse Receiving",
      requesterRole: "Store Clerk",
      amountOrQuantity: "450 units (₦850,000)",
      numericValue: 850000,
      reason: "PO-20261105-1082 delivery from Mega Pharmaceuticals Ltd. 100% physically inspected.",
      createdAt: "Nov 05, 2026 · 04:30 PM",
      status: "approved",
      reviewedBy: "Chidinma Eze (Store Manager)",
      reviewedAt: "Nov 05, 2026 · 04:45 PM",
    },
  ]);

  const filteredApprovals = approvals.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  const handleOpenAction = (item: ApprovalRecord, action: "approve" | "reject") => {
    setActiveItem(item);
    setActionType(action);
    setManagerPin("");
    setRejectionReason("");
    setModalError(null);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !actionType) return;

    if (managerPin !== "1234") {
      setModalError("Invalid Manager PIN. Enter '1234' for authorization.");
      return;
    }

    const res = ApprovalService.resolveApproval(
      activeItem,
      actionType,
      "Chidinma Eze (Store Manager)",
      actionType === "reject" ? rejectionReason : undefined
    );

    if (res.error) {
      setModalError(res.error);
      return;
    }

    setApprovals(approvals.map((a) => (a.id === activeItem.id ? res.updatedItem : a)));
    setActiveItem(null);
    setActionType(null);
  };

  return (
    <AppShell role="manager">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manager Approvals Queue</h1>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-mono">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and authorize till shortages, stock write-offs, credit overrides, and purchase receipts.
            </p>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === "pending"
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === "approved"
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter("rejected")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === "rejected"
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === "all"
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All ({approvals.length})
              </button>
            </div>

            {/* Search and Type Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search approvals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-1 focus:ring-indigo-700 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="shift_shortage">Shift Shortage</option>
                <option value="stock_writeoff">Stock Write-off</option>
                <option value="credit_override">Credit Override</option>
                <option value="purchase_intake">PO Intake</option>
              </select>
            </div>
          </div>

          {/* Approvals List */}
          <div className="space-y-3">
            {filteredApprovals.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500 shadow-xs">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600 mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-800">No Approvals Pending</p>
                <p className="text-xs text-slate-500 mt-1">
                  All requests have been reviewed and authorized. Good job!
                </p>
              </div>
            ) : (
              filteredApprovals.map((item) => {
                const cfg = TYPE_CONFIG[item.type];
                const Icon = cfg.icon;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left Details */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${cfg.badgeClass}`}
                          >
                            <Icon size={12} />
                            <span>{cfg.label}</span>
                          </span>

                          <span className="text-[11px] font-mono text-slate-400">{item.id}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock size={11} />
                            {item.createdAt}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Requested by{" "}
                            <span className="font-semibold text-slate-800">{item.requesterName}</span>{" "}
                            ({item.requesterRole})
                          </p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-md border border-slate-200/80 text-xs">
                          <p className="text-slate-700 leading-relaxed font-normal">
                            <span className="font-semibold text-slate-900">Submitted Reason: </span>
                            {item.reason}
                          </p>
                        </div>

                        {item.status !== "pending" && (
                          <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                            <span>
                              {item.status === "approved" ? "Authorized by: " : "Rejected by: "}
                              <strong className="text-slate-800">{item.reviewedBy}</strong>
                            </span>
                            {item.rejectionReason && (
                              <span className="text-rose-600 italic">
                                ({item.rejectionReason})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Amount & Actions */}
                      <div className="sm:text-right shrink-0 flex flex-col justify-between items-start sm:items-end gap-3">
                        <div>
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Impact</span>
                          <span className="text-base font-bold font-mono tabular-nums text-slate-900 block mt-0.5">
                            {item.amountOrQuantity}
                          </span>
                        </div>

                        {item.status === "pending" ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleOpenAction(item, "reject")}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleOpenAction(item, "approve")}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <ShieldCheck size={14} />
                              <span>Authorize</span>
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md border uppercase tracking-wide ${
                              item.status === "approved"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* PIN Authorization & Rejection Modal */}
        {activeItem && actionType && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <KeyRound size={18} className="text-indigo-700" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {actionType === "approve" ? "Manager Authorization" : "Reject Request"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveItem(null);
                    setActionType(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmAction} className="p-5 space-y-4 text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{activeItem.title}</p>
                  <p className="text-slate-500 mt-0.5">{activeItem.amountOrQuantity}</p>
                </div>

                {actionType === "reject" && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">Rejection Reason *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Explain why this request is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">Manager Security PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="Enter 4-digit PIN (default: 1234)"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono tracking-widest text-center text-sm focus:ring-1 focus:ring-indigo-700 outline-none"
                  />
                </div>

                {modalError && (
                  <p className="text-rose-600 font-semibold">{modalError}</p>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItem(null);
                      setActionType(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-1.5 text-xs font-bold text-white rounded-md shadow-xs transition-colors ${
                      actionType === "approve"
                        ? "bg-indigo-700 hover:bg-indigo-800"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {actionType === "approve" ? "Sign & Authorize" : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

