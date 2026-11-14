"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { CustomerItem } from "./CustomerRepaymentModal";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customer: CustomerItem) => void;
}

export function AddCustomerModal({ isOpen, onClose, onAdd }: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [limit, setLimit] = useState("50000");
  const [creditTermsDays, setCreditTermsDays] = useState("14");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      phone: phone.trim() || "N/A",
      email: email.trim() || undefined,
      balance: 0,
      limit: parseFloat(limit) || 0,
      creditTermsDays: parseInt(creditTermsDays, 10) || 14,
      status: "Active",
    });

    setName("");
    setPhone("");
    setEmail("");
    setLimit("50000");
    setCreditTermsDays("14");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Customer"
      subtitle="Register customer for credit sales tracking, credit terms, and debt ledgers."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 block">
            Customer / Business Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Alhaji Musa Provisions"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-700 outline-none font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Phone Number (WhatsApp Active) *
            </label>
            <input
              type="tel"
              required
              placeholder="0803 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="customer@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Approved Credit Limit (₦) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-mono">₦</span>
              <input
                type="number"
                min="0"
                step="5000"
                required
                placeholder="50000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold text-xs focus:ring-2 focus:ring-indigo-700 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Repayment Terms (Days) *
            </label>
            <select
              value={creditTermsDays}
              onChange={(e) => setCreditTermsDays(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-700 outline-none"
            >
              <option value="7">7 Days (Weekly)</option>
              <option value="14">14 Days (Bi-weekly)</option>
              <option value="30">30 Days (Monthly)</option>
              <option value="60">60 Days</option>
            </select>
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
            Create Customer Profile
          </button>
        </div>
      </form>
    </Modal>
  );
}
