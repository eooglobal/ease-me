"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  CreditCard,
  DollarSign,
  BarChart3,
  CalendarCheck,
  ShieldAlert,
  Settings,
  Receipt,
  FileCheck,
  Building2,
  Clock,
  HelpCircle,
  LogOut,
  User,
  SlidersHorizontal,
  FolderSync,
} from "lucide-react";
import { performSignOut } from "@/lib/auth/auth-client";

export type SystemRole = "owner" | "manager" | "cashier" | "customer" | "super_admin";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

export interface RoleSidebarProps {
  role: SystemRole;
  userEmail?: string;
  userName?: string;
  businessName?: string;
  activePath?: string;
}

export const ROLE_NAV_ITEMS: Record<SystemRole, NavItem[]> = {
  owner: [
    { id: "overview", label: "Overview", href: "/owner", icon: LayoutDashboard },
    { id: "sales", label: "Sales & Orders", href: "/owner/sales", icon: ShoppingCart },
    { id: "inventory", label: "Inventory", href: "/owner/inventory", icon: Boxes },
    { id: "adjustments", label: "Stock Adjustments", href: "/owner/inventory/adjustments", icon: SlidersHorizontal },
    { id: "purchases", label: "Purchases & POs", href: "/owner/purchases", icon: Truck },
    { id: "suppliers", label: "Suppliers", href: "/owner/suppliers", icon: Building2 },
    { id: "customers", label: "Customers", href: "/owner/customers", icon: Users },
    { id: "debtors", label: "Debtors & Aging", href: "/owner/debtors", icon: CreditCard },
    { id: "expenses", label: "Expenses", href: "/owner/expenses", icon: DollarSign },
    { id: "reports", label: "P&L Reports", href: "/owner/reports", icon: BarChart3 },
    { id: "shifts", label: "Shifts & Tills", href: "/owner/shifts", icon: CalendarCheck },
    { id: "staff", label: "Staff & RBAC", href: "/owner/staff", icon: Users },
    { id: "audit", label: "Security Audit", href: "/owner/audit", icon: ShieldAlert },
    { id: "settings", label: "Settings", href: "/owner/settings", icon: Settings },
    { id: "billing", label: "Subscription", href: "/owner/billing", icon: CreditCard },
  ],
  manager: [
    { id: "overview", label: "Operations Board", href: "/manager", icon: LayoutDashboard },
    { id: "approvals", label: "Approvals Queue", href: "/manager/approvals", icon: FileCheck },
    { id: "shifts", label: "Shifts & Till Cash", href: "/manager/shifts", icon: CalendarCheck },
    { id: "inventory", label: "Inventory & Stock", href: "/manager/inventory", icon: Boxes },
    { id: "purchases", label: "Purchases & Orders", href: "/manager/purchases", icon: Truck },
    { id: "customers", label: "Customers & Debt", href: "/manager/customers", icon: Users },
    { id: "sales", label: "Sales & Voids", href: "/manager/sales", icon: ShoppingCart },
    { id: "schedule", label: "Staff Scheduling", href: "/manager/schedule", icon: Clock },
  ],
  cashier: [
    { id: "pos", label: "POS Register", href: "/pos", icon: ShoppingCart },
    { id: "shift", label: "Shift & Drawer Cash", href: "/pos/shift", icon: CalendarCheck },
    { id: "sales", label: "Today's Receipts", href: "/pos/sales", icon: Receipt },
    { id: "customers", label: "Customer Lookup", href: "/pos/customers", icon: Users },
  ],
  customer: [
    { id: "statement", label: "Account Statement", href: "/portal", icon: FileCheck },
    { id: "invoices", label: "Invoices & Receipts", href: "/portal/statements", icon: Receipt },
    { id: "settle", label: "Settle & Proof", href: "/portal/pay", icon: CreditCard },
    { id: "history", label: "Purchase History", href: "/portal/history", icon: ShoppingCart },
  ],
  super_admin: [
    { id: "overview", label: "Platform Overview", href: "/superadmin", icon: LayoutDashboard },
    { id: "tenants", label: "Tenant Workspaces", href: "/superadmin/tenants", icon: Building2 },
    { id: "plans", label: "Subscription Plans", href: "/superadmin/plans", icon: CreditCard },
    { id: "billing", label: "Billing & Webhooks", href: "/superadmin/billing", icon: FolderSync },
    { id: "health", label: "Cloud Services Health", href: "/superadmin/health", icon: Settings },
    { id: "audit", label: "Platform Audit Logs", href: "/superadmin/audit", icon: ShieldAlert },
  ],
};

const ROLE_DISPLAY_NAMES: Record<SystemRole, { title: string; badge: string; badgeClass: string }> = {
  owner: {
    title: "Store Owner",
    badge: "Full ERP",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  manager: {
    title: "Store Manager",
    badge: "Operations",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  cashier: {
    title: "POS Cashier",
    badge: "Terminal",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  customer: {
    title: "Customer Portal",
    badge: "Buyer Tab",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  super_admin: {
    title: "Super Admin",
    badge: "Platform",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export function RoleSidebar({
  role,
  userEmail = "user@easeme.ng",
  userName = "Staff User",
  businessName = "Alpha Retail Ltd",
  activePath,
}: RoleSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = activePath || pathname;
  const items = ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.owner;
  const meta = ROLE_DISPLAY_NAMES[role] || ROLE_DISPLAY_NAMES.owner;

  const handleSignOut = async () => {
    await performSignOut();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 sticky top-0 z-30">
      {/* Brand & Organization Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Store size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-900 truncate tracking-tight">Ease Me</h1>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${meta.badgeClass}`}>
                {meta.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate font-medium">{businessName}</p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="mt-3 flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sync Active
          </span>
          <span className="font-mono text-[11px] text-slate-500">NGN (₦)</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Sidebar Navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || (item.href !== "/owner" && currentPath.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} className={isActive ? "text-indigo-700" : "text-slate-400"} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Session & Sign Out Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{userName}</p>
            <p className="text-[11px] text-slate-500 truncate font-mono">{userEmail}</p>
          </div>
          <Link
            href="/account"
            title="Account Settings"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-colors"
          >
            <User size={14} />
          </Link>
        </div>

        <button
          onClick={handleSignOut}
          type="button"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-md transition-colors"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

