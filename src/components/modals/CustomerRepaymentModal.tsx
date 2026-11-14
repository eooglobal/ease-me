"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Banknote, CreditCard, Building2, UploadCloud, CheckCircle2 } from "lucide-react";

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  balance: number;
  limit: number;
  creditTermsDays?: number;
  status: string;
}

interface CustomerRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerItem | null;
  onRepay: (repayment: {
    customerId: string;
    amount: number;
    method: "cash" | "bank" | "card";
    proofUrl?: string;
    externalReference?: string;
    notes?: string;
  }) => void;
}

export function CustomerRepaymentModal({
  isOpen,
  onClose,
  customer,
  onRepay,
}: CustomerRepaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "bank" | "card">("bank");
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  if (!customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    onRepay({
      customerId: customer.id,
      amount: Math.min(val, customer.balance),
      method,
      proofUrl: proofFile || undefined,
      externalReference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setAmount("");
    setReference("");
    setProofFile(null);
    setNotes("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Debt Repayment"
      subtitle={`Settle outstanding account balance for ${customer.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Customer Balances */}
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Customer:</span>
            <span className="font-bold text-slate-900">{customer.name} ({customer.phone})</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Outstanding Balance:</span>
            <span className="font-bold font-mono text-rose-700 text-sm">
              ₦{customer.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>Approved Limit:</span>
            <span className="font-mono font-semibold">
              ₦{customer.limit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Repayment Amount */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 block">
            Repayment Amount (₦) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">₦</span>
            <input
              type="number"
              required
              min="1"
              max={customer.balance}
              step="any"
              placeholder={`Max full settlement: ₦${customer.balance.toLocaleString()}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold text-sm focus:ring-2 focus:ring-indigo-700 outline-none"
            />
          </div>
        </div>

        {/* Tender Method */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 block">Payment Tender Received</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMethod("cash")}
              className={`p-2 rounded-lg border text-center font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                method === "cash"
                  ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Banknote size={14} />
              <span>Cash In Till</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("bank")}
              className={`p-2 rounded-lg border text-center font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                method === "bank"
                  ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Building2 size={14} />
              <span>Bank Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`p-2 rounded-lg border text-center font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                method === "card"
                  ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <CreditCard size={14} />
              <span>POS Card</span>
            </button>
          </div>
        </div>

        {/* Reference / Proof Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Payment Reference / Teller No
            </label>
            <input
              type="text"
              placeholder="e.g. TRF-902189381"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-700 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Proof of Payment Upload
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:border-indigo-600 bg-slate-50 text-slate-600 text-xs transition-colors">
                <UploadCloud size={14} />
                <span>{proofFile ? "Proof Attached" : "Select Receipt"}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProofFile(file.name);
                    }
                  }}
                />
              </label>
              {proofFile && (
                <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Ready</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 block">Settlement Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="e.g. Received partial bank transfer settlement via Moniepoint POS."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-700 outline-none"
          />
        </div>

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
            className="px-4 py-2 font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Record Repayment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
