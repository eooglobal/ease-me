"use client";

import React from "react";
import { Banknote, CreditCard, AlertTriangle } from "lucide-react";

interface PaymentDistributionChartProps {
  cashAmount: number;
  bankAmount: number;
  creditAmount: number;
}

export function PaymentDistributionChart({
  cashAmount,
  bankAmount,
  creditAmount,
}: PaymentDistributionChartProps) {
  const total = cashAmount + bankAmount + creditAmount || 1;
  const cashPct = Math.round((cashAmount / total) * 100);
  const bankPct = Math.round((bankAmount / total) * 100);
  const creditPct = Math.max(0, 100 - cashPct - bankPct);

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Collections & Tender Distribution
          </h3>
          <p className="text-[11px] text-slate-500">Breakdown of physical cash, bank transfers, and debtor credit</p>
        </div>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="space-y-2">
        <div className="h-2.5 w-full bg-slate-100 rounded-md overflow-hidden flex">
          <div
            style={{ width: `${cashPct}%` }}
            className="bg-emerald-500 transition-all duration-300 h-full"
            title={`Cash: ${cashPct}%`}
          />
          <div
            style={{ width: `${bankPct}%` }}
            className="bg-blue-500 transition-all duration-300 h-full"
            title={`Bank Transfer: ${bankPct}%`}
          />
          <div
            style={{ width: `${creditPct}%` }}
            className="bg-amber-500 transition-all duration-300 h-full"
            title={`Credit Sales: ${creditPct}%`}
          />
        </div>

        {/* Legend / Metrics List */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* Cash */}
          <div className="p-2 rounded-md bg-slate-50 border border-slate-200/80 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Cash</span>
              </span>
              <span className="text-[10px] font-semibold num-mono text-slate-700">{cashPct}%</span>
            </div>
            <p className="font-bold text-xs text-slate-900 num-mono">₦{cashAmount.toLocaleString()}</p>
          </div>

          {/* Bank */}
          <div className="p-2 rounded-md bg-slate-50 border border-slate-200/80 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Bank</span>
              </span>
              <span className="text-[10px] font-semibold num-mono text-slate-700">{bankPct}%</span>
            </div>
            <p className="font-bold text-xs text-slate-900 num-mono">₦{bankAmount.toLocaleString()}</p>
          </div>

          {/* Credit */}
          <div className="p-2 rounded-md bg-slate-50 border border-slate-200/80 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Credit</span>
              </span>
              <span className="text-[10px] font-semibold num-mono text-slate-700">{creditPct}%</span>
            </div>
            <p className="font-bold text-xs text-slate-900 num-mono">₦{creditAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
