"use client";

import React, { useState } from "react";
import {
  Flag,
  Plus,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  Users,
  Search,
  Filter,
  Trash2,
  Edit2,
  RefreshCw,
} from "lucide-react";
import {
  PlatformFeatureFlagService,
  FeatureFlagData,
} from "@/lib/superadmin/platform-config-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function FeatureFlagsPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [flags, setFlags] = useState<FeatureFlagData[]>(() =>
    PlatformFeatureFlagService.listFlags()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled" | "stale">("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    description: "",
    owner: "Engineering",
    defaultState: false,
    enabled: true,
    rolloutPercentage: 0,
    reviewDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split("T")[0],
    eligiblePlans: ["Starter", "Growth", "Business", "Enterprise"],
    tenantAllowlist: "",
  });

  const staleFlagsCount = flags.filter(
    (f) => f.enabled && new Date(f.reviewDate) < new Date()
  ).length;

  const filteredFlags = flags.filter((f) => {
    const matchesSearch =
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.owner.toLowerCase().includes(searchQuery.toLowerCase());

    const isStale = f.enabled && new Date(f.reviewDate) < new Date();

    if (!matchesSearch) return false;
    if (statusFilter === "enabled") return f.enabled;
    if (statusFilter === "disabled") return !f.enabled;
    if (statusFilter === "stale") return isStale;
    return true;
  });

  const handleToggle = async (flag: FeatureFlagData) => {
    try {
      const updated = await PlatformFeatureFlagService.updateFlag(
        flag.key,
        { enabled: !flag.enabled },
        currentStaff
      );
      setFlags(PlatformFeatureFlagService.listFlags());
      setFeedback({
        type: "success",
        message: `Feature flag '${flag.key}' is now ${updated.enabled ? "ENABLED" : "DISABLED"}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to toggle feature flag." });
    }
  };

  const handleSaveFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const allowlist = formData.tenantAllowlist
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingKey) {
        await PlatformFeatureFlagService.updateFlag(
          editingKey,
          {
            description: formData.description,
            owner: formData.owner,
            defaultState: formData.defaultState,
            enabled: formData.enabled,
            rolloutPercentage: Number(formData.rolloutPercentage),
            reviewDate: new Date(formData.reviewDate).toISOString(),
            eligiblePlans: formData.eligiblePlans,
            tenantAllowlist: allowlist,
          },
          currentStaff
        );
        setFeedback({ type: "success", message: `Feature flag '${editingKey}' updated successfully.` });
      } else {
        await PlatformFeatureFlagService.createFlag(
          {
            key: formData.key,
            description: formData.description,
            owner: formData.owner,
            defaultState: formData.defaultState,
            enabled: formData.enabled,
            rolloutPercentage: Number(formData.rolloutPercentage),
            reviewDate: new Date(formData.reviewDate).toISOString(),
            eligiblePlans: formData.eligiblePlans,
            tenantAllowlist: allowlist,
          },
          currentStaff
        );
        setFeedback({ type: "success", message: `Feature flag '${formData.key}' created successfully.` });
      }

      setFlags(PlatformFeatureFlagService.listFlags());
      setIsModalOpen(false);
      setEditingKey(null);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save feature flag." });
    }
  };

  const openCreateModal = () => {
    setEditingKey(null);
    setFormData({
      key: "",
      description: "",
      owner: "Engineering",
      defaultState: false,
      enabled: true,
      rolloutPercentage: 0,
      reviewDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split("T")[0],
      eligiblePlans: ["Starter", "Growth", "Business", "Enterprise"],
      tenantAllowlist: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (f: FeatureFlagData) => {
    setEditingKey(f.key);
    setFormData({
      key: f.key,
      description: f.description,
      owner: f.owner,
      defaultState: f.defaultState,
      enabled: f.enabled,
      rolloutPercentage: f.rolloutPercentage,
      reviewDate: f.reviewDate.split("T")[0],
      eligiblePlans: f.eligiblePlans,
      tenantAllowlist: f.tenantAllowlist.join(", "),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to permanently delete flag '${key}'?`)) return;

    try {
      await PlatformFeatureFlagService.deleteFlag(key, currentStaff);
      setFlags(PlatformFeatureFlagService.listFlags());
      setFeedback({ type: "success", message: `Flag '${key}' has been deleted.` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete flag." });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Feature Flags</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
              {flags.length} Flags Registered
            </span>
            {staleFlagsCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                <AlertTriangle className="w-3 h-3" /> {staleFlagsCount} Past Review Date
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Progressive rollout controls and experimental switches by plan tier, tenant list, or percentage bucket.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Create Feature Flag
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
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search flags by key, owner, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="all">All Flags</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
            <option value="stale">Past Review Date</option>
          </select>
        </div>
      </div>

      {/* Dense Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Flag Key & Description</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Rollout %</th>
                <th className="py-2.5 px-3">Plan Eligibility</th>
                <th className="py-2.5 px-3">Review Date</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No feature flags match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredFlags.map((flag) => {
                  const isStale = flag.enabled && new Date(flag.reviewDate) < new Date();
                  return (
                    <tr key={flag.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900">{flag.key}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{flag.description}</div>
                        {flag.tenantAllowlist.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-brand-600">
                            <Users className="w-3 h-3" /> Allowlist: {flag.tenantAllowlist.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{flag.owner}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggle(flag)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                            flag.enabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              flag.enabled ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {flag.enabled ? "Enabled" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-brand-500 h-full rounded-full"
                              style={{ width: `${flag.rolloutPercentage}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-700 text-[11px]">
                            {flag.rolloutPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {flag.eligiblePlans.map((p) => (
                            <span
                              key={p}
                              className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div
                          className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                            isStale ? "text-amber-700 font-semibold" : "text-slate-600"
                          }`}
                        >
                          {isStale && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {new Date(flag.reviewDate).toLocaleDateString()}
                        </div>
                        {isStale && (
                          <span className="block text-[10px] text-amber-600 uppercase font-semibold">
                            Review Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(flag)}
                            className="p-1 text-slate-500 hover:text-brand-600 rounded hover:bg-slate-100"
                            title="Edit Flag Rules"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(flag.key)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                            title="Delete Flag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flag Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Flag className="w-4 h-4 text-brand-600" />
                <span>{editingKey ? `Edit Flag: ${editingKey}` : "Create Feature Flag"}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFlag} className="space-y-4">
              {!editingKey && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Flag Key (alphanumeric, lowercase snake_case) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bulk_csv_import_v2"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain what feature this flag controls and release intent..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Owner / Team</label>
                  <input
                    type="text"
                    required
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Review Date</label>
                  <input
                    type="date"
                    required
                    value={formData.reviewDate}
                    onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Rollout Percentage (0 - 100%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.rolloutPercentage}
                    onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Flag Enabled Globally</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tenant Allowlist (comma separated tenant IDs)
                </label>
                <input
                  type="text"
                  placeholder="ten-001, ten-002"
                  value={formData.tenantAllowlist}
                  onChange={(e) => setFormData({ ...formData, tenantAllowlist: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold"
                >
                  {editingKey ? "Save Changes" : "Create Flag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

