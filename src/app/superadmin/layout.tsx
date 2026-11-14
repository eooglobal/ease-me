"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SuperAdminTopBar } from "@/components/superadmin/SuperAdminTopBar";
import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";
import { SuperAdminBreadcrumbs } from "@/components/superadmin/SuperAdminBreadcrumbs";
import { SuperAdminGlobalSearch } from "@/components/superadmin/SuperAdminGlobalSearch";
import { PlatformRole, ROLE_DISPLAY_NAMES } from "@/lib/superadmin/permission-matrix";
import { PlatformApprovalEngine } from "@/lib/superadmin/approval-engine";
import { PlatformPermissionEngine } from "@/lib/superadmin/permission-engine";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<PlatformRole>("owner");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(2);

  useEffect(() => {
    // Seed initial mock approval items if needed
    PlatformApprovalEngine.seedSampleData();
    setPendingApprovalsCount(PlatformApprovalEngine.getPendingCount());

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ease_me_platform_role") as PlatformRole;
      if (saved) {
        setCurrentRole(saved);
      }
    }
  }, []);

  const handleRoleChange = (role: PlatformRole) => {
    setCurrentRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("ease_me_platform_role", role);
      // Synchronize role cookie for middleware ("owner" is platform_owner / super_admin)
      const cookieRole = role === "owner" ? "super_admin" : role;
      document.cookie = `ease_me_role=${cookieRole}; path=/; max-age=86400; SameSite=Lax`;
    }
  };

  const hasAccess = PlatformPermissionEngine.canAccessRoute(currentRole, pathname);
  const roleMeta = ROLE_DISPLAY_NAMES[currentRole] || ROLE_DISPLAY_NAMES.owner;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Fixed Slate Top Bar (Section 5) */}
      <SuperAdminTopBar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Layout Body: Fixed Sidebar + Scrollable Content */}
      <div className="flex flex-1">
        <SuperAdminSidebar
          currentRole={currentRole}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Breadcrumbs (Section 5) */}
          <SuperAdminBreadcrumbs />

          {/* Children View or 403 Forbidden Gate */}
          {hasAccess ? (
            children
          ) : (
            <div className="bg-white border border-rose-200 rounded-xl p-8 max-w-xl mx-auto my-12 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Access Restricted by Role Policy</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Your currently active platform role (
                <span className="font-semibold text-slate-800">{roleMeta.label}</span>) does not
                hold the required read permission for <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">{pathname}</code>.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-3">
                <Link
                  href="/superadmin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Command Overview
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Cmd+K Search Modal (Section 5) */}
      <SuperAdminGlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
