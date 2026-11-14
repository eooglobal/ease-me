"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldAlert,
  Globe,
  Sliders,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Save,
  Power,
  RefreshCw,
} from "lucide-react";
import {
  PlatformSettingsService,
  PlatformSettingsData,
} from "@/lib/superadmin/platform-config-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function PlatformSettingsPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [settings, setSettings] = useState<PlatformSettingsData>(() =>
    PlatformSettingsService.getSettings()
  );

  const [formData, setFormData] = useState<PlatformSettingsData>(() => ({
    ...settings,
  }));

  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [maintenanceCustomMsg, setMaintenanceCustomMsg] = useState(settings.maintenanceMessage);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updated = await PlatformSettingsService.updateSettings(
        {
          platformName: formData.platformName,
          supportEmail: formData.supportEmail,
          supportWhatsapp: formData.supportWhatsapp,
          logoUrl: formData.logoUrl,
          faviconUrl: formData.faviconUrl,
          defaultCurrency: formData.defaultCurrency,
          defaultTimezone: formData.defaultTimezone,
          dateFormat: formData.dateFormat,
          defaultTaxRate: Number(formData.defaultTaxRate),
          trialLengthDays: Number(formData.trialLengthDays),
          cardRequiredForTrial: formData.cardRequiredForTrial,
          gracePeriodDays: Number(formData.gracePeriodDays),
          signupMode: formData.signupMode,
          approvalThresholdAmount: Number(formData.approvalThresholdAmount),
        },
        currentStaff
      );

      setSettings(updated);
      setFormData(updated);
      setFeedback({ type: "success", message: "Platform settings saved successfully and logged to audit trail." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update platform settings." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!maintenanceReason.trim() || maintenanceReason.trim().length < 5) {
      setFeedback({ type: "error", message: "A detailed justification (min 5 characters) is mandatory to toggle maintenance." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const targetState = !settings.maintenanceMode;
      const res = await PlatformSettingsService.setMaintenanceMode(
        targetState,
        maintenanceReason,
        currentStaff,
        maintenanceCustomMsg
      );

      if (res.status === "pending_approval") {
        setFeedback({
          type: "info",
          message: `Maintenance mode change submitted to dual-control approval queue (Request ID: ${res.approvalRequestId}). Another authorized staff member must approve.`,
        });
      } else {
        const fresh = PlatformSettingsService.getSettings();
        setSettings(fresh);
        setFormData(fresh);
        setFeedback({
          type: "success",
          message: `Maintenance mode has been ${targetState ? "ACTIVATED" : "DEACTIVATED"}. Tenant routes are ${targetState ? "now blocked" : "restored"}.`,
        });
      }
      setMaintenanceModalOpen(false);
      setMaintenanceReason("");
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update maintenance mode." });
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
              Global Scope
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure regional defaults, onboarding trial terms, signup gates, and emergency maintenance mode.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setMaintenanceCustomMsg(settings.maintenanceMessage);
              setMaintenanceModalOpen(true);
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
              settings.maintenanceMode
                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-700"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {settings.maintenanceMode ? "Maintenance ACTIVE (Click to Disable)" : "Enable Maintenance Mode"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-3.5 rounded-md text-xs flex items-start gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : feedback.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Maintenance Alert Banner if Active */}
      {settings.maintenanceMode && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Platform Maintenance Mode is Currently Active
            </h2>
            <p className="mt-1 text-xs text-amber-800">
              All non-staff tenant access is suspended. Visitors to tenant portals or store POS terminals are redirected to the maintenance page. Platform staff retain administrative access.
            </p>
            {settings.maintenanceStartedAt && (
              <p className="mt-1 text-[11px] text-amber-700 font-mono">
                Initiated: {new Date(settings.maintenanceStartedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General & Identity */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-900">Platform Identity & Contact</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  value={formData.platformName}
                  onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Support WhatsApp</label>
                  <input
                    type="text"
                    value={formData.supportWhatsapp}
                    onChange={(e) => setFormData({ ...formData, supportWhatsapp: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Logo Asset URL</label>
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Favicon Asset URL</label>
                  <input
                    type="text"
                    value={formData.faviconUrl}
                    onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Regional Defaults */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">Regional & Financial Defaults</h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Primary Currency</label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="NGN">NGN (Nigerian Naira ₦)</option>
                    <option value="GHS">GHS (Ghanaian Cedi GH₵)</option>
                    <option value="KES">KES (Kenyan Shilling KSh)</option>
                    <option value="USD">USD (US Dollar $)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Platform Timezone</label>
                  <select
                    value={formData.defaultTimezone}
                    onChange={(e) => setFormData({ ...formData, defaultTimezone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white font-mono text-[11px]"
                  >
                    <option value="Africa/Lagos">Africa/Lagos (WAT / UTC+1)</option>
                    <option value="Africa/Accra">Africa/Accra (GMT / UTC+0)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT / UTC+3)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date Format</label>
                  <select
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white font-mono text-[11px]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 09/11/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Default VAT / Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={formData.defaultTaxRate}
                    onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Commercial Terms & Grace Period */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Commercial & Trial Controls</h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Default Trial Length (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.trialLengthDays}
                    onChange={(e) => setFormData({ ...formData, trialLengthDays: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Days before a new tenant is prompted to pay.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Billing Grace Period (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.gracePeriodDays}
                    onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Days before a failed renewal auto-suspends access.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Signup Policy Mode</label>
                <select
                  value={formData.signupMode}
                  onChange={(e) => setFormData({ ...formData, signupMode: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
                >
                  <option value="open">Open (Public self-serve registration enabled)</option>
                  <option value="invite_only">Invite Only (Invitation token required)</option>
                  <option value="closed">Closed (Signups completely blocked)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cardRequiredForTrial}
                    onChange={(e) => setFormData({ ...formData, cardRequiredForTrial: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-700">Require Credit/Debit Card Mandate for Trial Signup</span>
                </label>
              </div>
            </div>
          </div>

          {/* Dual Control Thresholds */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-semibold text-slate-900">Governance & Dual Control Thresholds</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Manual Credit Approval Threshold (₦)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-semibold">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    value={formData.approvalThresholdAmount}
                    onChange={(e) => setFormData({ ...formData, approvalThresholdAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-md bg-white font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  Billing adjustments at or above this threshold trigger an automatic dual-control approval request (Section 4). Requester cannot self-approve.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Changes are audited and logged with previous and new values.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Platform Settings
          </button>
        </div>
      </form>

      {/* Maintenance Mode Confirmation Modal */}
      {maintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <Power className={`w-5 h-5 ${settings.maintenanceMode ? "text-emerald-600" : "text-amber-600"}`} />
              <h2 className="text-sm font-bold">
                {settings.maintenanceMode ? "Disable Maintenance Mode" : "Activate Platform Maintenance Mode"}
              </h2>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                {settings.maintenanceMode
                  ? "Disabling maintenance mode will immediately restore platform access to all tenant dashboards, online storefronts, and active cashier terminals."
                  : "Activating maintenance mode will immediately show the maintenance page to all store owners, managers, cashiers, and portal customers. Platform staff retain administrative access."}
              </p>
            </div>

            {!settings.maintenanceMode && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tenant Display Message</label>
                <textarea
                  rows={2}
                  value={maintenanceCustomMsg}
                  onChange={(e) => setMaintenanceCustomMsg(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-md"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mandatory Operational Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Explain the scheduled upgrade, database migration, or incident justification..."
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMaintenanceModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleToggleMaintenance}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors ${
                  settings.maintenanceMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isSubmitting ? "Processing..." : settings.maintenanceMode ? "Confirm Restore Access" : "Confirm Activate Maintenance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

