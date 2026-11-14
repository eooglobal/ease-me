"use client";

import React, { useState } from "react";
import {
  Gauge,
  CheckCircle,
  AlertTriangle,
  Save,
  HelpCircle,
  HardDrive,
  ShieldAlert,
  Terminal,
  Globe,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  PlatformRateLimitService,
  PlatformLimitsData,
} from "@/lib/superadmin/platform-config-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function RateLimitsPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [limits, setLimits] = useState<PlatformLimitsData>(() =>
    PlatformRateLimitService.getLimits()
  );

  const [formData, setFormData] = useState<PlatformLimitsData>(() => ({
    ...limits,
  }));

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updated = await PlatformRateLimitService.updateLimits(
        {
          checkoutTerminalLimit: Number(formData.checkoutTerminalLimit),
          publicPortalLimit: Number(formData.publicPortalLimit),
          authAttemptsLimit: Number(formData.authAttemptsLimit),
          maxUploadSizeMb: Number(formData.maxUploadSizeMb),
          permittedFileTypes: formData.permittedFileTypes,
        },
        currentStaff
      );

      setLimits(updated);
      setFormData(updated);
      setFeedback({
        type: "success",
        message: "Rate limits and upload policies updated dynamically without server restart. Effective immediately.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update platform rate limits." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFileType = (mime: string) => {
    const exists = formData.permittedFileTypes.includes(mime);
    const updated = exists
      ? formData.permittedFileTypes.filter((t) => t !== mime)
      : [...formData.permittedFileTypes, mime];
    setFormData({ ...formData, permittedFileTypes: updated });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Rate Limits & Upload Quotas</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero Redeploy Hot-Reload
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Control terminal checkout capacity, public portal throttling, authentication gates, and media upload boundaries.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs text-slate-700 border border-slate-200">
          <Gauge className="w-3.5 h-3.5 text-indigo-600" />
          <span>Active In-Memory Sliding Window</span>
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

      <form onSubmit={handleSaveLimits} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Checkout Rate Limit */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-slate-900">Checkout Terminal Throttle</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Default: 30 req/min</span>
            </div>

            <p className="text-xs text-slate-600">
              Maximum concurrent checkout receipts per cashier terminal per minute before sliding window holds requests.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Requests per Minute (Safe Bounds: 10 – 120)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                required
                value={formData.checkoutTerminalLimit}
                onChange={(e) =>
                  setFormData({ ...formData, checkoutTerminalLimit: parseInt(e.target.value) || 10 })
                }
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md font-mono"
              />
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
              Effective: <span className="font-semibold text-slate-800">{limits.checkoutTerminalLimit} req/min</span> per cashier machine.
            </div>
          </div>

          {/* Public Portal Rate Limit */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">Public Portal Routes</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Default: 10 req/10s</span>
            </div>

            <p className="text-xs text-slate-600">
              Customer debt statement lookups and invoice verify endpoints per client IP address.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Requests per 10 Seconds per IP (Safe Bounds: 5 – 60)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                required
                value={formData.publicPortalLimit}
                onChange={(e) =>
                  setFormData({ ...formData, publicPortalLimit: parseInt(e.target.value) || 5 })
                }
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md font-mono"
              />
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
              Effective: <span className="font-semibold text-slate-800">{limits.publicPortalLimit} req/10s</span> per IP.
            </div>
          </div>

          {/* Authentication Attempts Limit */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-semibold text-slate-900">Sign-in & Auth Gate</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Default: 5 req/min</span>
            </div>

            <p className="text-xs text-slate-600">
              Protects staff and tenant credentials against credential stuffing and brute-force token enumeration.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Failed Attempts per Minute (Safe Bounds: 3 – 20)
              </label>
              <input
                type="number"
                min="3"
                max="20"
                required
                value={formData.authAttemptsLimit}
                onChange={(e) =>
                  setFormData({ ...formData, authAttemptsLimit: parseInt(e.target.value) || 3 })
                }
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md font-mono"
              />
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
              Effective: <span className="font-semibold text-slate-800">{limits.authAttemptsLimit} attempts/min</span> before lock.
            </div>
          </div>

          {/* File Upload Quotas & Types */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-slate-900">File Upload & Asset Quota</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Default: 10 MB</span>
            </div>

            <p className="text-xs text-slate-600">
              Enforced across product catalog image attachments, customer profile pictures, and PDF receipt uploads.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Max Asset Size in MB (Safe Bounds: 1 – 50 MB)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={formData.maxUploadSizeMb}
                onChange={(e) =>
                  setFormData({ ...formData, maxUploadSizeMb: parseInt(e.target.value) || 1 })
                }
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Permitted MIME Types</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { mime: "image/jpeg", label: "JPEG (.jpg)" },
                  { mime: "image/png", label: "PNG (.png)" },
                  { mime: "image/webp", label: "WebP (.webp)" },
                  { mime: "application/pdf", label: "PDF (.pdf)" },
                  { mime: "text/csv", label: "CSV (.csv)" },
                ].map(({ mime, label }) => {
                  const isChecked = formData.permittedFileTypes.includes(mime);
                  return (
                    <button
                      type="button"
                      key={mime}
                      onClick={() => toggleFileType(mime)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                        isChecked
                          ? "bg-brand-50 text-brand-700 border-brand-300"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {label} {isChecked ? "✓" : "+"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Limits apply instantly in memory to all nodes without restarting or redeploying.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Rate Limits
          </button>
        </div>
      </form>
    </div>
  );
}

