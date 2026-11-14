"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Building2,
  Clock,
  KeyRound,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { PlatformAuditLogger, PlatformAuditRecord } from "@/lib/superadmin/audit-logger";
import { downloadCSV } from "@/lib/export/export-utils";

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<PlatformAuditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<PlatformAuditRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeStaff = {
    email: "security@easeme.ng",
    role: "security",
  };

  const loadLogs = async () => {
    setIsLoading(true);
    let queried = await PlatformAuditLogger.query();

    // If trail is empty, seed a few realistic platform audit entries for visualization
    if (queried.length === 0) {
      await PlatformAuditLogger.log({
        staffEmail: "emeka.okonkwo@easeme.ng",
        staffRole: "owner",
        action: "staff.role_change_requested",
        entityType: "platform_staff",
        entityId: "usr-004",
        previousValue: { role: "support_agent" },
        newValue: { role: "financial_analyst" },
      });
      await PlatformAuditLogger.log({
        staffEmail: "security@easeme.ng",
        staffRole: "security",
        action: "compliance.deletion_dual_approved",
        entityType: "data_requests",
        entityId: "req-del-01",
        previousValue: { status: "retention_window" },
        newValue: { status: "pending_dual_approval" },
      });
      await PlatformAuditLogger.log({
        staffEmail: "tunde.bakare@easeme.ng",
        staffRole: "support_agent",
        action: "support_grant.page_viewed",
        entityType: "support_access_grants",
        entityId: "grant-001",
        newValue: { path: "/dashboard/settings" },
      });
      queried = await PlatformAuditLogger.query();
    }

    setLogs(queried);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExportCSV = async () => {
    const csvContent = await PlatformAuditLogger.exportToCSV(activeStaff);
    downloadCSV(csvContent, `platform-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    setFeedback("Audit log exported. Export action logged to immutable audit trail.");
    loadLogs();
    setTimeout(() => setFeedback(null), 4000);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.staffEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Immutable Platform Audit Trail
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              Append-Only (WORM Storage)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 6.9 & 11: Non-repudiable log of all operator actions. Zero update or delete
            privileges, even for Platform Owners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Trail
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export to CSV
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200 text-sm flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, email, or entity ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Entity Types</option>
            <option value="platform_staff">Platform Staff</option>
            <option value="data_requests">Data Requests / Purges</option>
            <option value="support_access_grants">Support Access Grants</option>
            <option value="platform_settings">Platform Settings</option>
            <option value="platform_audit_logs">Audit Exports</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold sticky top-0">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type / ID</th>
                <th className="py-3 px-4">State Diff</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records matching your search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.staffEmail}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-600 font-mono text-[10px]">
                        {log.staffRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{log.entityType}</div>
                      {log.entityId && (
                        <div className="font-mono text-[10px] text-slate-400">{log.entityId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.previousValue || log.newValue ? (
                        <div className="max-w-[200px] truncate font-mono text-[11px] text-slate-600">
                          {log.previousValue ? "Changed" : "Created"}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Audit Entry Deep Inspection</h3>
                <span className="text-xs font-mono text-slate-500">{selectedRecord.id}</span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-semibold block uppercase">Operator</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {selectedRecord.staffEmail} ({selectedRecord.staffRole})
                </span>
                <span className="text-slate-500 text-[11px] mt-0.5 block font-mono">
                  IP: {selectedRecord.ipAddress}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-semibold block uppercase">Target Entity</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {selectedRecord.entityType}
                </span>
                <span className="text-slate-500 text-[11px] mt-0.5 block font-mono">
                  ID: {selectedRecord.entityId || "N/A"}
                </span>
              </div>
            </div>

            {/* Before vs After Diff */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-900 uppercase">State Transition Diff</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Previous Value
                  </span>
                  <pre className="p-3 bg-rose-50/50 border border-rose-200 text-rose-950 rounded-lg font-mono text-[11px] overflow-x-auto min-h-[100px]">
                    {JSON.stringify(selectedRecord.previousValue, null, 2) || "null (New Record Created)"}
                  </pre>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    New Value
                  </span>
                  <pre className="p-3 bg-emerald-50/50 border border-emerald-200 text-emerald-950 rounded-lg font-mono text-[11px] overflow-x-auto min-h-[100px]">
                    {JSON.stringify(selectedRecord.newValue, null, 2) || "null"}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
