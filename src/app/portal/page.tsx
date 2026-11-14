"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileCheck,
  CreditCard,
  Receipt,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { CustomerPortalAccount, CustomerPortalService } from "@/lib/parties/customer-portal-service";

export default function CustomerPortalOverviewPage() {
  const [copiedBank, setCopiedBank] = useState(false);

  const account: CustomerPortalAccount = {
    id: "cust-1",
    name: "Alhaji Musa Enterprises",
    phone: "0803 555 1204",
    email: "musa@provisions.ng",
    storeName: "Ease Me Provisions & Supermarket Ltd",
    bankAccount: {
      bankName: "Guaranty Trust Bank (GTBank)",
      accountNumber: "0123456789",
      accountName: "Ease Me Supermarket Operating Account",
    },
    creditLimit: 250000,
    outstandingBalance: 142000,
    availableHeadroom: 108000,
    creditTermsDays: 14,
    nextDueDate: "Nov 20, 2026",
    isOverdue: false,
    overdueDays: 0,
  };

  const recentTransactions = [
    {
      id: "TX-1092",
      date: "Nov 06, 2026",
      desc: "Wholesale Groceries Supply (Semi-Bulk)",
      amount: -45000,
      balanceAfter: 142000,
      type: "credit",
    },
    {
      id: "REP-882",
      date: "Nov 02, 2026",
      desc: "Bank Transfer Repayment (GTB/TRF/98124)",
      amount: 50000,
      balanceAfter: 97000,
      type: "payment",
    },
    {
      id: "TX-1045",
      date: "Oct 28, 2026",
      desc: "Dangote Sugar & Flour Stock Purchase",
      amount: -97000,
      balanceAfter: 147000,
      type: "credit",
    },
  ];

  const handleCopyAccount = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(account.bankAccount.accountNumber);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
    }
  };

  return (
    <AppShell role="customer">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Account Portal</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Active Credit Line
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome, <strong className="text-slate-700">{account.name}</strong> · Account ID: {account.id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/portal/pay"
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CreditCard size={14} />
              <span>Settle Balance</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Standing KPI Cards (Section 6.4: Outstanding balance, credit limit, available headroom, next due date) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Outstanding Balance */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Outstanding Balance
                </span>
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                  ₦{account.outstandingBalance.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Total accrued credit to settle</div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Within Terms
                </span>
              </div>
            </div>

            {/* Approved Credit Limit */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Approved Credit Limit
                </span>
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                  ₦{account.creditLimit.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Authorized store facility</div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Terms</span>
                <span className="font-semibold text-slate-700">{account.creditTermsDays} days</span>
              </div>
            </div>

            {/* Available Headroom */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Available Headroom
                </span>
                <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums mt-1">
                  ₦{account.availableHeadroom.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Remaining credit allowance</div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Facility usage</span>
                <span className="font-mono font-semibold text-slate-700">
                  {Math.round((account.outstandingBalance / account.creditLimit) * 100)}%
                </span>
              </div>
            </div>

            {/* Next Due Date */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Next Due Date</span>
                <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <span>{account.nextDueDate}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Standard settlement cycle</div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Settlement</span>
                <Link
                  href="/portal/pay"
                  className="font-semibold text-indigo-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Pay Now</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Bank Transfer Reassurance Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Direct Store Bank Details for Settlements</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transfer directly to the registered store account and submit your receipt for instant clearance.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <span className="font-semibold text-slate-800">{account.bankAccount.bankName}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {account.bankAccount.accountNumber}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600">{account.bankAccount.accountName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyAccount}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Copy size={13} />
                <span>{copiedBank ? "Copied!" : "Copy Account #"}</span>
              </button>
              <Link
                href="/portal/pay"
                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Upload Proof</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Recent Ledger Statements */}
          <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Account Activity</h2>
                <p className="text-xs text-slate-500">Your latest purchases and credited payments</p>
              </div>

              <Link
                href="/portal/statements"
                className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-0.5"
              >
                <span>Full Itemised Statement</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{tx.desc}</span>
                      <span className="text-[11px] font-mono text-slate-400">{tx.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{tx.date}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono tabular-nums font-bold text-sm ${
                        tx.type === "payment" ? "text-emerald-700" : "text-slate-900"
                      }`}
                    >
                      {tx.type === "payment" ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Balance: ₦{tx.balanceAfter.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}
