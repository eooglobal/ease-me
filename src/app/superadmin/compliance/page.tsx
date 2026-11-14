"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Database,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  HardDrive,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  PlatformComplianceService,
  DataRequestItem,
  BackupStatusRecord,
} from "@/lib/superadmin/compliance-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function SuperAdminCompliancePage() {
  const [requests, setRequests] = useState<DataRequestItem[]>(() =>
    PlatformComplianceService.listRequests()
  );
  const [backupStatus, setBackupStatus] = useState<BackupStatusRecord>(() =>
    PlatformComplianceService.getBackupStatus()
  );
  const [filterType, setFilterType] = useState<"all" | "export" | "deletion">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Simulated active staff context (Security Officer)
  const currentStaff: PlatformStaffContext = {
    id: "usr-sec-01",
    name: "Security Officer",
    email: "security@easeme.ng",
    role: "security",
  };

  const reloadData = () => {
    setRequests(PlatformComplianceService.listRequests());
    setBackupStatus(PlatformComplianceService.getBackupStatus());
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setFeedback({ type: "success", text: "Expiring download link copied to clipboard (valid 24h)." });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSubmitDualApproval = async (req: DataRequestItem) => {
    setProcessingId(req.id);
    try {
      await PlatformComplianceService.submitDeletionForApproval(
        req.id,
        "Tenant requested full closure; 14-day statutory retention cooling period elapsed.",
        currentStaff
      );
      setFeedback({
        type: "success",
        text: `Deletion request ${req.id} submitted for Dual-Control approval at /superadmin/approvals.`,
      });
      reloadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to submit dual control approval." });
    } finally {
      setProcessingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesType = filterType === "all" || r.requestType === filterType;
    const matchesSearch =
      r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Compliance, Data Protection & Backups
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              NDPR & GDPR Aligned
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 6.11 & 9: Statutory data requests (NDPR/GDPR 14-day clock), dual-control purge
            workflows, and immutable backup proofs.
          </p>
        </div>

        <button
          onClick={reloadData}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Requests
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-sm flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Backup & Disaster Recovery Status Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Disaster Recovery & Backup Telemetry
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Immutable Storage Vault: {backupStatus.storageLocation}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
            <span className="text-xs font-semibold text-slate-500 uppercase">Last Successful Backup</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {new Date(backupStatus.lastBackupAt).toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Snapshot verified OK
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
            <span className="text-xs font-semibold text-slate-500 uppercase">Backup Volume & Format</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {backupStatus.backupSizeGb} GB (ZSTD Compressed)
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">AES-256 at-rest encryption</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
            <span className="text-xs font-semibold text-slate-500 uppercase">Statutory Retention Window</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {backupStatus.retentionDays} Days Retention
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Automated rotation policy</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
            <span className="text-xs font-semibold text-slate-500 uppercase">Last Automated Restore Drill</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {new Date(backupStatus.lastRestoreTestAt).toLocaleDateString()}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Integrity check passed (100%)
            </span>
          </div>
        </div>
      </div>

      {/* Statutory Data Requests Queue */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tenant or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-64 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterType === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Requests ({requests.length})
              </button>
              <button
                onClick={() => setFilterType("export")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterType === "export" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Exports ({requests.filter((r) => r.requestType === "export").length})
              </button>
              <button
                onClick={() => setFilterType("deletion")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterType === "deletion" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Deletions ({requests.filter((r) => r.requestType === "deletion").length})
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4 text-amber-500" />
            Statutory clock enforced: Max 14 calendar days per request.
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold sticky top-0">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Tenant / Requester</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Statutory Clock</th>
                <th className="py-3 px-4">Expiring Link / Retention</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No data requests matching your filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {req.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{req.tenantName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{req.ownerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      {req.requestType === "export" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Download className="w-3 h-3" /> Data Export
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <Trash2 className="w-3 h-3" /> Permanent Purge
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {req.status === "ready_for_download" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Ready for Download
                        </span>
                      )}
                      {req.status === "retention_window" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> In Retention Cooling (14d)
                        </span>
                      )}
                      {req.status === "pending_dual_approval" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <AlertTriangle className="w-3 h-3" /> Dual Control Pending
                        </span>
                      )}
                      {req.status === "completed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                          <CheckCircle2 className="w-3 h-3" /> Completed & Purged
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>Deadline: {new Date(req.statutoryDeadline).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-400">
                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {req.requestType === "export" && req.downloadUrl ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-slate-600 truncate max-w-[140px]">
                              {req.downloadUrl}
                            </span>
                            <button
                              onClick={() => handleCopyLink(req.downloadUrl!)}
                              title="Copy secure link"
                              className="p-1 text-slate-500 hover:text-slate-900 rounded-sm hover:bg-slate-100"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-amber-600 font-medium">
                            Expires: {new Date(req.downloadExpiresAt!).toLocaleTimeString()} (24h)
                          </span>
                        </div>
                      ) : req.requestType === "deletion" && req.retentionEndsAt ? (
                        <div>
                          <div className="text-slate-700 font-medium">
                            Window Ends: {new Date(req.retentionEndsAt).toLocaleDateString()}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Owner can self-cancel before this date
                          </span>
                        </div>
                      ) : req.completionRecord ? (
                        <div className="text-[11px] font-mono text-emerald-700">
                          Purged: {req.completionRecord.purgedAt?.substring(0, 10)}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.requestType === "deletion" && req.status === "retention_window" && (
                        <button
                          onClick={() => handleSubmitDualApproval(req)}
                          disabled={processingId === req.id}
                          className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100 transition shadow-xs disabled:opacity-50"
                        >
                          Submit Dual Approval
                        </button>
                      )}
                      {req.requestType === "deletion" && req.status === "pending_dual_approval" && (
                        <a
                          href="/superadmin/approvals"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition shadow-xs"
                        >
                          Review in Approvals <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {req.requestType === "export" && (
                        <button
                          onClick={() => handleCopyLink(req.downloadUrl || "")}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-md hover:bg-slate-100 transition"
                        >
                          Copy Link
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
