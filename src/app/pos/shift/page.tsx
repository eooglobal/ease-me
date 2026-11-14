"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  LockKeyhole,
  ArrowLeft,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Lock,
  PlusCircle,
  Clock,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { DailyReconciliationModal } from "@/components/modals/DailyReconciliationModal";
import { calculateExpectedCash } from "@/lib/reconciliation/shift-calc";

interface CurrentShiftData {
  id: string;
  registerId: string;
  cashierName: string;
  startTime: string;
  status: "open" | "closed" | "locked";
  openingFloat: number;
  cashSales: number;
  cashRepayments: number;
  cashPayouts: number;
  digitalSales: number;
  actualCash?: number;
  variance?: number;
}

export default function PosShiftPage() {
  const [shift, setShift] = useState<CurrentShiftData>({
    id: "shift-cur-1",
    registerId: "POS-01",
    cashierName: "Adaeze Okon",
    startTime: "08:00 AM Today",
    status: "open",
    openingFloat: 25000,
    cashSales: 184500,
    cashRepayments: 12000,
    cashPayouts: 3500, // Petty cash payout
    digitalSales: 96400, // POS card & bank transfers
  });

  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false);
  const [newOpeningFloat, setNewOpeningFloat] = useState("25000");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const expectedCash = calculateExpectedCash(
    shift.openingFloat,
    shift.cashSales,
    shift.cashRepayments,
    shift.cashPayouts
  );

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFloat = parseFloat(newOpeningFloat) || 0;
    setShift({
      id: `shift-${Date.now()}`,
      registerId: "POS-01",
      cashierName: "Adaeze Okon",
      startTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "open",
      openingFloat: parsedFloat,
      cashSales: 0,
      cashRepayments: 0,
      cashPayouts: 0,
      digitalSales: 0,
    });
    setIsStartShiftOpen(false);
    triggerToast("Shift opened successfully with initial float.");
  };

  const handleReconcileComplete = (summary: {
    declaredCash: number;
    variance: number;
    varianceReason: string;
    notes: string;
  }) => {
    const isLocked = summary.variance < -500;
    setShift((prev) => ({
      ...prev,
      actualCash: summary.declaredCash,
      variance: summary.variance,
      status: isLocked ? "locked" : "closed",
    }));

    if (isLocked) {
      triggerToast("Shift LOCKED: Shortage exceeds ₦500. Manager co-signature required.");
    } else {
      triggerToast(
        `Shift closed successfully (${summary.variance >= 0 ? "Overage" : "Shortage"}: ₦${Math.abs(summary.variance).toLocaleString()})`
      );
    }
  };

  return (
    <AppShell
      role="cashier"
      userEmail="cashier@alpha-retail.ng"
      userName="Adaeze Okon"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shift & Drawer Custody</h1>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  shift.status === "open"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : shift.status === "locked"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {shift.status === "open"
                  ? "Active Open Shift"
                  : shift.status === "locked"
                  ? "Shift Locked (Manager Sign-off Needed)"
                  : "Shift Finalized & Closed"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Terminal: {shift.registerId} • Cashier: {shift.cashierName} • Started: {shift.startTime}
            </p>
          </div>

          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors self-start sm:self-auto"
          >
            <ArrowLeft size={14} />
            <span>Return to Register</span>
          </Link>
        </div>

        {/* Shift Locked Notice */}
        {shift.status === "locked" && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-rose-900">
                Register Shift Locked Due to Cash Shortage (&gt; ₦500)
              </p>
              <p className="text-xs text-rose-800">
                A cash shortage of ₦{Math.abs(shift.variance || 0).toLocaleString()} was recorded during the blind count. Under Section 3 store policy, register operations are frozen until a store manager reviews the drawer discrepancy and co-signs this shift session.
              </p>
            </div>
          </div>
        )}

        {/* Expected Till Balance Hero Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-medium text-slate-500 block">
                Expected Till Cash Balance (System Calculation)
              </span>
              <span className="text-3xl font-bold font-mono text-slate-900">
                ₦{expectedCash.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Formula: Opening Float + Cash Sales + Cash Debt Repayments - Cash Payouts
              </span>
            </div>

            <div className="flex items-center gap-2">
              {shift.status === "open" ? (
                <button
                  onClick={() => setIsReconcileOpen(true)}
                  className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <LockKeyhole size={15} />
                  <span>Begin Blind Cash Count & Close</span>
                </button>
              ) : shift.status === "closed" ? (
                <button
                  onClick={() => setIsStartShiftOpen(true)}
                  className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <PlusCircle size={15} />
                  <span>Start New Shift Session</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500 block">Opening Float</span>
              <span className="font-mono text-sm font-bold text-slate-900 mt-0.5 block">
                ₦{shift.openingFloat.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500 block">Cash Sales Inflow</span>
              <span className="font-mono text-sm font-bold text-emerald-700 mt-0.5 block">
                +₦{shift.cashSales.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500 block">Cash Debt Repayments</span>
              <span className="font-mono text-sm font-bold text-emerald-700 mt-0.5 block">
                +₦{shift.cashRepayments.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500 block">Petty Cash Payouts</span>
              <span className="font-mono text-sm font-bold text-slate-700 mt-0.5 block">
                -₦{shift.cashPayouts.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Digital Collections Information */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Banknote size={15} className="text-slate-400" />
              <span>Digital Collections (POS Card &amp; Bank Transfers - not in physical drawer):</span>
            </div>
            <span className="font-mono font-bold text-slate-900 text-sm">
              ₦{shift.digitalSales.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Start Shift Modal */}
        {isStartShiftOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Start New Register Shift</h3>
                <p className="text-xs text-slate-500">
                  Declare physical opening float provided in register drawer.
                </p>
              </div>

              <form onSubmit={handleStartShift} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-900">Opening Float (₦) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">₦</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={newOpeningFloat}
                      onChange={(e) => setNewOpeningFloat(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold text-sm focus:ring-2 focus:ring-indigo-700 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsStartShiftOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg transition-colors"
                  >
                    Open Register Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Blind Count Daily Reconciliation Modal */}
        <DailyReconciliationModal
          isOpen={isReconcileOpen}
          onClose={() => setIsReconcileOpen(false)}
          expectedCash={expectedCash}
          bankCollections={shift.digitalSales}
          isShiftLocked={shift.status === "locked"}
          onUnlock={() => {
            setShift((prev) => ({ ...prev, status: "closed" }));
            triggerToast("Shift unlocked by supervisor.");
          }}
          onReconcile={handleReconcileComplete}
        />
      </div>
    </AppShell>
  );
}
