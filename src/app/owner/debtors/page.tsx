"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  CreditCard,
  Search,
  Filter,
  Download,
  MessageSquare,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { CustomerRepaymentModal, CustomerItem } from "@/components/modals/CustomerRepaymentModal";
import { DebtorService, AgingBuckets } from "@/lib/parties/debtor-service";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

interface DebtorRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  limit: number;
  totalBalance: number;
  lastPaymentDate: string;
  earliestDueDate: string;
  aging: AgingBuckets;
}

export default function OwnerDebtorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bucketFilter, setBucketFilter] = useState("all");
  const [selectedDebtorForRepay, setSelectedDebtorForRepay] = useState<CustomerItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [debtors, setDebtors] = useState<DebtorRow[]>([
    {
      id: "cust-1",
      name: "Alhaji Musa Provisions",
      phone: "0803 555 1204",
      email: "musa@provisions.ng",
      limit: 250000,
      totalBalance: 142000,
      lastPaymentDate: "Nov 4, 2026",
      earliestDueDate: "Nov 11, 2026",
      aging: {
        current: 62000,
        days1To30: 80000,
        days31To60: 0,
        over60Days: 0,
        totalOutstanding: 142000,
      },
    },
    {
      id: "cust-2",
      name: "Mama Nkechi Foodstuffs",
      phone: "0802 119 8832",
      email: "nkechi@foodstuffs.ng",
      limit: 80000,
      totalBalance: 68500,
      lastPaymentDate: "Oct 20, 2026",
      earliestDueDate: "Oct 27, 2026",
      aging: {
        current: 0,
        days1To30: 28500,
        days31To60: 40000,
        over60Days: 0,
        totalOutstanding: 68500,
      },
    },
    {
      id: "cust-3",
      name: "Chukwudi General Hospital Store",
      phone: "0814 882 9901",
      email: "procure@cgh-clinic.ng",
      limit: 500000,
      totalBalance: 480000,
      lastPaymentDate: "Aug 15, 2026",
      earliestDueDate: "Sep 14, 2026",
      aging: {
        current: 80000,
        days1To30: 100000,
        days31To60: 120000,
        over60Days: 180000, // Critical >60 days
        totalOutstanding: 480000,
      },
    },
  ]);

  const handleRepayComplete = (repayment: {
    customerId: string;
    amount: number;
    method: "cash" | "bank" | "card";
  }) => {
    setDebtors((prev) =>
      prev.map((d) => {
        if (d.id !== repayment.customerId) return d;
        const newBalance = Math.max(0, d.totalBalance - repayment.amount);
        return {
          ...d,
          totalBalance: newBalance,
          lastPaymentDate: "Just now",
          aging: {
            ...d.aging,
            totalOutstanding: newBalance,
          },
        };
      })
    );
    triggerToast(`Settlement of ₦${repayment.amount.toLocaleString()} recorded.`);
  };

  const handleSendWhatsAppReminder = (debtor: DebtorRow) => {
    const text = DebtorService.generateWhatsAppStatementText({
      customerName: debtor.name,
      businessName: "Alpha Supermarket & Pharmacy",
      outstandingBalance: debtor.totalBalance,
      dueDate: debtor.earliestDueDate,
      bankName: "Moniepoint MFB / Access Bank",
      accountNumber: "8035551204",
      accountName: "Alpha Retail Stores Ltd",
    });

    const url = DebtorService.buildWhatsAppLink(debtor.phone, text);
    window.open(url, "_blank");
  };

  const filteredDebtors = debtors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm);

    const matchesBucket =
      bucketFilter === "all" ||
      (bucketFilter === "current" && d.aging.current > 0) ||
      (bucketFilter === "1_30" && d.aging.days1To30 > 0) ||
      (bucketFilter === "31_60" && d.aging.days31To60 > 0) ||
      (bucketFilter === "over_60" && d.aging.over60Days > 0);

    return matchesSearch && matchesBucket;
  });

  const totalCurrent = debtors.reduce((acc, d) => acc + d.aging.current, 0);
  const total1To30 = debtors.reduce((acc, d) => acc + d.aging.days1To30, 0);
  const total31To60 = debtors.reduce((acc, d) => acc + d.aging.days31To60, 0);
  const totalOver60 = debtors.reduce((acc, d) => acc + d.aging.over60Days, 0);
  const grandTotal = debtors.reduce((acc, d) => acc + d.totalBalance, 0);

  const handleExportCSV = () => {
    const headers = [
      "Customer Name",
      "Phone",
      "Current (<0d)",
      "1-30 Days",
      "31-60 Days",
      "Over 60 Days",
      "Total Outstanding (NGN)",
      "Earliest Due Date",
      "Last Payment Date",
    ];

    const rows = filteredDebtors.map((d) => [
      d.name,
      d.phone,
      d.aging.current,
      d.aging.days1To30,
      d.aging.days31To60,
      d.aging.over60Days,
      d.totalBalance,
      d.earliestDueDate,
      d.lastPaymentDate,
    ]);

    const csv = buildCSV(headers, rows);
    downloadCSV(`EaseMe_Debtors_Aging_${new Date().toISOString().slice(0, 10)}`, csv);
  };

  return (
    <AppShell
      role="owner"
      userEmail="owner@alpha-retail.ng"
      userName="Chief Oladipo Alabi"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Debtors Aging Schedule</h1>
              <span className="text-[11px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 font-semibold">
                Receivables Risk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aging buckets, credit term due dates, automated WhatsApp collection statements, and settlement recording
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <Link
              href="/owner/customers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <span>Customer Directory</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* High Risk Alert Banner */}
        {totalOver60 > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="text-sm font-bold text-rose-900">
                Action Required: ₦{totalOver60.toLocaleString("en-NG", { minimumFractionDigits: 2 })} Overdue by 60+ Days
              </p>
              <p className="text-rose-800">
                Accounts exceeding 60 days overdue represent severe bad debt exposure. Use the WhatsApp reminder button below to dispatch pre-filled demand statements or restrict further credit extension.
              </p>
            </div>
          </div>
        )}

        {/* 4 Aging Buckets Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Current (Not Due)</span>
            <span className="font-mono text-base font-bold text-slate-900 mt-1 block">
              ₦{totalCurrent.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Within agreed terms</span>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">1–30 Days Overdue</span>
            <span className="font-mono text-base font-bold text-amber-700 mt-1 block">
              ₦{total1To30.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Initial reminder stage</span>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 block">31–60 Days Overdue</span>
            <span className="font-mono text-base font-bold text-orange-700 mt-1 block">
              ₦{total31To60.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Second escalation</span>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-rose-200 bg-rose-50/20 shadow-xs">
            <span className="text-[11px] font-medium text-rose-800 block">60+ Days Overdue</span>
            <span className="font-mono text-base font-bold text-rose-700 mt-1 block">
              ₦{totalOver60.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-rose-600 mt-0.5 block">Critical bad debt risk</span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <span className="text-[11px] font-medium text-slate-300 block">Total Receivables</span>
            <span className="font-mono text-base font-bold text-white mt-1 block">
              ₦{grandTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{debtors.length} active debtors</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={bucketFilter}
              onChange={(e) => setBucketFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-semibold focus:bg-white outline-none"
            >
              <option value="all">All Debtors</option>
              <option value="current">Current (Within Terms)</option>
              <option value="1_30">1–30 Days Overdue</option>
              <option value="31_60">31–60 Days Overdue</option>
              <option value="over_60">60+ Days Overdue (Critical)</option>
            </select>
          </div>
        </div>

        {/* Debtors Aging Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Customer / Phone</th>
                  <th className="px-4 py-3 text-right">Current</th>
                  <th className="px-4 py-3 text-right">1–30 Days</th>
                  <th className="px-4 py-3 text-right">31–60 Days</th>
                  <th className="px-4 py-3 text-right">60+ Days</th>
                  <th className="px-4 py-3 text-right">Total Owed</th>
                  <th className="px-4 py-3">Last Payment</th>
                  <th className="px-4 py-3 text-right">Collection Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDebtors.map((debtor) => {
                  const isCritical = debtor.aging.over60Days > 0;

                  return (
                    <tr
                      key={debtor.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCritical ? "bg-rose-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/owner/customers/${debtor.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
                        >
                          {debtor.name}
                        </Link>
                        <div className="text-[11px] font-mono text-slate-400">{debtor.phone}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {debtor.aging.current > 0
                          ? `₦${debtor.aging.current.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-amber-700 font-medium">
                        {debtor.aging.days1To30 > 0
                          ? `₦${debtor.aging.days1To30.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-orange-700 font-medium">
                        {debtor.aging.days31To60 > 0
                          ? `₦${debtor.aging.days31To60.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-rose-700 font-bold">
                        {debtor.aging.over60Days > 0
                          ? `₦${debtor.aging.over60Days.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ₦{debtor.totalBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <div>{debtor.lastPaymentDate}</div>
                        <div className="text-[10px] text-slate-400">Due: {debtor.earliestDueDate}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendWhatsAppReminder(debtor)}
                            title="Send pre-filled WhatsApp statement"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                          >
                            <MessageSquare size={12} />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() =>
                              setSelectedDebtorForRepay({
                                id: debtor.id,
                                name: debtor.name,
                                phone: debtor.phone,
                                balance: debtor.totalBalance,
                                limit: debtor.limit,
                                status: "Active",
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
                          >
                            <CreditCard size={12} />
                            <span>Settle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Repayment Settlement Modal */}
        <CustomerRepaymentModal
          isOpen={Boolean(selectedDebtorForRepay)}
          onClose={() => setSelectedDebtorForRepay(null)}
          customer={selectedDebtorForRepay}
          onRepay={handleRepayComplete}
        />
      </div>
    </AppShell>
  );
}

