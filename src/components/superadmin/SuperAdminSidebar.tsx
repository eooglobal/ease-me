"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Layers,
  CreditCard,
  FileCheck,
  Megaphone,
  HelpCircle,
  FileText,
  Scale,
  CheckSquare,
  PackagePlus,
  Settings,
  Flag,
  KeyRound,
  Gauge,
  Activity,
  LifeBuoy,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Users,
} from "lucide-react";
import { PlatformRole, ROLE_DISPLAY_NAMES } from "@/lib/superadmin/permission-matrix";
import { PlatformPermissionEngine } from "@/lib/superadmin/permission-engine";

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavLinkItem[];
}

export const SUPERADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { id: "overview", label: "Overview", href: "/superadmin", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", href: "/superadmin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Tenants and Money",
    items: [
      { id: "tenants", label: "Tenants Directory", href: "/superadmin/tenants", icon: Building2 },
      { id: "plans", label: "Plans & Entitlements", href: "/superadmin/plans", icon: Layers },
      { id: "billing", label: "Billing & Webhooks", href: "/superadmin/billing", icon: CreditCard },
      { id: "approvals", label: "Approvals Queue", href: "/superadmin/approvals", icon: FileCheck },
    ],
  },
  {
    title: "Content",
    items: [
      { id: "announcements", label: "Announcements", href: "/superadmin/content/announcements", icon: Megaphone },
      { id: "helpcenter", label: "Help Center", href: "/superadmin/content/helpcenter", icon: HelpCircle },
      { id: "templates", label: "Message Templates", href: "/superadmin/content/templates", icon: FileText },
      { id: "legal", label: "Legal Documents", href: "/superadmin/content/legal", icon: Scale },
      { id: "onboarding", label: "Onboarding Steps", href: "/superadmin/content/onboarding", icon: CheckSquare },
      { id: "presets", label: "Business Presets", href: "/superadmin/content/presets", icon: PackagePlus },
    ],
  },
  {
    title: "Platform",
    items: [
      { id: "settings", label: "Platform Settings", href: "/superadmin/settings", icon: Settings },
      { id: "flags", label: "Feature Flags", href: "/superadmin/flags", icon: Flag },
      { id: "integrations", label: "Integrations & Secrets", href: "/superadmin/integrations", icon: KeyRound },
      { id: "limits", label: "Rate Limits", href: "/superadmin/limits", icon: Gauge },
    ],
  },
  {
    title: "Operations and Safety",
    items: [
      { id: "health", label: "Cloud Services Health", href: "/superadmin/health", icon: Activity },
      { id: "support", label: "Support Tickets", href: "/superadmin/support", icon: LifeBuoy },
      { id: "security", label: "Security Policy & MFA", href: "/superadmin/security", icon: ShieldCheck },
      { id: "audit", label: "Platform Audit Log", href: "/superadmin/audit", icon: ShieldAlert },
      { id: "compliance", label: "Compliance & Deletion", href: "/superadmin/compliance", icon: Lock },
      { id: "staff", label: "Staff Management", href: "/superadmin/staff", icon: Users },
    ],
  },
];

interface SuperAdminSidebarProps {
  currentRole: PlatformRole;
  pendingApprovalsCount?: number;
}

export function SuperAdminSidebar({ currentRole, pendingApprovalsCount = 0 }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const roleMeta = ROLE_DISPLAY_NAMES[currentRole] || ROLE_DISPLAY_NAMES.owner;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-3.5rem)] select-none shrink-0 sticky top-14 z-30">
      {/* Current Role Indicator Strip */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Access Scope</span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${roleMeta.badgeClass}`}
        >
          {roleMeta.label}
        </span>
      </div>

      {/* Nav Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {SUPERADMIN_NAV_SECTIONS.map((section) => {
          // Section 5: Filter items based on user's platform role permissions
          const accessibleItems = section.items.filter((item) =>
            PlatformPermissionEngine.canAccessRoute(currentRole, item.href)
          );

          if (accessibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </h3>

              <div className="space-y-0.5">
                {accessibleItems.map((item) => {
                  const isActive =
                    item.href === "/superadmin"
                      ? pathname === "/superadmin"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-700"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? "text-indigo-700" : "text-slate-500"} />
                        <span>{item.label}</span>
                      </div>

                      {item.id === "approvals" && pendingApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                          {pendingApprovalsCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="font-mono">v1.0 • Crisp Light</span>
        <span className="text-emerald-700 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Control Room Active
        </span>
      </div>
    </aside>
  );
}

