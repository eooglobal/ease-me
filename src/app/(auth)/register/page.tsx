"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerBusinessAction } from "@/actions/auth-actions";
import { signIn } from "@/lib/auth/auth-client";
import {
  Store,
  User,
  Lock,
  Mail,
  Building,
  Coins,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Banknote,
  Phone,
} from "lucide-react";

type OnboardingStep = 1 | 2 | 3;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<
    "retail" | "supermarket" | "pharmacy" | "wholesaler" | "restaurant" | "service" | "other"
  >("retail");
  const [currency, setCurrency] = useState("NGN");
  const [phone, setPhone] = useState("");

  const [openingCash, setOpeningCash] = useState<string>("50000");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validations per step
  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg("Please fill out all user profile fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password should be at least 6 characters long.");
      return;
    }
    setStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!businessName.trim()) {
      setErrorMsg("Business name is required.");
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const parsedOpeningCash = parseFloat(openingCash) || 0;

      // 1. Register business & owner account on server
      const res = await registerBusinessAction({
        name: name.trim(),
        email: email.trim(),
        password,
        businessName: businessName.trim(),
        businessType,
        currency,
        openingCash: parsedOpeningCash,
      });

      if (!res.success) {
        setErrorMsg((res as any).error?.message || "Registration failed. Please check your inputs.");
        setIsLoading(false);
        return;
      }

      // 2. Sign in client session
      await signIn.email({
        email: email.trim(),
        password,
      });

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to complete business registration.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Branding Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-600 text-white shadow-xs mb-3">
          <Store size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ease Me</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-600">
          Create your business workspace in under 2 minutes
        </p>

        {/* Step Indicator */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {[
            { num: 1, label: "Owner" },
            { num: 2, label: "Business" },
            { num: 3, label: "Opening Cash" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step === s.num
                    ? "bg-orange-600 text-white shadow-xs"
                    : step > s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </span>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {s.label}
              </span>
              {s.num < 3 && <span className="w-5 h-0.5 bg-slate-200"></span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-6 shadow-xs border border-slate-200/90 rounded-lg sm:p-8">
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: OWNER ACCOUNT */}
          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="space-y-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Step 1: Account Owner</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  You will have full control as the workspace administrator.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alhaji Bello / Grace Adeyemi"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-md font-bold text-xs text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition-colors"
              >
                <span>Continue to Business Details</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* STEP 2: BUSINESS PROFILE */}
          {step === 2 && (
            <form onSubmit={handleNextFromStep2} className="space-y-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Step 2: Business Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tell us about your store or enterprise.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Business Name
                </label>
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Supermarket & Pharmacy"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="retail">Retail Shop</option>
                    <option value="supermarket">Supermarket</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="wholesaler">Wholesale Store</option>
                    <option value="restaurant">Restaurant / Eatery</option>
                    <option value="service">Service Business</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="NGN">₦ Naira (NGN)</option>
                    <option value="USD">$ Dollar (USD)</option>
                    <option value="GBP">£ Pound (GBP)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="GHS">₵ Cedi (GHS)</option>
                    <option value="KES">KSh Shilling (KES)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Store Contact Phone (Optional)
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2 rounded-md border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-md font-bold text-xs text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition-colors"
                >
                  <span>Continue to Cash Baseline</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OPENING CASH BASELINE */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Step 3: Opening Cash Drawer</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  How much cash is currently in your physical till or safe to start today?
                </p>
              </div>

              <div className="p-3.5 rounded-md bg-orange-50/70 border border-orange-200">
                <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-orange-900">
                  <Banknote size={16} />
                  <span>Physical Cash In Hand</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-600 text-sm">
                    {currency === "NGN" ? "₦" : "$"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 rounded-md border border-orange-300 text-base font-bold text-slate-900 num-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-600 bg-white"
                  />
                </div>
                <p className="text-[11px] text-orange-800 mt-1.5">
                  This sets your initial baseline for daily reconciliation and cash variance calculations.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setStep(2)}
                  className="px-3.5 py-2 rounded-md border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-md font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Creating Business Workspace...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Launch Business Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Already have account */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already registered?{" "}
              <Link href="/login" className="font-bold text-orange-600 hover:text-orange-700">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

