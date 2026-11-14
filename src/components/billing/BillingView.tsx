"use client";

import React, { useState } from "react";
import {
  Check,
  Shield,
  Zap,
  Sparkles,
  CreditCard,
  Building,
  Users,
  Boxes,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PRICING_TIERS, PlanTierConfig } from "@/lib/subscriptions/pricing-plans";
import { initializeSubscriptionCheckoutAction } from "@/actions/subscription-actions";

interface BillingViewProps {
  currentPlanName?: string;
  isPaidPlan?: boolean;
  productCount?: number;
  staffCount?: number;
  onPlanChanged?: () => void;
  triggerToast: (msg: string) => void;
}

export function BillingView({
  currentPlanName = "Starter",
  isPaidPlan = false,
  productCount = 5,
  staffCount = 1,
  onPlanChanged,
  triggerToast,
}: BillingViewProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "six_months" | "yearly">("monthly");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const normalizedCurrentPlan = currentPlanName.toLowerCase();
  const isStarter = normalizedCurrentPlan.includes("starter") || normalizedCurrentPlan.includes("free");
  const isGrowth = normalizedCurrentPlan.includes("growth") || normalizedCurrentPlan.includes("pro");
  const isBusiness = normalizedCurrentPlan.includes("business");
  const isEnterprise = normalizedCurrentPlan.includes("enterprise");

  const currentMaxProducts = isStarter ? 50 : isGrowth ? 1000 : isBusiness ? 5000 : 100000;
  const currentMaxStaff = isStarter ? 1 : 999;

  const productPercent = Math.min(100, Math.round((productCount / currentMaxProducts) * 100));
  const staffPercent = Math.min(100, Math.round((staffCount / currentMaxStaff) * 100));

  const handleSelectPlan = async (planKey: "growth" | "business" | "enterprise") => {
    setLoadingPlanId(planKey);
    try {
      const res = await initializeSubscriptionCheckoutAction({
        planId: planKey,
        interval: billingCycle,
      });

      if (!res.success) {
        triggerToast(`⚠️ Payment initialization failed: ${(res as any).error?.message || "Please try again"}`);
        setLoadingPlanId(null);
        return;
      }

      if (res.authorizationUrl) {
        // Redirect to Paystack live checkout
        window.location.href = res.authorizationUrl;
      } else if (res.sandbox) {
        // Local sandbox upgrade activated
        triggerToast(`✓ ${res.message || "Plan updated successfully!"}`);
        if (onPlanChanged) onPlanChanged();
      }
    } catch (err: any) {
      triggerToast(`⚠️ Error: ${err?.message || "Could not process plan checkout"}`);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const getPriceDisplay = (tier: PlanTierConfig) => {
    if (tier.monthlyPrice === 0) return "₦0";
    if (billingCycle === "yearly") {
      return `₦${tier.yearlyPrice.toLocaleString()}`;
    }
    if (billingCycle === "six_months") {
      return `₦${tier.sixMonthsPrice.toLocaleString()}`;
    }
    return `₦${tier.monthlyPrice.toLocaleString()}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* SECTION 1: ACTIVE QUOTA & STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Plan Card */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Workspace Plan</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                isPaidPlan ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-orange-50 text-orange-800 border border-orange-200"
              }`}
            >
              {isPaidPlan ? "Paid Plan" : "Freemium"}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{currentPlanName}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isPaidPlan ? "Commercial Operational License" : "Basic Single-Till Shop Plan"}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Automatic Daily Backups & Cloud Sync</span>
          </div>
        </div>

        {/* Product Quota Progress */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Product Inventory Quota</span>
            <span className="text-xs font-semibold num-mono text-slate-700">
              {productCount} / {currentMaxProducts === 100000 ? "Unlimited" : currentMaxProducts}
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  productPercent > 80 ? "bg-amber-500" : "bg-orange-600"
                }`}
                style={{ width: `${productPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 num-mono">
              <span>{productPercent}% used</span>
              <span>{currentMaxProducts - productCount > 0 ? `${currentMaxProducts - productCount} slots left` : "Quota reached"}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 pt-0.5">
            {isStarter ? "Upgrade to Growth to manage up to 1,000 products." : "Catalog limits scale with your active tier."}
          </p>
        </div>

        {/* Team Seats Progress */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Staff Accounts Allowed</span>
            <span className="text-xs font-semibold num-mono text-slate-700">
              {staffCount} / {currentMaxStaff === 999 ? "Unlimited" : currentMaxStaff}
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  staffPercent >= 100 && isStarter ? "bg-amber-500" : "bg-emerald-600"
                }`}
                style={{ width: `${isStarter ? staffPercent : 35}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 num-mono">
              <span>{isStarter ? `${staffCount} of 1 seat used` : "Unlimited Cashiers Active"}</span>
              <span>{isStarter ? "Single till" : "Multi-attendant"}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 pt-0.5">
            {isStarter ? "Upgrade to unlock unlimited cashiers & store managers." : "Multi-attendant RBAC enabled."}
          </p>
        </div>
      </div>

      {/* SECTION 2: PRICING TIERS HEADER */}
      <div className="text-center space-y-2 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
          Commercial Licensing
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Plans built for operational scale
        </h2>
        <p className="text-xs font-medium text-slate-600 max-w-xl mx-auto">
          Transparent Naira billing. Start on our <strong>Freemium Starter Tier</strong> with limited products, or upgrade to a paid tier with instant cloud sync and multi-store support.
        </p>

        {/* Highlights Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Paystack-Secured
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Instant License
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Tenant-Isolated Cloud
          </span>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                billingCycle === "monthly" ? "bg-orange-600 text-white shadow-xs" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("six_months")}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                billingCycle === "six_months" ? "bg-orange-600 text-white shadow-xs" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <span>6 Months</span>
              <span className={`text-[10px] px-1 py-0.2 rounded ${billingCycle === "six_months" ? "bg-orange-700 text-orange-100" : "bg-amber-100 text-amber-800"}`}>
                -10%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                billingCycle === "yearly" ? "bg-orange-600 text-white shadow-xs" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <span>Yearly</span>
              <span className={`text-[10px] px-1 py-0.2 rounded ${billingCycle === "yearly" ? "bg-orange-700 text-orange-100" : "bg-amber-100 text-amber-800"}`}>
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: 4 PRICING CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* TIER 1: STARTER */}
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between relative hover:border-slate-300 transition-colors">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-slate-900">Starter</h3>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">+</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Freemium tier for single-counter retail shops.
              </p>
            </div>

            <div className="pt-1">
              <span className="text-2xl font-bold text-slate-900 num-mono">₦0</span>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Free forever</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700">
              {PRICING_TIERS.starter.highlightList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <Check size={14} className="text-orange-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            {isStarter ? (
              <button
                disabled
                className="w-full py-2 rounded-md font-semibold text-xs bg-slate-100 text-slate-500 border border-slate-200 text-center"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2 rounded-md font-semibold text-xs bg-slate-100 text-slate-400 text-center"
              >
                Included
              </button>
            )}
          </div>
        </div>

        {/* TIER 2: GROWTH (MOST POPULAR) */}
        <div className="bg-white rounded-lg p-5 border-2 border-orange-500 shadow-xs flex flex-col justify-between relative transition-colors">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
            Most Popular
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-slate-900">Growth</h3>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">++</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                For growing businesses with multiple locations.
              </p>
            </div>

            <div className="pt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 num-mono">{getPriceDisplay(PRICING_TIERS.growth)}</span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>
              <p className="text-[10px] font-medium text-orange-600 mt-0.5">
                {billingCycle === "yearly" ? "Billed annually (Save 20%)" : billingCycle === "six_months" ? "Billed bi-annually (Save 10%)" : "Billed monthly"}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700">
              {PRICING_TIERS.growth.highlightList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <Check size={14} className="text-orange-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            {isGrowth ? (
              <button
                disabled
                className="w-full py-2 rounded-md font-semibold text-xs bg-orange-50 text-orange-700 border border-orange-200 text-center"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                type="button"
                disabled={loadingPlanId === "growth"}
                onClick={() => handleSelectPlan("growth")}
                className="w-full py-2.5 rounded-md font-semibold text-xs text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingPlanId === "growth" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Choose Growth</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* TIER 3: BUSINESS */}
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between relative hover:border-slate-300 transition-colors">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-slate-900">Business</h3>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">+++</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Scaling solutions for multi-branch operations.
              </p>
            </div>

            <div className="pt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 num-mono">{getPriceDisplay(PRICING_TIERS.business)}</span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                {billingCycle === "yearly" ? "Billed annually (Save 20%)" : billingCycle === "six_months" ? "Billed bi-annually (Save 10%)" : "Billed monthly"}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700">
              {PRICING_TIERS.business.highlightList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <Check size={14} className="text-orange-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            {isBusiness ? (
              <button
                disabled
                className="w-full py-2 rounded-md font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200 text-center"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                type="button"
                disabled={loadingPlanId === "business"}
                onClick={() => handleSelectPlan("business")}
                className="w-full py-2.5 rounded-md font-semibold text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingPlanId === "business" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Choose Business</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* TIER 4: ENTERPRISE */}
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between relative hover:border-slate-300 transition-colors">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-slate-900">Enterprise</h3>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">MAX</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                High-volume retail chains and warehouses.
              </p>
            </div>

            <div className="pt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 num-mono">{getPriceDisplay(PRICING_TIERS.enterprise)}</span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                {billingCycle === "yearly" ? "Billed annually (Save 20%)" : billingCycle === "six_months" ? "Billed bi-annually (Save 10%)" : "Billed monthly"}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700">
              {PRICING_TIERS.enterprise.highlightList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <Check size={14} className="text-orange-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            {isEnterprise ? (
              <button
                disabled
                className="w-full py-2 rounded-md font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200 text-center"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                type="button"
                disabled={loadingPlanId === "enterprise"}
                onClick={() => handleSelectPlan("enterprise")}
                className="w-full py-2.5 rounded-md font-semibold text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingPlanId === "enterprise" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Choose Enterprise</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
