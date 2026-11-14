"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth/auth-client";
import {
  Store,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Building2,
  CreditCard,
  User,
  Zap,
} from "lucide-react";

interface DemoAccount {
  role: "super_admin" | "owner" | "manager" | "cashier" | "customer";
  title: string;
  email: string;
  roleBadge: string;
  badgeColor: string;
  desc: string;
  targetRoute: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "super_admin",
    title: "Super Admin",
    email: "superadmin@easeme.ng",
    roleBadge: "Platform Owner",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    desc: "Platform health, tenant provisioning, and global logs",
    targetRoute: "/superadmin",
    icon: ShieldCheck,
  },
  {
    role: "owner",
    title: "Store Owner",
    email: "owner@alpha-retail.ng",
    roleBadge: "Full Merchant ERP",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    desc: "POS, WAC inventory, P&L reports, staff RBAC, billing",
    targetRoute: "/owner",
    icon: Building2,
  },
  {
    role: "manager",
    title: "Store Manager",
    email: "manager@alpha-retail.ng",
    roleBadge: "Daily Operations",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    desc: "Approvals queue, shifts, intake, and staff scheduling",
    targetRoute: "/manager",
    icon: Store,
  },
  {
    role: "cashier",
    title: "Store Cashier",
    email: "cashier@alpha-retail.ng",
    roleBadge: "POS Terminal Only",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    desc: "High-speed checkout, blind shift closing, cost shielded",
    targetRoute: "/pos",
    icon: CreditCard,
  },
  {
    role: "customer",
    title: "Customer / Debtor",
    email: "customer@alhajienterprises.ng",
    roleBadge: "Buyer Portal",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    desc: "Credit ledger, receipt archive & debt repayment proof",
    targetRoute: "/portal",
    icon: User,
  },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const determineTargetRoute = (userEmail: string): string => {
    if (callbackUrl) return callbackUrl;
    const lower = userEmail.toLowerCase();
    if (lower.includes("superadmin") || lower.endsWith("@easeme.ng")) return "/superadmin";
    if (lower.includes("cashier")) return "/pos";
    if (lower.includes("customer")) return "/portal";
    if (lower.includes("manager")) return "/manager";
    return "/owner";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        setErrorMsg(res.error.message || "Invalid credentials. Please verify your email and password.");
        setIsLoading(false);
        return;
      }

      const targetRoute = determineTargetRoute(email);
      const lower = email.toLowerCase();
      let role = "owner";
      if (targetRoute.startsWith("/superadmin")) {
        role = "super_admin";
        if (lower.includes("security")) role = "security";
        else if (lower.includes("finance")) role = "finance";
        else if (lower.includes("auditor")) role = "auditor";
        else if (lower.includes("support")) role = "support_agent";
        else if (lower.includes("content")) role = "content";
      } else if (targetRoute.startsWith("/pos")) {
        role = "cashier";
      } else if (targetRoute.startsWith("/portal")) {
        role = "customer";
      } else if (targetRoute.startsWith("/manager")) {
        role = "manager";
      }

      if (typeof window !== "undefined") {
        document.cookie = `ease_me_role=${role}; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem("ease_me_active_role", role);
        if (targetRoute.startsWith("/superadmin")) {
          localStorage.setItem("ease_me_platform_role", role === "super_admin" ? "owner" : role);
        }
        localStorage.setItem("ease_me_logged_in", "true");
        localStorage.setItem("ease_me_user_email", email.trim());
      }

      router.push(targetRoute);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  };

  const handle1ClickDemo = (account: DemoAccount) => {
    if (typeof window !== "undefined") {
      document.cookie = `ease_me_role=${account.role}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem("ease_me_active_role", account.role);
      localStorage.setItem("ease_me_logged_in", "true");
      localStorage.setItem("ease_me_user_email", account.email);
    }
    router.push(account.targetRoute);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Branding Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-700 text-white shadow-xs mb-3">
          <Store size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ease Me</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-600">
          Daily Business Control, Cash Flow & Multi-Role Inventory System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl space-y-5">
        {/* 1-Click Demo Testing Cards */}
        <div className="bg-white text-slate-900 p-5 rounded-lg shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-700 text-white">
                <Zap size={14} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Role Workspaces Quick-Access
                </h3>
                <p className="text-[11px] text-slate-500">
                  Switch instantly into any role's dedicated landing page
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handle1ClickDemo(acc)}
                  className="flex flex-col text-left p-3 rounded-md border border-slate-200 hover:border-indigo-600 hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} className="text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                        {acc.title}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${acc.badgeColor}`}>
                      {acc.roleBadge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-snug line-clamp-1">
                    {acc.desc}
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-indigo-600 group-hover:underline">
                    <span>{acc.targetRoute}</span>
                    <ArrowRight size={10} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Email & Password Form */}
        <div className="bg-white py-6 px-6 sm:px-8 shadow-xs rounded-lg border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMsg}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.ng"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-medium text-indigo-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-mono"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-xs text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-hidden focus:ring-2 focus:ring-offset-1 focus:ring-indigo-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* New Store Signup CTA */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>New merchant or store owner?</span>
            <Link
              href="/signup"
              className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline flex items-center gap-1"
            >
              <span>Create Store Account</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-600 mb-4">
              For security compliance, staff passwords must be reset by your Store Owner or Admin under <span className="font-semibold">Staff & RBAC</span>.
              Business owners can request a password reset token via platform support.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-xs text-slate-500 font-medium">Loading login workspace...</div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
