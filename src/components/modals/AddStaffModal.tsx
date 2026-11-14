"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { UserPlus, Shield, Mail, AlertCircle, ArrowUpRight } from "lucide-react";
import { SystemRole } from "@/lib/security/permissions";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaff: (data: { userId: string; roleName: SystemRole }) => Promise<void>;
  staffCount?: number;
  maxStaff?: number;
  onUpgradeClick?: () => void;
}

export function AddStaffModal({
  isOpen,
  onClose,
  onAddStaff,
  staffCount,
  maxStaff,
  onUpgradeClick,
}: AddStaffModalProps) {
  const [userId, setUserId] = useState("");
  const [roleName, setRoleName] = useState<SystemRole>("cashier");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isQuotaReached =
    staffCount !== undefined && maxStaff !== undefined && staffCount >= maxStaff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuotaReached) return;
    setError(null);
    if (!userId.trim()) {
      setError("Please provide a user ID or email.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddStaff({
        userId: userId.trim(),
        roleName,
      });
      setUserId("");
      setRoleName("cashier");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to add staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Staff Member to Business"
      subtitle="Grant workspace access with role-based permissions."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {isQuotaReached && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3 text-xs text-amber-900 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-950">
                Staff Account Limit Reached ({staffCount}/{maxStaff} active seats)
              </p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                The Freemium Starter tier is limited to {maxStaff} cashier/staff account. Upgrade to Growth to invite unlimited cashiers, inventory managers, and accountants with isolated permissions.
              </p>
              {onUpgradeClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUpgradeClick();
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                >
                  <span>Explore Growth Plan & Seats</span>
                  <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            User ID or Email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_id or email address"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Role & Permissions Level
          </label>
          <div className="relative">
            <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value as SystemRole)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="cashier">Cashier (POS sales & customer view only)</option>
              <option value="inventory_manager">Inventory Manager (Stock receiving, count & adjustments)</option>
              <option value="accountant">Accountant (Read-only financial reports, P&L, expenses)</option>
              <option value="admin">Admin (Operational management without owner-only settings)</option>
            </select>
          </div>
        </div>

        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Role Capabilities Summary:</p>
          {roleName === "cashier" && (
            <p>• Can record sales and customer payments. Cannot view company profit or expenses.</p>
          )}
          {roleName === "inventory_manager" && (
            <p>• Can receive stock, record damaged items, and submit stock counts. Cannot view sales margins.</p>
          )}
          {roleName === "accountant" && (
            <p>• Read-only access to transaction history, expenses, reconciliation, and profit & loss reports.</p>
          )}
          {roleName === "admin" && (
            <p>• Full day-to-day administrative access to sales, stock, expenses, and reconciliation.</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3.5 rounded-md border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isQuotaReached}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-md font-bold text-xs text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={14} />
            <span>{isSubmitting ? "Assigning..." : isQuotaReached ? "Seat Limit Reached" : "Assign Role"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
