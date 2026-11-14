"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Lock, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Laptop, Smartphone } from "lucide-react";

export default function AccountPage() {
  const [name, setName] = useState("Chukwuma Obi");
  const [email] = useState("owner@alpha-retail.ng");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!currentPassword || !newPassword) {
      setStatusMsg({ type: "error", text: "Please enter your current and new password." });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatusMsg({ type: "success", text: "Your password has been securely updated." });
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Return */}
        <div className="flex items-center justify-between">
          <Link
            href="/owner"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Workspace</span>
          </Link>
          <span className="text-xs text-slate-500 font-medium">Account & Security</span>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`p-3 rounded-md flex items-center gap-2 text-xs border ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Profile</h2>
              <p className="text-xs text-slate-500">Your personal identity in the store organization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address (Fixed)</label>
              <input
                type="text"
                disabled
                value={email}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-500">Update your sign-in credentials</p>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>

        {/* Active Sessions Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Sessions</h2>
              <p className="text-xs text-slate-500">Devices currently authenticated to your account</p>
            </div>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              1 Active
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-600">
                <Laptop size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">Current Web Session (Windows / Chrome)</p>
                <p className="text-[11px] font-mono text-slate-500">IP: 127.0.0.1 • Lagos, Nigeria</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              This Device
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

