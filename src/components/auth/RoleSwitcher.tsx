"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Building2,
  CreditCard,
  User,
  ChevronUp,
  ChevronDown,
  Sparkles,
  LogOut,
  Check,
} from "lucide-react";

export type ActiveRole = "super_admin" | "owner" | "cashier" | "customer";

interface RoleOption {
  id: ActiveRole;
  label: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  email: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "super_admin",
    label: "Super Admin",
    subtitle: "Platform-wide MRR, Tenant Management, Infrastructure",
    badge: "Platform Owner",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    icon: ShieldAlert,
    email: "superadmin@easeme.ng",
  },
  {
    id: "owner",
    label: "Store Owner / Admin",
    subtitle: "Full ERP, POS, WAC Inventory, Staff RBAC & P&L",
    badge: "Merchant Admin",
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Building2,
    email: "owner@alpha-retail.ng",
  },
  {
    id: "cashier",
    label: "Store Cashier",
    subtitle: "Fast POS Checkout, Thermal Receipts, Cost Shielding",
    badge: "POS Terminal",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CreditCard,
    email: "cashier@alpha-retail.ng",
  },
  {
    id: "customer",
    label: "Customer / Debtor",
    subtitle: "Self-Service Debt Ledger, Receipts, Debt Repayment",
    badge: "Buyer Portal",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    icon: User,
    email: "customer@alhajienterprises.ng",
  },
];

interface RoleSwitcherProps {
  currentRole: ActiveRole;
  onSelectRole: (role: ActiveRole) => void;
  onLogout?: () => void;
}

export function RoleSwitcher({ currentRole, onSelectRole, onLogout }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = ROLE_OPTIONS.find((r) => r.id === currentRole) || ROLE_OPTIONS[1];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden font-sans">
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="mb-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-orange-600 text-white">
                <Sparkles size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Role Preview Switcher</h4>
                <p className="text-[10px] text-slate-400">Switch between all 4 dashboards instantly</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Close role switcher"
            >
              <ChevronDown size={15} />
            </button>
          </div>

          {/* List of roles */}
          <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.id === currentRole;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelectRole(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-md border transition-colors flex items-start gap-2.5 ${
                    isSelected
                      ? "bg-orange-50/80 border-orange-400 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                      isSelected ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{opt.label}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{opt.subtitle}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">{opt.email}</p>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 text-orange-600 mt-1">
                      <Check size={15} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          {onLogout && (
            <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Need to test login flow?</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors border border-rose-200"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Pill Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-md shadow-md hover:bg-slate-800 border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
        title="Toggle Role Switcher"
      >
        <div className="p-1 rounded bg-orange-600 text-white">
          <CurrentIcon size={13} />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">View:</span>
            <span className="text-xs font-bold text-white">{currentOption.label}</span>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-white transition-colors ml-0.5">
          {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </div>
      </button>
    </div>
  );
}

