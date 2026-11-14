"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Lock, ShieldAlert, CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";

interface DailyReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedCash: number;
  bankCollections?: number;
  isShiftLocked: boolean;
  onReconcile: (summary: {
    declaredCash: number;
    variance: number;
    varianceReason: string;
    notes: string;
  }) => void;
  onUnlock?: () => void;
}

export function DailyReconciliationModal({
  isOpen,
  onClose,
  expectedCash,
  bankCollections = 0,
  isShiftLocked,
  onReconcile,
  onUnlock,
}: DailyReconciliationModalProps) {
  const [actualCash, setActualCash] = useState("");
  const [note, setNote] = useState("");
  const [varianceReason, setVarianceReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const parsedActual = parseFloat(actualCash) || 0;
  const variance = actualCash !== "" ? parsedActual - expectedCash : null;
  const isShortage = variance !== null && variance < -0.01;
  const isSevereShortage = variance !== null && variance < -500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (actualCash === "") {
      setValidationError("Please enter the total physical cash counted in drawer.");
      return;
    }

    // Section 3: Any shortage requires a written note
    if (isShortage && !note.trim() && !varianceReason.trim()) {
      setValidationError("A written note explaining the cash shortage is mandatory before finalizing.");
      return;
    }

    onReconcile({
      declaredCash: parsedActual,
      variance: variance || 0,
      varianceReason:
        variance !== null && variance !== 0
          ? varianceReason || (variance > 0 ? "Cash Overage" : "Cash Shortage")
          : "Balanced",
      notes: note.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End-of-Day Register Reconciliation"
      subtitle="Blind cash drawer count and shift finalization"
      maxWidth="md"
    >
      <div className="space-y-4 text-sm">
        {isShiftLocked ? (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Lock size={16} />
              <span>Shift is Locked Pending Manager Co-signature</span>
            </div>
            <p className="text-amber-800 text-xs">
              This shift ended with a shortage exceeding ₦500 or was locked upon closing. A store manager or owner must review the drawer variance and provide co-signature to unlock.
            </p>
            {onUnlock && (
              <button
                type="button"
                onClick={() => {
                  onUnlock();
                  onClose();
                }}
                className="w-full py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-md transition-colors text-xs flex items-center justify-center gap-1.5"
              >
                <KeyRound size={14} />
                <span>Manager Co-sign & Unlock</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              <p className="font-medium text-slate-700">Blind Count Protocol</p>
              <p className="mt-0.5">
                Count all physical currency (notes and coins) present in the register drawer and enter the total below.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 text-xs">
                Physical Cash in Drawer (₦) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">₦</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={actualCash}
                  onChange={(e) => {
                    setActualCash(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-base font-semibold focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 outline-none"
                />
              </div>
            </div>

            {/* Post-Count Variance Feedback */}
            {variance !== null && (
              <div
                className={`p-3 rounded-lg border flex flex-col gap-2 ${
                  Math.abs(variance) < 0.01
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : variance > 0
                    ? "bg-blue-50 border-blue-200 text-blue-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    {Math.abs(variance) < 0.01 ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : variance > 0 ? (
                      <ShieldAlert size={16} className="text-blue-600" />
                    ) : (
                      <AlertTriangle size={16} className="text-rose-600" />
                    )}
                    <span>
                      {Math.abs(variance) < 0.01
                        ? "Drawer Balanced"
                        : variance > 0
                        ? "Cash Overage Detected"
                        : "Cash Shortage Detected"}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm">
                    {variance > 0
                      ? `+₦${variance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                      : variance < 0
                      ? `-₦${Math.abs(variance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                      : "₦0.00"}
                  </span>
                </div>

                {isSevereShortage && (
                  <p className="text-[11px] font-medium text-rose-800">
                    Warning: Shortage exceeds ₦500. This shift will lock upon submission and require a manager co-signature.
                  </p>
                )}
              </div>
            )}

            {isShortage && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 text-xs">
                  Reason for Shortage <span className="text-rose-600 font-bold">*</span>
                </label>
                <select
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-700 outline-none"
                >
                  <option value="">Select a reason...</option>
                  <option value="Customer change rounding error">Customer change rounding error</option>
                  <option value="Unrecorded petty cash payout">Unrecorded petty cash payout</option>
                  <option value="Till miscount at opening float">Till miscount at opening float</option>
                  <option value="Suspected theft / loss">Suspected theft / loss</option>
                  <option value="Other">Other (explain below)</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 text-xs">
                Handover Notes {isShortage && <span className="text-rose-600 font-bold">*</span>}
              </label>
              <textarea
                rows={2}
                placeholder={
                  isShortage
                    ? "Mandatory note explaining the drawer shortage..."
                    : "Optional shift handover comments..."
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-700 outline-none"
              />
            </div>

            {validationError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                {validationError}
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Lock size={14} />
                <span>Finalize & Close Shift</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
