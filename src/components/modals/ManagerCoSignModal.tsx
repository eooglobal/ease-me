"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { ShieldCheck, Lock, AlertTriangle } from "lucide-react";

export interface ShiftDetailForCoSign {
  id: string;
  cashierName: string;
  registerId: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  cashSales: number;
  cashPayouts: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  varianceReason?: string;
  cashierNotes?: string;
  status: "open" | "closed" | "locked";
}

interface ManagerCoSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftDetailForCoSign | null;
  onCoSign: (input: { shiftId: string; managerName: string; notes: string }) => void;
}

export function ManagerCoSignModal({
  isOpen,
  onClose,
  shift,
  onCoSign,
}: ManagerCoSignModalProps) {
  const [managerName, setManagerName] = useState("Store Manager Adaeze");
  const [managerPin, setManagerPin] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!shift) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!notes.trim()) {
      setError("Please provide a co-signature review note.");
      return;
    }

    if (managerPin !== "1234") {
      setError("Invalid Manager Security PIN. (Default test PIN: 1234)");
      return;
    }

    onCoSign({
      shiftId: shift.id,
      managerName,
      notes: notes.trim(),
    });
    onClose();
  };

  const isShortage = shift.variance < 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manager Shift Co-Signature & Unlock"
      subtitle={`Review register ${shift.registerId} operated by ${shift.cashierName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Shift Reconciliation Summary */}
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Register & Cashier:</span>
            <span className="font-semibold text-slate-900">
              {shift.registerId} — {shift.cashierName}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Opening Float:</span>
            <span className="font-mono font-semibold text-slate-900">
              ₦{shift.openingFloat.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Cash Sales Inflow:</span>
            <span className="font-mono font-semibold text-emerald-700">
              +₦{shift.cashSales.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Cash Payouts:</span>
            <span className="font-mono font-semibold text-slate-700">
              -₦{shift.cashPayouts.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
            <span className="text-slate-800">System Expected Cash:</span>
            <span className="font-mono text-slate-900">
              ₦{shift.expectedCash.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-800">Counted Physical Cash:</span>
            <span className="font-mono text-slate-900">
              ₦{shift.actualCash.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Discrepancy Indicator */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${
            isShortage
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {isShortage ? <AlertTriangle size={15} /> : <ShieldCheck size={15} />}
            <span>{isShortage ? "Cash Shortage Discrepancy" : "Cash Overage Discrepancy"}</span>
          </div>
          <span className="font-mono font-bold text-sm">
            {shift.variance < 0
              ? `-₦${Math.abs(shift.variance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              : `+₦${shift.variance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        {/* Cashier's Explanation */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <span className="text-slate-500 font-medium block">Cashier's Explanation:</span>
          <p className="text-slate-900 italic font-medium">
            "{shift.cashierNotes || shift.varianceReason || "No note entered"}"
          </p>
        </div>

        {/* Manager Inputs */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="font-semibold text-slate-900 block mb-1">
              Co-Signing Manager Name *
            </label>
            <input
              type="text"
              required
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-700 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-900 block mb-1">
              Manager Security PIN *
            </label>
            <input
              type="password"
              required
              maxLength={6}
              placeholder="Enter 4-digit manager PIN (1234)"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tracking-widest text-sm focus:ring-2 focus:ring-indigo-700 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-900 block mb-1">
              Review Findings & Co-Sign Notes *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Investigated discrepancy. Count verified against petty cash receipts. Approved closing."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-700 outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck size={14} />
            <span>Approve & Co-sign Shift</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

