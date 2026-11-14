"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerBusinessAction } from "@/actions/auth-actions";
import {
  Store,
  User,
  Lock,
  Mail,
  Building,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<
    "retail" | "supermarket" | "pharmacy" | "wholesaler" | "other"
  >("retail");
  const [currency, setCurrency] = useState("NGN");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !password || !businessName.trim()) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerBusinessAction({
        name: name.trim(),
        email: email.trim(),
        password,
        businessName: businessName.trim(),
        businessType,
        currency,
        openingCash: 50000,
      });

      if (!res.success) {
        const errObj = "error" in res ? (res as any).error : null;
        setErrorMsg(errObj?.message || "Failed to register account.");
        setIsLoading(false);
        return;
      }

      // Store initial session credentials
      if (typeof window !== "undefined") {
        document.cookie = "ease_me_role=owner; path=/; max-age=86400; SameSite=Lax";
        localStorage.setItem("ease_me_active_role", "owner");
        localStorage.setItem("ease_me_logged_in", "true");
        localStorage.setItem("ease_me_user_email", email.trim());
      }

      router.push("/onboarding");
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred during signup.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-700 text-white shadow-xs mb-3">
          <Store size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Store Account</h1>
        <p className="mt-1 text-xs text-slate-600">
          Owner onboarding for retail, supermarket, pharmacy & wholesale stores
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-xs rounded-lg border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">Full Name</label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chukwuma Obi"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Work Email Address</label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourstore.ng"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">Store / Business Name</label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Alpha Pharmacy & Stores"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Business Vertical</label>
                <select
                  value={businessType}
                  onChange={(e: any) => setBusinessType(e.target.value)}
                  className="mt-1 block w-full px-2.5 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 bg-white"
                >
                  <option value="retail">General Retail</option>
                  <option value="pharmacy">Pharmacy / Meds</option>
                  <option value="supermarket">Supermarket</option>
                  <option value="wholesaler">Wholesale</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 block w-full px-2.5 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 bg-white font-mono"
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GHS">GHS (₵)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-md text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Provisioning Store...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Onboarding</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Already have an account?</span>
            <Link href="/login" className="font-semibold text-indigo-700 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
