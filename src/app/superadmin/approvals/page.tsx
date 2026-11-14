"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
} from "lucide-react";
import {
  PlatformApprovalEngine,
  ApprovalRequestItem,
} from "@/lib/superadmin/approval-engine";
import { PlatformRole, ROLE_DISPLAY_NAMES } from "@/lib/superadmin/permission-matrix";

export default function SuperAdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"waiting_for_me" | "requested_by_me" | "history">("waiting_for_me");
  const [requests, setRequests] = useState<ApprovalRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active operator simulation profile
  const currentOperator = {
    id: "usr-owner-01",
    name: "Chidinma Okafor",
    email: "chidinma.okafor@easeme.ng",
    role: "owner" as PlatformRole,
  };

  const loadRequests = () => {
    PlatformApprovalEngine.seedSampleData();
    const data = PlatformApprovalEngine.listRequests({
      tab: activeTab,
      userEmail: currentOperator.email,
    });
    setRequests(data);
    if (data.length > 0 && !selectedRequest) {
      setSelectedRequest(data[0]);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const handleApprove = async (req: ApprovalRequestItem) => {
    setStatusMsg(null);
    try {
      const result = await PlatformApprovalEngine.evaluateRequest({
        requestId: req.id,
        actorId: currentOperator.id,
        actorName: currentOperator.name,
        actorEmail: currentOperator.email,
        actorRole: currentOperator.role,
        decision: "approve",
      });

      setStatusMsg({
        type: "success",
        text: `Request #${req.id} approved successfully and action automatically executed.`,
      });
      loadRequests();
      setSelectedRequest(result.request);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to approve request." });
    }
  };

  const handleReject = async (req: ApprovalRequestItem) => {
    setStatusMsg(null);
    if (!rejectionComment.trim()) {
      setStatusMsg({ type: "error", text: "A comment explaining the reason for rejection is mandatory." });
      return;
    }

    try {
      const result = await PlatformApprovalEngine.evaluateRequest({
        requestId: req.id,
        actorId: currentOperator.id,
        actorName: currentOperator.name,
        actorEmail: currentOperator.email,
        actorRole: currentOperator.role,
        decision: "reject",
        comment: rejectionComment,
      });

      setStatusMsg({
        type: "success",
        text: `Request #${req.id} rejected and logged in immutable audit records.`,
      });
      setRejectionComment("");
      loadRequests();
      setSelectedRequest(result.request);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to reject request." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Dual-Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileCheck className="text-indigo-700" size={24} />
            Dual-Control Approvals Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 4 Multi-Party Authorization: Sensitive changes require two distinct staff members. Requests expire after 48 hours.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-xs select-none">
          <button
            onClick={() => setActiveTab("waiting_for_me")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === "waiting_for_me"
                ? "bg-indigo-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Waiting for Me
          </button>
          <button
            onClick={() => setActiveTab("requested_by_me")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === "requested_by_me"
                ? "bg-indigo-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Requested by Me
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === "history"
                ? "bg-indigo-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Alert / Feedback Toast */}
      {statusMsg && (
        <div
          className={`p-3 rounded-md flex items-center gap-2 text-xs border ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Two-Column View: Request List + Change Diff Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {activeTab === "waiting_for_me"
                ? "Pending Authorizations"
                : activeTab === "requested_by_me"
                ? "My Submitted Requests"
                : "Historical Action Records"}
            </span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {requests.length} total
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
                <p className="font-semibold text-slate-700">Queue is clear</p>
                <p>No actions require your attention in this tab.</p>
              </div>
            ) : (
              requests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                const isSelf = req.requesterEmail.toLowerCase() === currentOperator.email.toLowerCase();

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-3.5 cursor-pointer transition-colors text-left ${
                      isSelected
                        ? "bg-indigo-50/60 border-l-4 border-indigo-700"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {req.actionTitle}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          req.status === "pending"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : req.status === "approved"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 font-normal">
                      &quot;{req.reason}&quot;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        <span>{req.requesterName}</span>
                        {isSelf && (
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-bold">
                            You
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Expires 48h</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Inspection & Diff Viewer (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-xs p-6 space-y-6">
          {selectedRequest ? (
            <>
              {/* Request Header */}
              <div className="border-b border-slate-200 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Request ID: {selectedRequest.id}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedRequest.status === "pending"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : selectedRequest.status === "approved"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    Status: {selectedRequest.status.toUpperCase()}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900">{selectedRequest.actionTitle}</h2>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Submitted By:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRequest.requesterName} ({selectedRequest.requesterRole})
                    </span>
                    <p className="text-[11px] font-mono text-slate-500">{selectedRequest.requesterEmail}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Time Window:</span>
                    <span className="font-mono text-slate-700">Created: {new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                    <p className="text-[11px] font-mono text-amber-700 font-semibold">
                      Deadline: {new Date(selectedRequest.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Written Justification (Mandatory Reason) */}
              <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Mandatory Written Justification
                </span>
                <p className="text-xs text-slate-800 italic leading-relaxed">&quot;{selectedRequest.reason}&quot;</p>
              </div>

              {/* Exact Change Diff: Before vs After State (Section 4) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Exact State Change Before and After
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before State */}
                  <div className="border border-slate-200 rounded-md p-3 bg-rose-50/30">
                    <span className="text-[11px] font-bold text-rose-800 block mb-1">Previous / Current State</span>
                    <pre className="text-[11px] font-mono bg-white p-2.5 rounded border border-rose-200 overflow-x-auto text-slate-800">
                      {JSON.stringify(selectedRequest.beforeState || { status: "none" }, null, 2)}
                    </pre>
                  </div>

                  {/* After State */}
                  <div className="border border-slate-200 rounded-md p-3 bg-emerald-50/30">
                    <span className="text-[11px] font-bold text-emerald-800 block mb-1">Proposed New State</span>
                    <pre className="text-[11px] font-mono bg-white p-2.5 rounded border border-emerald-200 overflow-x-auto text-slate-800">
                      {JSON.stringify(selectedRequest.afterState, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Decision Actions (Dual-Control Enforcement) */}
              {selectedRequest.status === "pending" && (
                <div className="border-t border-slate-200 pt-5 space-y-4">
                  {/* Self-approval prevention warning if operator is the requester */}
                  {selectedRequest.requesterEmail.toLowerCase() === currentOperator.email.toLowerCase() ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-xs text-amber-800">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                      <span>
                        <strong>Dual-Control Boundary:</strong> You cannot approve your own request. Another qualified staff member must review and approve this action.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Rejection Reason (Required only if rejecting):
                        </label>
                        <textarea
                          rows={2}
                          value={rejectionComment}
                          onChange={(e) => setRejectionComment(e.target.value)}
                          placeholder="Provide clear rationale if rejecting this proposal..."
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleReject(selectedRequest)}
                          className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                        >
                          Reject Request
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(selectedRequest)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve & Execute Action</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Historical Execution / Rejection Details */}
              {selectedRequest.status !== "pending" && (
                <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold block text-slate-800">Resolution Record:</span>
                  <p>
                    Evaluated by <strong>{selectedRequest.approverName || "System"}</strong> ({selectedRequest.approverEmail})
                  </p>
                  {selectedRequest.rejectionComment && (
                    <p className="text-rose-700 italic">&quot;{selectedRequest.rejectionComment}&quot;</p>
                  )}
                  {selectedRequest.executedAt && (
                    <p className="font-mono text-[11px] text-emerald-700">
                      Executed automatically at {new Date(selectedRequest.executedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              Select an item from the queue to inspect diff and details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

