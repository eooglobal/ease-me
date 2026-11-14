"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Plus,
  AlertTriangle,
  CheckCircle,
  Eye,
  Clock,
  Calendar,
  Users,
  Send,
  Archive,
  Layers,
} from "lucide-react";
import {
  PlatformContentService,
  AnnouncementItem,
} from "@/lib/superadmin/content-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function AnnouncementsPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    PlatformContentService.getAnnouncements()
  );

  const [previewItem, setPreviewItem] = useState<AnnouncementItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "info" as AnnouncementItem["severity"],
    audienceType: "all" as AnnouncementItem["audienceType"],
    targetAudience: "",
    startsAt: new Date().toISOString().split("T")[0],
    endsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0],
    isDismissible: true,
  });

  const handlePublish = async (id: string) => {
    try {
      await PlatformContentService.publishAnnouncement(id, currentStaff);
      setAnnouncements(PlatformContentService.getAnnouncements());
      setFeedback({ type: "success", message: "Announcement published live to tenant dashboards. Version snapshot recorded." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to publish announcement." });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const targetList = formData.targetAudience
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await PlatformContentService.createAnnouncement(
        {
          title: formData.title,
          message: formData.message,
          severity: formData.severity,
          audienceType: formData.audienceType,
          targetAudience: targetList,
          startsAt: new Date(formData.startsAt).toISOString(),
          endsAt: new Date(formData.endsAt).toISOString(),
          isDismissible: formData.isDismissible,
        },
        currentStaff
      );

      setAnnouncements(PlatformContentService.getAnnouncements());
      setIsModalOpen(false);
      setFeedback({ type: "success", message: "Announcement drafted successfully." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to draft announcement." });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Broadcast Announcements</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
              {announcements.length} Total
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Publish urgent alerts, scheduled downtime, and feature notices directly into tenant dashboards.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Draft New Announcement
        </button>
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

      {/* Announcements Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Title & Message</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Audience Scope</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Active Window</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {announcements.map((ann) => (
                <tr key={ann.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-semibold text-slate-900">{ann.title}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{ann.message}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        ann.severity === "critical"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : ann.severity === "warning"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {ann.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    <span className="font-medium capitalize">{ann.audienceType.replace("_", " ")}</span>
                    {ann.targetAudience.length > 0 && (
                      <span className="block text-[10px] text-slate-500">
                        {ann.targetAudience.join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        ann.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ann.status === "published" ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {ann.status.toUpperCase()} (v{ann.currentVersion})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                    <div>{new Date(ann.startsAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">to {new Date(ann.endsAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setPreviewItem(ann)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
                      >
                        <Eye className="w-3 h-3" /> Tenant Preview
                      </button>

                      {ann.status === "draft" && (
                        <button
                          onClick={() => handlePublish(ann.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-semibold"
                        >
                          <Send className="w-3 h-3" /> Publish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Eye className="w-4 h-4 text-brand-600" />
                <span>Tenant Dashboard Banner Preview</span>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 text-xs">✕</button>
            </div>

            <div className="text-xs text-slate-500">
              This preview matches the banner that store owners and cashiers will see in the Ease Me application:
            </div>

            {/* Rendered Preview Box */}
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                previewItem.severity === "critical"
                  ? "bg-rose-50 border-rose-300 text-rose-900"
                  : previewItem.severity === "warning"
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-blue-50 border-blue-300 text-blue-900"
              }`}
            >
              <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-xs uppercase tracking-wider">{previewItem.title}</h4>
                <p className="mt-1 text-xs leading-relaxed">{previewItem.message}</p>
                {previewItem.isDismissible && (
                  <span className="mt-2 inline-block text-[10px] text-slate-500 font-medium">
                    [Tenant can dismiss banner]
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Draft Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Megaphone className="w-4 h-4 text-brand-600" />
                <span>Draft New Announcement</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Card Settlement Maintenance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed announcement text for tenants..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="critical">Critical (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Audience Type</label>
                  <select
                    value={formData.audienceType}
                    onChange={(e) => setFormData({ ...formData, audienceType: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="all">All Tenants</option>
                    <option value="one_plan">Specific Plan</option>
                    <option value="one_business_type">Specific Business Type</option>
                    <option value="custom_list">Custom Tenant IDs</option>
                  </select>
                </div>
              </div>

              {formData.audienceType !== "all" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Criteria (comma separated e.g. Growth, Business or pharmacy)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pharmacy or Growth"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDismissible}
                    onChange={(e) => setFormData({ ...formData, isDismissible: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-700">Dismissible by tenant users</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

