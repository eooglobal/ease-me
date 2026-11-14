"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  AlertTriangle,
  Clock,
  Filter,
  CheckCircle,
  Search,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Building2,
  ExternalLink,
} from "lucide-react";
import {
  PlatformSupportService,
  SupportAccessGrantEngine,
  SupportTicketItem,
  SupportAccessGrantItem,
} from "@/lib/superadmin/support-service";

export default function SupportQueuePage() {
  const [activeTab, setActiveTab] = useState<"tickets" | "grants">("tickets");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tickets = PlatformSupportService.listTickets({
    status: statusFilter,
    priority: priorityFilter,
  });

  const activeGrants = SupportAccessGrantEngine.getActiveGrants();
  const overdueCount = PlatformSupportService.getOverdueTicketsCount();

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.tenantName.toLowerCase().includes(q) ||
      t.maskedOwnerEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Support Operations & Queue</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
              Section 6.9 & Section 8
            </span>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {overdueCount} SLA Breach (&gt;48h)
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Tenant support tickets and consent-based hands-on configuration sessions. User impersonation strictly prohibited.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs text-slate-700 border border-slate-200">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
          <span>Section 8: Impersonation Prohibited</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "tickets"
              ? "border-brand-600 text-brand-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Tickets Queue ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("grants")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "grants"
              ? "border-brand-600 text-brand-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Active Consent Grants ({activeGrants.length})</span>
        </button>
      </div>

      {activeTab === "tickets" && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-3 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by subject, tenant, or masked email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-2 py-1 border border-slate-300 rounded-md bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_on_tenant">Waiting on Tenant</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs px-2 py-1 border border-slate-300 rounded-md bg-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Tenant & Subject</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assignee</th>
                    <th className="py-2.5 px-3">Age / SLA</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No support tickets match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          t.isOverdue48h ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="py-3 px-4 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 hover:text-brand-600">
                              <Link href={`/superadmin/support/${t.id}`}>{t.subject}</Link>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-700">{t.tenantName}</span>
                            <span>•</span>
                            <span className="font-mono">{t.maskedOwnerEmail}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              t.priority === "urgent"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : t.priority === "high"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              t.status === "open"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : t.status === "in_progress"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : t.status === "waiting_on_tenant"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.status === "resolved" ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                            />
                            {t.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {t.assigneeStaffName || <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{t.ageHours}h ago</span>
                          </div>
                          {t.isOverdue48h && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 uppercase mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> &gt;48h SLA Breach
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/superadmin/support/${t.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-semibold"
                          >
                            Open Ticket <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "grants" && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 leading-relaxed">
              <span className="font-bold block mb-1">Consent-Based Support Access (Section 8)</span>
              Impersonation is prohibited. When a tenant owner requests hands-on troubleshooting, they grant temporary read-only access to their store configuration screens from their own settings. Every page viewed is audited and customer personal data is strictly blocked.
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Grant ID & Tenant</th>
                    <th className="py-2.5 px-3">Granted By</th>
                    <th className="py-2.5 px-3">Assigned Staff</th>
                    <th className="py-2.5 px-3">Scope</th>
                    <th className="py-2.5 px-3">Expires At</th>
                    <th className="py-2.5 px-3">Audited Views</th>
                    <th className="py-2.5 px-4 text-right">Session Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeGrants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No active consent-based support sessions are currently running.
                      </td>
                    </tr>
                  ) : (
                    activeGrants.map((grant) => (
                      <tr key={grant.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-slate-900">{grant.id}</span>
                          <div className="text-slate-700 font-medium mt-0.5">{grant.tenantName}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{grant.grantedByOwnerEmail}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Owner Consent Active</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">
                          {grant.assignedStaffName}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                            {grant.scope}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 text-[11px]">
                          {new Date(grant.expiresAt).toLocaleTimeString()} ({grant.durationHours}h max)
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono text-[11px] font-semibold">
                            {grant.pageViewsCount} views logged
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Active Session
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

