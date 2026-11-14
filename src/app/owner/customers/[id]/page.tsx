"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  MessageSquare,
  Printer,
  FileCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
} from "lucide-react";
import { CustomerRepaymentModal, CustomerItem } from "@/components/modals/CustomerRepaymentModal";
import { DebtorService } from "@/lib/parties/debtor-service";

interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: "credit_sale" | "repayment";
  reference: string;
  debit: number; // Increases debt
  credit: number; // Reduces debt
  balanceAfter: number;
  description: string;
  proofUrl?: string;
}

export default function OwnerCustomerDetailPage() {
  const params = useParams();
  const customerId = (params?.id as string) || "cust-1";

  const [customer, setCustomer] = useState({
    id: customerId,
    name: "Alhaji Musa Provisions",
    phone: "0803 555 1204",
    email: "musa@provisions.ng",
    address: "Shop 14, Main Market, Trade Fair Complex, Lagos",
    creditLimit: 250000,
    creditTermsDays: 14,
    currentBalance: 142000,
    status: "Active",
  });

  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([
    {
      id: "tx-3",
      date: "Nov 4, 2026, 02:15 PM",
      type: "repayment",
      reference: "TRF-889102",
      debit: 0,
      credit: 50000,
      balanceAfter: 142000,
      description: "Direct bank transfer to Moniepoint account",
      proofUrl: "receipt-889102.pdf",
    },
    {
      id: "tx-2",
      date: "Oct 28, 2026, 11:30 AM",
      type: "credit_sale",
      reference: "INV-20261028-091",
      debit: 112000,
      credit: 0,
      balanceAfter: 192000,
      description: "Credit sale: Royal Stallion Rice 50kg (x2), Eva Water (x10)",
    },
    {
      id: "tx-1",
      date: "Oct 15, 2026, 09:45 AM",
      type: "credit_sale",
      reference: "INV-20261015-044",
      debit: 80000,
      credit: 0,
      balanceAfter: 80000,
      description: "Opening credit sale invoice",
    },
  ]);

  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const headroom = DebtorService.calculateHeadroom(customer.creditLimit, customer.currentBalance);

  const handleRepayment = (repayment: {
    customerId: string;
    amount: number;
    method: "cash" | "bank" | "card";
    proofUrl?: string;
    externalReference?: string;
  }) => {
    const newBalance = Math.max(0, customer.currentBalance - repayment.amount);
    const newEntry: CustomerLedgerEntry = {
      id: `tx-${Date.now()}`,
      date: new Date().toLocaleString(),
      type: "repayment",
      reference: repayment.externalReference || `REC-${Date.now()}`,
      debit: 0,
      credit: repayment.amount,
      balanceAfter: newBalance,
      description: `Debt settlement via ${repayment.method.toUpperCase()}`,
      proofUrl: repayment.proofUrl,
    };

    setCustomer((prev) => ({ ...prev, currentBalance: newBalance }));
    setLedger((prev) => [newEntry, ...prev]);
    triggerToast(`Repayment of ₦${repayment.amount.toLocaleString()} recorded successfully.`);
  };

  // Section 6.1 WhatsApp statement generator
  const handleSendWhatsAppStatement = () => {
    const text = DebtorService.generateWhatsAppStatementText({
      customerName: customer.name,
      businessName: "Alpha Supermarket & Pharmacy",
      outstandingBalance: customer.currentBalance,
      dueDate: `within ${customer.creditTermsDays} days of invoice`,
      bankName: "Moniepoint MFB / Access Bank",
      accountNumber: "8035551204",
      accountName: "Alpha Retail Stores Ltd",
    });

    const url = DebtorService.buildWhatsAppLink(customer.phone, text);
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
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

        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <Link
              href="/owner/customers"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-semibold mb-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Customers</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                {customer.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer Account ID: {customer.id} • Terms: Net {customer.creditTermsDays} Days
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleSendWhatsAppStatement}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
            >
              <MessageSquare size={14} />
              <span>Send WhatsApp Statement</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Printer size={14} />
              <span>Print Statement</span>
            </button>

            <button
              onClick={() => setIsRepayOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <CreditCard size={14} />
              <span>Record Repayment</span>
            </button>
          </div>
        </div>

        {/* Profile & Balances Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contact Details */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              Contact &amp; Account
            </h3>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <span className="font-mono text-slate-900">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="text-slate-900">{customer.email}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="text-slate-900">{customer.address}</span>
            </div>
          </div>

          {/* Credit Limit & Headroom */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-medium text-slate-500 block">Credit Facility &amp; Headroom</span>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs text-slate-600">Approved Limit:</span>
              <span className="font-mono font-semibold text-slate-900 text-sm">
                ₦{customer.creditLimit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-600">Available Headroom:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                ₦{headroom.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-indigo-700 h-full rounded-full transition-all"
                style={{
                  width: `${customer.creditLimit > 0 ? (customer.currentBalance / customer.creditLimit) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">
              Credit Terms: Net {customer.creditTermsDays} Days before aging escalates
            </span>
          </div>

          {/* Current Outstanding Debt Hero */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Current Outstanding Debt</span>
            <div className="text-2xl font-bold font-mono text-rose-700 pt-1">
              ₦{customer.currentBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {customer.currentBalance > 0
                ? "Active balance owed to store. Subject to repayment terms."
                : "Account fully reconciled. No outstanding liability."}
            </p>
          </div>
        </div>

        {/* Statement of Account Ledger */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Statement of Account Ledger</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Append-only financial transaction trail of credit sales and settlements
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{ledger.length} Transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Description / Reference</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Debit (Owed)</th>
                  <th className="px-4 py-3 text-right">Credit (Paid)</th>
                  <th className="px-4 py-3 text-right">Balance After</th>
                  <th className="px-4 py-3 text-center">Proof</th>
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
                      {tx.type === "credit_sale" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span>Credit Sale</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span>Repayment</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-rose-700">
                      {tx.debit > 0
                        ? `+₦${tx.debit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                      {tx.credit > 0
                        ? `-₦${tx.credit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₦{tx.balanceAfter.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {tx.proofUrl ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-700 font-semibold cursor-pointer hover:underline">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Receipt</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Repayment Modal */}
        <CustomerRepaymentModal
          isOpen={isRepayOpen}
          onClose={() => setIsRepayOpen(false)}
          customer={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            balance: customer.currentBalance,
            limit: customer.creditLimit,
            creditTermsDays: customer.creditTermsDays,
            status: customer.status,
          }}
          onRepay={handleRepayment}
        />
      </div>
    </AppShell>
  );
}

