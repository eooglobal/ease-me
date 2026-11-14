"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX,
  KeyRound,
  Edit2,
  Clock,
} from "lucide-react";
import {
  PlatformStaffService,
  StaffMemberRecord,
} from "@/lib/superadmin/staff-service";
import { PlatformRole, ROLE_DISPLAY_NAMES } from "@/lib/superadmin/permission-matrix";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function StaffManagementPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-owner-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [staffList, setStaffList] = useState<StaffMemberRecord[]>(() =>
    PlatformStaffService.listStaff()
  );

  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<PlatformRole>("support_agent");

  // Role Change Modal
  const [selectedStaff, setSelectedStaff] = useState<StaffMemberRecord | null>(null);
  const [targetRole, setTargetRole] = useState<PlatformRole>("support_agent");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const activeOwners = PlatformStaffService.getActiveOwnerCount();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const created = await PlatformStaffService.inviteStaff(
        { name: inviteName, email: inviteEmail, role: inviteRole },
        currentStaff
      );
      setStaffList(PlatformStaffService.listStaff());
      setIsInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setFeedback({
        type: "success",
        message: `Staff invitation issued for ${created.name} (${created.email}) with role ${ROLE_DISPLAY_NAMES[created.role].label}. Mandatory MFA enforced.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to invite staff." });
    }
  };

  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setFeedback(null);

    try {
      const res = await PlatformStaffService.updateStaffRole(
        selectedStaff.id,
        targetRole,
        currentStaff
      );

      setFeedback({
        type: "info",
        message: `Role change for ${selectedStaff.name} submitted to dual-control approval queue (Request ID: ${res.approvalRequestId}). A second Platform Owner or Administrator must approve.`,
      });
      setIsRoleModalOpen(false);
      setSelectedStaff(null);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to submit role change." });
    }
  };

  const handleDeactivate = async (staff: StaffMemberRecord) => {
    if (!confirm(`Are you sure you want to deactivate ${staff.name}? Audit history will stay intact.`)) return;
    setFeedback(null);

    try {
      await PlatformStaffService.deactivateStaff(
        staff.id,
        "Administrative staff deactivation",
        currentStaff
      );
      setStaffList(PlatformStaffService.listStaff());
      setFeedback({ type: "success", message: `${staff.name} has been deactivated. Historical logs preserved.` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to deactivate staff." });
    }
  };

  const handleResetMFA = async (staff: StaffMemberRecord) => {
    if (!confirm(`Reset MFA for ${staff.name}? They will be required to re-configure MFA on next login.`)) return;
    setFeedback(null);

    try {
      await PlatformStaffService.resetStaffMFA(staff.id, currentStaff);
      setStaffList(PlatformStaffService.listStaff());
      setFeedback({ type: "success", message: `MFA reset for ${staff.name}. Action logged to audit trail.` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to reset MFA." });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Platform Staff & Governance</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              {activeOwners} Active Platform Owners
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Invite console operators, manage granular role permissions, enforce mandatory MFA, and safeguard the two-owner lock.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Invite Staff Member
        </button>
      </div>

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
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Safety Invariant Notice Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Section 11 Invariant:</strong> The platform refuses to demote or deactivate the last remaining two Platform Owners. Departing staff are deactivated, never deleted.
          </span>
        </div>
        <span className="font-mono text-[11px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded">
          Active Owners: {activeOwners} / 2 Minimum Lock
        </span>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Staff Name & Email</th>
                <th className="py-2.5 px-3">Platform Role</th>
                <th className="py-2.5 px-3">MFA Status</th>
                <th className="py-2.5 px-3">Account State</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((staff) => {
                const roleMeta = ROLE_DISPLAY_NAMES[staff.role] || { label: staff.role, badgeClass: "bg-slate-100 text-slate-700" };
                const isOwner = staff.role === "owner";
                const isProtectedOwner = isOwner && activeOwners <= 2;

                return (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{staff.name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{staff.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${roleMeta.badgeClass}`}>
                        {roleMeta.label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {staff.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Active (TOTP)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Pending Setup
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {staff.isActive ? (
                        <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : "Never logged in"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setTargetRole(staff.role);
                            setIsRoleModalOpen(true);
                          }}
                          className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[11px] font-semibold"
                        >
                          Change Role
                        </button>

                        <button
                          onClick={() => handleResetMFA(staff)}
                          className="p-1 text-slate-400 hover:text-brand-600 rounded"
                          title="Reset MFA"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {staff.isActive && (
                          <button
                            onClick={() => handleDeactivate(staff)}
                            disabled={isProtectedOwner}
                            className={`p-1 rounded ${
                              isProtectedOwner
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-400 hover:text-rose-600"
                            }`}
                            title={isProtectedOwner ? "Protected: Minimum 2 Platform Owners required" : "Deactivate Staff"}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Users className="w-4 h-4 text-brand-600" />
                <span>Invite Platform Staff Member</span>
              </div>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adebayo Adekunle"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Staff Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="adebayo@easeme.ng"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Platform Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white"
                >
                  {Object.entries(ROLE_DISPLAY_NAMES).map(([roleKey, meta]) => (
                    <option key={roleKey} value={roleKey}>
                      {meta.label} ({roleKey})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[11px] text-slate-600">
                Staff member will receive an invitation token to register their password. Mandatory MFA will be enforced upon first sign-in.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {isRoleModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Edit2 className="w-4 h-4 text-purple-600" />
                <span>Propose Role Change: {selectedStaff.name}</span>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-xs text-purple-900">
              <strong>Dual Control Requirement (Section 6.9):</strong> Role modifications require peer approval. Submitting this will create a pending request in the approvals queue.
            </div>

            <form onSubmit={handleRoleChangeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Role</label>
                <input
                  type="text"
                  disabled
                  value={ROLE_DISPLAY_NAMES[selectedStaff.role].label}
                  className="w-full text-xs p-2 border border-slate-200 bg-slate-100 rounded-md font-medium text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target New Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white font-semibold"
                >
                  {Object.entries(ROLE_DISPLAY_NAMES).map(([roleKey, meta]) => (
                    <option key={roleKey} value={roleKey}>
                      {meta.label} ({roleKey})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

