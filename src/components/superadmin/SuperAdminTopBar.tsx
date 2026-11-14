"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Search,
  Bell,
  LogOut,
  User,
  CheckCircle2,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { PlatformRole, ROLE_DISPLAY_NAMES } from "@/lib/superadmin/permission-matrix";
import { performSignOut } from "@/lib/auth/auth-client";

interface SuperAdminTopBarProps {
  currentRole: PlatformRole;
  onRoleChange: (newRole: PlatformRole) => void;
  staffName?: string;
  staffEmail?: string;
  pendingApprovalsCount?: number;
  onOpenSearch: () => void;
}

export function SuperAdminTopBar({
  currentRole,
  onRoleChange,
  staffName = "Chidinma Okafor",
  staffEmail = "chidinma.okafor@easeme.ng",
  pendingApprovalsCount = 2,
  onOpenSearch,
}: SuperAdminTopBarProps) {
  const router = useRouter();
  const roleMeta = ROLE_DISPLAY_NAMES[currentRole] || ROLE_DISPLAY_NAMES.owner;

  const handleSignOut = async () => {
    await performSignOut();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 select-none">
      {/* Brand & Console Title */}
      <div className="flex items-center gap-3">
        <Link href="/superadmin" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-indigo-500 transition-colors">
            EM
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              Ease Me Platform Console
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                HQ
              </span>
            </span>
            <span className="text-[10px] text-slate-400">Control Room & CMS</span>
          </div>
        </Link>
      </div>

      {/* Global Search Button (Cmd+K) */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          type="button"
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-400" />
            <span>Search tenants by name, owner email or ID...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Role Simulator, Approvals Badge, User Profile, Sign Out */}
      <div className="flex items-center gap-3">
        {/* Role Selector (Section 3 Testing & Operation) */}
        <div className="relative flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 hidden lg:inline">Role:</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as PlatformRole)}
            className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2.5 py-1 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            title="Switch platform role for permission simulation"
          >
            <option value="owner">Platform Owner</option>
            <option value="admin">Platform Administrator</option>
            <option value="finance">Finance Manager</option>
            <option value="support_lead">Support Lead</option>
            <option value="support_agent">Support Agent</option>
            <option value="content">Content Editor</option>
            <option value="security">Security & Compliance</option>
            <option value="engineer">Platform Engineer</option>
            <option value="auditor">Auditor (Read-Only)</option>
            <option value="analyst">Analyst (Aggregates)</option>
          </select>
        </div>

        {/* Approvals Badge */}
        <Link
          href="/superadmin/approvals"
          className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
          title="Dual Control Approvals Queue"
        >
          <Bell size={13} className="text-amber-400" />
          <span className="hidden sm:inline">Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-slate-950 font-bold">
              {pendingApprovalsCount}
            </span>
          )}
        </Link>

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
            {staffName.charAt(0)}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 leading-tight">{staffName}</span>
            <span className="text-[10px] font-mono text-slate-400">{staffEmail}</span>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          title="Sign out of Platform Console"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

