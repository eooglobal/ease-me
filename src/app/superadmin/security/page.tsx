"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Users,
  Smartphone,
  Clock,
  Globe,
  AlertTriangle,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import {
  PlatformSecurityService,
  SecurityPolicySettings,
  ActiveStaffSession,
  SecurityAlertItem,
} from "@/lib/superadmin/security-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function SuperAdminSecurityPage() {
  const [policy, setPolicy] = useState<SecurityPolicySettings>(() =>
    PlatformSecurityService.getPolicy()
  );
  const [activeSessions, setActiveSessions] = useState<ActiveStaffSession[]>(() =>
    PlatformSecurityService.listActiveSessions()
  );
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>(() =>
    PlatformSecurityService.listAlerts()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  // Simulated active staff context (Security Officer)
  const currentStaff: PlatformStaffContext = {
    id: "usr-sec-01",
    name: "Security Officer",
    email: "security@easeme.ng",
    role: "security",
  };

  const reloadData = () => {
    setPolicy(PlatformSecurityService.getPolicy());
    setActiveSessions(PlatformSecurityService.listActiveSessions());
    setAlerts(PlatformSecurityService.listAlerts());
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await PlatformSecurityService.updatePolicy(policy, currentStaff);
      setFeedback({ type: "success", text: "Security policy parameters updated and logged to audit trail." });
      reloadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update security policy." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleTerminateSession = async (sess: ActiveStaffSession) => {
    if (
      !confirm(
        `Are you sure you want to remotely terminate the active session for ${sess.staffName} (${sess.ipAddress})?`
      )
    ) {
      return;
    }

    setTerminatingId(sess.id);
    try {
      await PlatformSecurityService.terminateSession(
        sess.id,
        `Security officer initiated remote revocation for IP ${sess.ipAddress}`,
        currentStaff
      );
      setFeedback({
        type: "success",
        text: `Active session for ${sess.staffName} revoked. Token blacklisted immediately.`,
      });
      reloadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to revoke session." });
    } finally {
      setTerminatingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Platform Security & Access Hardening
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              MFA Enforced
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 6.10: Mandatory staff MFA, idle session timeouts, IP boundary allowlisting, and
            live token revocation.
          </p>
        </div>

        <button
          onClick={reloadData}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh State
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

      {/* Security Alerts Strip */}
      {alerts.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Security & Authentication Telemetry Alerts ({alerts.length})
          </div>
          <div className="space-y-2">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="bg-white border border-amber-200/80 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-bold tracking-wider ${
                        alt.severity === "high" || alt.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {alt.severity}
                    </span>
                    {alt.description}
                  </div>
                  <div className="text-slate-500 mt-0.5">Target: {alt.target}</div>
                </div>
                <div className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                  {new Date(alt.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Policy Form + Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Security Policy Configuration */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Staff Authentication Policy
            </h2>
          </div>

          <form onSubmit={handleUpdatePolicy} className="space-y-4 text-xs">
            {/* Mandatory MFA */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-900 block">Mandatory MFA for Staff</label>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  FIDO2 / WebAuthn or TOTP required on all platform accounts
                </span>
              </div>
              <input
                type="checkbox"
                checked={policy.mandatoryMfa}
                onChange={(e) => setPolicy({ ...policy, mandatoryMfa: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* Breached Password Rejection */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-900 block">Breached Password Rejection</label>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Verify against HaveIBeenPwned k-Anonymity API
                </span>
              </div>
              <input
                type="checkbox"
                checked={policy.breachedPasswordCheckEnabled}
                onChange={(e) =>
                  setPolicy({ ...policy, breachedPasswordCheckEnabled: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* Session Duration */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Maximum Session Length (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={policy.sessionLengthHours}
                onChange={(e) =>
                  setPolicy({ ...policy, sessionLengthHours: parseInt(e.target.value) || 8 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                After this period, the JWT refresh token expires completely.
              </span>
            </div>

            {/* Idle Timeout */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Idle Screen Lockout (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={policy.idleTimeoutMinutes}
                onChange={(e) =>
                  setPolicy({ ...policy, idleTimeoutMinutes: parseInt(e.target.value) || 15 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Requires re-authentication after inactivity in the tab.
              </span>
            </div>

            {/* IP Allowlist */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-900">Console IP Boundary Allowlist</label>
                <input
                  type="checkbox"
                  checked={policy.ipAllowlistEnabled}
                  onChange={(e) =>
                    setPolicy({ ...policy, ipAllowlistEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                />
              </div>
              <textarea
                rows={3}
                disabled={!policy.ipAllowlistEnabled}
                value={policy.allowedIps.join("\n")}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    allowedIps: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full p-2.5 font-mono text-xs border border-slate-200 rounded-lg disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                placeholder="102.89.0.0/16&#10;197.210.0.0/16"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                One CIDR or IP per line. Staff outside this range are denied console entry.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full mt-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {isSaving ? "Saving Policy..." : "Update Security Policy"}
            </button>
          </form>
        </div>

        {/* Right: Active Staff Sessions */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Live Active Staff Sessions ({activeSessions.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500">Real-time JWT tokens</span>
          </div>

          <div className="divide-y divide-slate-200 flex-1 overflow-y-auto">
            {activeSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-4 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{sess.staffName}</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-mono text-[11px] font-semibold">
                      {sess.staffRole}
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">{sess.staffEmail}</div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" /> {sess.ipAddress} (
                      {sess.location})
                    </span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" /> {sess.userAgent}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Active{" "}
                      {new Date(sess.lastActiveAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleTerminateSession(sess)}
                    disabled={terminatingId === sess.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition shadow-xs disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Remote Sign-out
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
