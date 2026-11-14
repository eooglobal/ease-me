"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  CheckCircle2,
  Building2,
  DollarSign,
  Package,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Percent,
  Sliders,
  ShieldCheck,
} from "lucide-react";

type OnboardingStep = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);

  // Step 1: Business Profile
  const [businessName, setBusinessName] = useState("Alpha Retail Ltd");
  const [businessType, setBusinessType] = useState("retail");
  const [rcNumber, setRcNumber] = useState("");

  // Step 2: Currency & Tax
  const [currency, setCurrency] = useState("NGN");
  const [taxRate, setTaxRate] = useState("7.5"); // VAT in Nigeria
  const [allowTaxInclusive, setAllowTaxInclusive] = useState(true);

  // Step 3: Initial Inventory / Product
  const [productName, setProductName] = useState("Paracetamol 500mg (Pack of 20)");
  const [productSku, setProductSku] = useState("MED-001");
  const [productCost, setProductCost] = useState("1200.00");
  const [productPrice, setProductPrice] = useState("1800.00");
  const [openingStock, setOpeningStock] = useState("50");

  // Step 4: Setup Checklist & Finalize
  const [checklist, setChecklist] = useState([
    { id: 1, label: "Business Workspace Profile Created", completed: true },
    { id: 2, label: "VAT & Fiscal Currency Configured", completed: true },
    { id: 3, label: "Initial Inventory & WAC Baseline Loaded", completed: true },
    { id: 4, label: "Anti-Theft Cashier Cost Shielding Enabled", completed: true },
  ]);

  const handleFinish = () => {
    router.push("/owner");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-700 text-white shadow-xs mb-2">
            <Store size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Store Setup & Onboarding</h1>
          <p className="text-xs text-slate-500">Configure your store parameters in 4 simple steps</p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs mb-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Business Profile" },
              { num: 2, label: "Tax & Currency" },
              { num: 3, label: "First Inventory" },
              { num: 4, label: "Verification" },
            ].map((s, idx, arr) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                      currentStep === s.num
                        ? "bg-indigo-700 text-white ring-2 ring-indigo-200"
                        : currentStep > s.num
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {currentStep > s.num ? <CheckCircle2 size={14} /> : s.num}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-medium ${
                      currentStep === s.num ? "text-indigo-900 font-semibold" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${currentStep > s.num ? "bg-emerald-500" : "bg-slate-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
          {/* Step 1: Business Profile */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Step 1: Business Identity</h2>
              <p className="text-xs text-slate-500">Confirm the registered name and operational vertical of your store.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Store / Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Operational Category</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 bg-white"
                  >
                    <option value="retail">General Retail</option>
                    <option value="pharmacy">Pharmacy & Meds</option>
                    <option value="supermarket">Supermarket</option>
                    <option value="wholesaler">Wholesale Store</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">RC / CAC Number (Optional)</label>
                  <input
                    type="text"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value)}
                    placeholder="RC-1234567"
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Currency & Tax */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Step 2: Currency & Tax Settings</h2>
              <p className="text-xs text-slate-500">Configure your primary ledger currency and statutory sales tax.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Store Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-2 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 bg-white font-mono"
                  >
                    <option value="NGN">NGN (₦) - Nigerian Naira</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="GHS">GHS (₵) - Ghanaian Cedi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Standard VAT Rate (%)</label>
                  <div className="mt-1 relative rounded-md">
                    <input
                      type="number"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="block w-full pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-md font-mono"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                      %
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Tax-Inclusive Shelf Pricing</p>
                  <p className="text-[11px] text-slate-500">Selling prices shown on shelf tags already include VAT</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowTaxInclusive}
                  onChange={(e) => setAllowTaxInclusive(e.target.checked)}
                  className="rounded-xs text-indigo-700 focus:ring-indigo-600 h-4 w-4"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First Product Intake */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Step 3: Initial Product Intake (WAC Baseline)</h2>
              <p className="text-xs text-slate-500">Add your first SKU to establish initial Weighted Average Cost valuation.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">SKU Code</label>
                  <input
                    type="text"
                    value={productSku}
                    onChange={(e) => setProductSku(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Initial Stock Quantity</label>
                  <input
                    type="number"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Unit Cost Price (WAC Intake)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productCost}
                    onChange={(e) => setProductCost(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Unit Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors"
                >
                  <span>Review Checklist</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Verification Checklist */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Step 4: Readiness Checklist</h2>
              <p className="text-xs text-slate-500">Your store workspace is ready for operational deployment.</p>

              <div className="space-y-2 py-2">
                {checklist.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-md flex items-start gap-3">
                <ShieldCheck size={18} className="text-indigo-700 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900">
                  <span className="font-bold">Ready to Launch:</span> Cashiers will have cost margins strictly hidden, and
                  all sales will enforce the blind drawer reconciliation and atomic movement ledger.
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
                >
                  <span>Launch Store Owner Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

