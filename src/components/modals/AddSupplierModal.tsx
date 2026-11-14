"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";

export interface SupplierItem {
  id: string;
  name: string;
  contact: string;
  email?: string;
  balance: number;
  term: string;
  leadTimeDays?: number;
}

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (supplier: SupplierItem) => void;
}

export function AddSupplierModal({ isOpen, onClose, onAdd }: AddSupplierModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [term, setTerm] = useState("Net 14");
  const [initialBalance, setInitialBalance] = useState("0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      contact: contact.trim() || "N/A",
      email: email.trim() || undefined,
      balance: parseFloat(initialBalance) || 0,
      term,
    });

    setName("");
    setContact("");
    setEmail("");
    setInitialBalance("0");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Supplier"
      subtitle="Register vendor for purchase orders, trade credit terms, and payables tracking."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 block">
            Supplier / Vendor Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Mega Pharmaceuticals Ltd"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-700 outline-none font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Contact Phone / Rep *
            </label>
            <input
              type="text"
              required
              placeholder="0803 000 0000"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Email Address
            </label>
            <input
              type="email"
              placeholder="orders@vendor.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Trade Payment Terms *
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-700 outline-none"
            >
              <option value="Net 7">Net 7 Days</option>
              <option value="Net 14">Net 14 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="Payment on Delivery">Payment on Delivery (COD)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Opening Payable Balance (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-mono">₦</span>
              <input
                type="number"
                min="0"
                step="any"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold text-xs focus:ring-2 focus:ring-indigo-700 outline-none"
              />
            </div>
          </div>
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
            className="px-4 py-2 font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-xs transition-colors"
          >
            Register Supplier
          </button>
        </div>
      </form>
    </Modal>
  );
}
