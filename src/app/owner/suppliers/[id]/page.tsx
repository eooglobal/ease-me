"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowLeft,
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  PlusCircle,
  CheckCircle2,
  PackageCheck,
  Receipt,
  Download,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: "purchase" | "payment";
  reference: string;
  debit: number; // Reduces obligation (payment)
  credit: number; // Increases obligation (purchase)
  balanceAfter: number;
  description: string;
}

export default function OwnerSupplierDetailPage() {
  const params = useParams();
  const supplierId = (params?.id as string) || "supp-1";

  const [supplier, setSupplier] = useState({
    id: supplierId,
    name: "Mega Pharmaceuticals Ltd",
    contact: "0803 111 2233",
    email: "orders@megapharma.ng",
    address: "Plot 12, Industrial Avenue, Ikeja, Lagos",
    term: "Net 14",
    leadTimeDays: 3,
    balance: 470000,
  });

  const [ledger, setLedger] = useState<SupplierLedgerEntry[]>([
    {
      id: "s-tx-2",
      date: "Nov 5, 2026, 04:00 PM",
      type: "purchase",
      reference: "PO-20261105-1082",
      debit: 0,
      credit: 470000,
      balanceAfter: 470000,
      description: "Stock received against PO-20261105-1082",
    },
    {
      id: "s-tx-1",
      date: "Oct 25, 2026, 11:30 AM",
      type: "payment",
      reference: "PAY-20261025-01",
      debit: 350000,
      credit: 0,
      balanceAfter: 0,
      description: "Direct bank settlement of invoice INV-Mega-9901",
    },
  ]);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"bank" | "cash">("bank");
  const [payRef, setPayRef] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) return;

    const paymentAmount = Math.min(val, supplier.balance);
    const newBal = Math.max(0, supplier.balance - paymentAmount);

    const newTx: SupplierLedgerEntry = {
      id: `s-tx-${Date.now()}`,
      date: new Date().toLocaleString(),
      type: "payment",
      reference: payRef.trim() || `PAY-${Date.now()}`,
      debit: paymentAmount,
      credit: 0,
      balanceAfter: newBal,
      description: `Payment to ${supplier.name} via ${payMethod.toUpperCase()}`,
    };

    setSupplier((prev) => ({ ...prev, balance: newBal }));
    setLedger((prev) => [newTx, ...prev]);
    setIsPayModalOpen(false);
    setPayAmount("");
    setPayRef("");
    triggerToast(`Payment of ₦${paymentAmount.toLocaleString()} recorded.`);
  };

  return (
    <AppShell
      role="owner"
      userEmail="owner@alpha-retail.ng"
      userName="Chief Oladipo Alabi"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <Link
              href="/owner/suppliers"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-semibold mb-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Suppliers</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{supplier.name}</h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Vendor
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Payment Terms: {supplier.term} • Lead Time: {supplier.leadTimeDays} Days
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/owner/purchases/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Truck size={14} />
              <span>Create Purchase Order</span>
            </Link>

            <button
              onClick={() => setIsPayModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <CreditCard size={14} />
              <span>Record Supplier Payment</span>
            </button>
          </div>
        </div>

        {/* Profile & Obligation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              Vendor Profile &amp; Contact
            </h3>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <span className="font-mono text-slate-900">{supplier.contact}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="text-slate-900">{supplier.email}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="text-slate-900">{supplier.address}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-medium text-slate-500">Current Outstanding Trade Payable</span>
            <div className="text-2xl font-bold font-mono text-rose-700 pt-1">
              ₦{supplier.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {supplier.balance > 0
                ? `Subject to agreed vendor terms (${supplier.term}).`
                : "All supplier invoices are fully reconciled."}
            </p>
          </div>
        </div>

        {/* Supplier Ledger Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Trade Payables Ledger</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical purchases on credit vs cash/bank settlements
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Reference / Description</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Debit (Payment Paid)</th>
                  <th className="px-4 py-3 text-right">Credit (Invoice Added)</th>
                  <th className="px-4 py-3 text-right">Payable Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-600">{tx.date}</td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{tx.description}</div>
                      <div className="text-[11px] font-mono text-slate-400">Ref: {tx.reference}</div>
                    </td>

                    <td className="px-4 py-3">
                      {tx.type === "payment" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span>Settlement</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span>Purchase</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                      {tx.debit > 0
                        ? `-₦${tx.debit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-rose-700">
                      {tx.credit > 0
                        ? `+₦${tx.credit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₦{tx.balanceAfter.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Payment Modal */}
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Record Supplier Payment"
          subtitle={`Disburse payment to ${supplier.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Vendor:</span>
                <span className="font-bold text-slate-900">{supplier.name}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Outstanding Balance:</span>
                <span className="font-mono text-rose-700 text-sm">
                  ₦{supplier.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 block">
                Disbursement Amount (₦) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">₦</span>
                <input
                  type="number"
                  required
                  min="1"
                  max={supplier.balance}
                  step="any"
                  placeholder={`Max: ₦${supplier.balance.toLocaleString()}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold text-sm focus:ring-2 focus:ring-indigo-700 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 block">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-700 outline-none"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash Payment</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 block">Transfer Reference / Teller</label>
                <input
                  type="text"
                  placeholder="e.g. TRF-VENDOR-0982"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-700 outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-xs transition-colors"
              >
                Confirm Disbursement
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}

