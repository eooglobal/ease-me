"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Building2,
  Clock,
  Send,
  Lock,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  KeyRound,
  FileText,
  User,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import {
  PlatformSupportService,
  SupportAccessGrantEngine,
  SupportTicketItem,
  SupportMessageItem,
} from "@/lib/superadmin/support-service";
import { PlatformContentService } from "@/lib/superadmin/content-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;

  const currentStaff: PlatformStaffContext = {
    id: "usr-sup-01",
    name: "Tunde Bakare",
    email: "tunde.bakare@easeme.ng",
    role: "support_agent",
  };

  const [ticketData, setTicketData] = useState(() => {
    try {
      return PlatformSupportService.getTicketById(ticketId);
    } catch {
      return null;
    }
  });

  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply");
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const templates = PlatformContentService.getTemplates();
  const activeGrants = SupportAccessGrantEngine.getActiveGrants();

  if (!ticketData) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Support Ticket Not Found</h2>
        <Link href="/superadmin/support" className="text-xs text-brand-600 hover:underline">
          &larr; Return to Support Queue
        </Link>
      </div>
    );
  }

  const { ticket, messages } = ticketData;
  const tenantGrant = activeGrants.find((g) => g.tenantId === ticket.tenantId);

  const handleStatusChange = async (newStatus: SupportTicketItem["status"]) => {
    try {
      await PlatformSupportService.updateTicketStatus(ticket.id, newStatus, currentStaff);
      setTicketData(PlatformSupportService.getTicketById(ticket.id));
      setFeedback({ type: "success", message: `Ticket status updated to ${newStatus}.` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update ticket status." });
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await PlatformSupportService.replyTicket(
        ticket.id,
        replyText,
        currentStaff,
        composerMode === "note"
      );

      setTicketData(PlatformSupportService.getTicketById(ticket.id));
      setReplyText("");
      setFeedback({
        type: "success",
        message: composerMode === "note" ? "Internal staff note recorded." : "Reply sent to tenant.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to submit message." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyCannedTemplate = (templateKey: string) => {
    const tmpl = templates.find((t) => t.templateKey === templateKey);
    if (!tmpl) return;

    // Substitute standard dummy tenant tokens
    const populated = tmpl.body
      .replace(/\{\{business_name\}\}/g, ticket.tenantName)
      .replace(/\{\{owner_name\}\}/g, "Store Manager")
      .replace(/\{\{support_email\}\}/g, "support@easeme.ng");

    setReplyText((prev) => (prev ? prev + "\n\n" + populated : populated));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 space-y-3">
        <Link
          href="/superadmin/support"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Support Queue
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{ticket.id}</span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{ticket.subject}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <Link
                href={`/superadmin/tenants/${ticket.tenantId}`}
                className="font-semibold text-brand-600 hover:underline inline-flex items-center gap-1"
              >
                {ticket.tenantName} <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <span className="font-mono text-slate-500">{ticket.maskedOwnerEmail}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                ticket.priority === "urgent"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : ticket.priority === "high"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              Priority: {ticket.priority}
            </span>

            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-semibold text-slate-700"
            >
              <option value="open">Status: Open</option>
              <option value="in_progress">Status: In Progress</option>
              <option value="waiting_on_tenant">Status: Waiting on Tenant</option>
              <option value="resolved">Status: Resolved</option>
              <option value="closed">Status: Closed</option>
            </select>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-md text-xs flex items-start gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Consent Grant Banner if Active */}
      {tenantGrant && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3.5 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              <strong>Active Consent-Based Access Grant ({tenantGrant.id}):</strong> The owner granted hands-on configuration assistance until{" "}
              {new Date(tenantGrant.expiresAt).toLocaleTimeString()} ({tenantGrant.pageViewsCount} views logged).
            </span>
          </div>
          <Link
            href={`/superadmin/tenants/${ticket.tenantId}?tab=entitlements`}
            className="font-bold underline hover:text-purple-700 shrink-0"
          >
            Open Config &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Thread */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4 max-h-[500px] overflow-y-auto">
            {messages.map((msg) => {
              const isStaff = msg.authorType === "staff";
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg border text-xs leading-relaxed space-y-2 ${
                    msg.isInternalNote
                      ? "bg-amber-50/70 border-amber-300 text-amber-950"
                      : isStaff
                      ? "bg-slate-50 border-slate-200 text-slate-800"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2 border-inherit/40">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{msg.authorName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 uppercase">
                        {msg.authorRole}
                      </span>
                      {msg.isInternalNote && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 uppercase px-1.5 py-0.5 rounded bg-amber-200/80">
                          <Lock className="w-2.5 h-2.5" /> Internal Note — Hidden from Tenant
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComposerMode("reply")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    composerMode === "reply"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Reply to Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode("note")}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    composerMode === "note"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Lock className="w-3 h-3" /> Add Internal Staff Note
                </button>
              </div>

              {/* Canned reply dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <FileText className="w-3.5 h-3.5" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      applyCannedTemplate(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="text-[11px] p-1 border border-slate-300 rounded bg-white text-slate-700"
                  defaultValue=""
                >
                  <option value="" disabled>Insert Canned Template...</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.templateKey} value={tmpl.templateKey}>
                      {tmpl.name} ({tmpl.channel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={4}
                required
                placeholder={
                  composerMode === "note"
                    ? "Add internal staff notes for team handover. These are NEVER visible to the tenant..."
                    : "Draft official reply to tenant..."
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`w-full text-xs p-3 border rounded-md focus:outline-none ${
                  composerMode === "note"
                    ? "border-amber-300 bg-amber-50/30 focus:ring-1 focus:ring-amber-500"
                    : "border-slate-300 focus:ring-1 focus:ring-brand-500"
                }`}
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {composerMode === "note"
                    ? "Logged strictly to internal staff audit history."
                    : "Dispatched to tenant dashboard and support email."}
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                    composerMode === "note"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-brand-600 hover:bg-brand-700"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? "Submitting..." : composerMode === "note" ? "Save Internal Note" : "Send Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Ticket Metadata</h3>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Assignee:</span>
                <span className="font-medium text-slate-800">{ticket.assigneeStaffName || "Unassigned"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Created:</span>
                <span className="font-mono text-slate-700">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Age:</span>
                <span className="font-mono text-slate-700">{ticket.ageHours} hours</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">SLA Highlighting:</span>
                <span className={ticket.isOverdue48h ? "font-bold text-amber-700" : "text-emerald-700"}>
                  {ticket.isOverdue48h ? "Breached (>48h)" : "Within SLA"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-600" /> Support Safety Policy
            </h4>
            <p className="leading-relaxed">
              Super Admin staff cannot view tenant basket sales or customer transaction debts. Configuration troubleshooting is performed only under an active consent grant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

