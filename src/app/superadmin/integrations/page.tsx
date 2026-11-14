"use client";

import React, { useState } from "react";
import {
  KeyRound,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  HardDrive,
  Database,
  Mail,
  MessageSquare,
  Lock,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  PlatformIntegrationsService,
  IntegrationConfigItem,
} from "@/lib/superadmin/platform-config-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function IntegrationsPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [integrations, setIntegrations] = useState<IntegrationConfigItem[]>(() =>
    PlatformIntegrationsService.getIntegrations()
  );

  const [testingId, setTestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit Credentials Modal
  const [editingItem, setEditingItem] = useState<IntegrationConfigItem | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "paystack":
        return <CreditCard className="w-5 h-5 text-indigo-600" />;
      case "storage_r2":
        return <HardDrive className="w-5 h-5 text-amber-600" />;
      case "cache_redis":
        return <Database className="w-5 h-5 text-rose-600" />;
      case "email_postmark":
        return <Mail className="w-5 h-5 text-blue-600" />;
      case "sms_termii":
        return <MessageSquare className="w-5 h-5 text-emerald-600" />;
      default:
        return <KeyRound className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleTestConnection = async (providerId: string) => {
    setTestingId(providerId);
    setFeedback(null);

    try {
      const res = await PlatformIntegrationsService.testConnection(providerId, currentStaff);
      setIntegrations(PlatformIntegrationsService.getIntegrations());
      setFeedback({ type: "success", message: res.message });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Connection diagnostic failed." });
    } finally {
      setTestingId(null);
    }
  };

  const openEditModal = (item: IntegrationConfigItem) => {
    setEditingItem(item);
    const initialValues: Record<string, string> = {};
    for (const [key, field] of Object.entries(item.fields)) {
      // Secret fields initialized as empty / placeholder to enforce write-only invariant
      initialValues[key] = field.isSecret ? "" : field.value;
    }
    setEditValues(initialValues);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await PlatformIntegrationsService.updateIntegration(editingItem.id, editValues, currentStaff);
      setIntegrations(PlatformIntegrationsService.getIntegrations());
      setFeedback({
        type: "success",
        message: `${editingItem.name} configuration updated successfully. Secrets saved as write-only.`,
      });
      setEditingItem(null);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save integration secrets." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Integrations & Secrets</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero Cleartext Leak
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Hardware, gateway, storage and messaging connections. Secrets are strictly write-only and never returned in full.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs text-slate-700 border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Section 12: Secrets Displayed in Full Prohibited</span>
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

      {/* Grid of Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-md">
                    {getProviderIcon(item.provider)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{item.name}</h2>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      Category: {item.category}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    item.status === "healthy"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : item.status === "degraded"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.status === "healthy"
                        ? "bg-emerald-500"
                        : item.status === "degraded"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {item.status.toUpperCase()}
                </span>
              </div>

              {/* Fields Table */}
              <div className="mt-3 space-y-2">
                {Object.entries(item.fields).map(([fieldKey, field]) => (
                  <div
                    key={fieldKey}
                    className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 border-b border-slate-50"
                  >
                    <span className="text-slate-500 font-medium">{field.label}:</span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 max-w-xs truncate">
                      {field.isSecret && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                      <span className="truncate">{field.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Last verified: {item.lastTestedAt ? new Date(item.lastTestedAt).toLocaleTimeString() : "Never"}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => openEditModal(item)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
                >
                  Configure Secrets
                </button>

                <button
                  onClick={() => handleTestConnection(item.id)}
                  disabled={testingId === item.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  {testingId === item.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Credentials Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lock className="w-4 h-4 text-brand-600" />
                <span>Configure {editingItem.name}</span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-[11px] text-amber-800">
              <span className="font-semibold block mb-0.5">Write-Only Secret Security</span>
              For security, previously saved secrets are never displayed. Leave a secret field empty to keep the existing value unchanged.
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              {Object.entries(editingItem.fields).map(([fieldKey, field]) => (
                <div key={fieldKey}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {field.label} {field.isSecret && <span className="text-slate-400 font-normal">(write-only)</span>}
                  </label>
                  <input
                    type={field.isSecret ? "password" : "text"}
                    placeholder={field.isSecret ? "•••••••••••• (leave blank to keep current)" : ""}
                    value={editValues[fieldKey] || ""}
                    onChange={(e) => setEditValues({ ...editValues, [fieldKey]: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold"
                >
                  {isSubmitting ? "Saving..." : "Save Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

