"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Download,
  Eye,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import { CustomerItem } from "@/components/modals/CustomerRepaymentModal";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

interface CustomerViewRow extends CustomerItem {
  totalPurchases: number;
  availableHeadroom: number;
}

export default function OwnerCustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [customers, setCustomers] = useState<CustomerViewRow[]>([
    {
      id: "cust-1",
      name: "Alhaji Musa Provisions",
      phone: "0803 555 1204",
      email: "musa@provisions.ng",
      totalPurchases: 1850000,
      balance: 142000,
      limit: 250000,
      availableHeadroom: 108000,
      creditTermsDays: 14,
      status: "Active",
    },
    {
      id: "cust-2",
      name: "Mama Nkechi Foodstuffs",
      phone: "0802 119 8832",
      email: "nkechi@foodstuffs.ng",
      totalPurchases: 920000,
      balance: 68500,
      limit: 80000,
      availableHeadroom: 11500,
      creditTermsDays: 7,
      status: "Active",
    },
    {
      id: "cust-3",
      name: "Chukwudi General Hospital Store",
      phone: "0814 882 9901",
      email: "procure@cgh-clinic.ng",
      totalPurchases: 4320000,
      balance: 480000,
      limit: 500000,
      availableHeadroom: 20000,
      creditTermsDays: 30,
      status: "Active",
    },
    {
      id: "cust-4",
      name: "Dr. Bamidele Adeyemi",
      phone: "0805 771 2233",
      email: "bamidele@adeyemiclinic.org",
      totalPurchases: 540000,
      balance: 0,
      limit: 100000,
      availableHeadroom: 100000,
      creditTermsDays: 30,
      status: "Active",
    },
  ]);

  const handleAddCustomer = (newCust: CustomerItem) => {
    const headroom = Math.max(0, newCust.limit - newCust.balance);
    const row: CustomerViewRow = {
      ...newCust,
      totalPurchases: 0,
      availableHeadroom: headroom,
    };
    setCustomers((prev) => [row, ...prev]);
    triggerToast(`Customer "${newCust.name}" registered successfully.`);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "debt" && c.balance > 0) ||
      (statusFilter === "clean" && c.balance === 0) ||
      (statusFilter === "near_limit" && c.availableHeadroom < c.limit * 0.2);

    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = customers.reduce((acc, c) => acc + c.balance, 0);
  const totalCreditExtended = customers.reduce((acc, c) => acc + c.limit, 0);

  const handleExportCSV = () => {
    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Total Purchases (NGN)",
      "Current Balance (NGN)",
      "Credit Limit (NGN)",
      "Available Headroom (NGN)",
      "Terms (Days)",
      "Status",
    ];

    const rows = filteredCustomers.map((c) => [
      c.name,
      c.phone,
      c.email || "",
      c.totalPurchases,
      c.balance,
      c.limit,
      c.availableHeadroom,
      c.creditTermsDays || 0,
      c.status,
    ]);

    const csv = buildCSV(headers, rows);
    downloadCSV(`EaseMe_Customers_${new Date().toISOString().slice(0, 10)}`, csv);
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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory & Credit</h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Parties Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer accounts, approved credit limits, available headroom, and purchase history
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
              href="/owner/debtors"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <CreditCard size={14} />
              <span>Debtors Aging Schedule</span>
            </Link>

            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle size={14} />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Customer Accounts</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{customers.length}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Managed ledger accounts</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Outstanding Debt</span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
              ₦{totalOutstanding.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Active receivables balance</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Approved Credit Facility</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ₦{totalCreditExtended.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Maximum store credit ceiling</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-semibold focus:bg-white outline-none"
            >
              <option value="all">All Customers</option>
              <option value="debt">With Outstanding Debt</option>
              <option value="clean">Zero Balance (Clean)</option>
              <option value="near_limit">Near Credit Limit (&lt;20% Headroom)</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Customer Name &amp; Contact</th>
                  <th className="px-4 py-3 text-right">Total Purchases</th>
                  <th className="px-4 py-3 text-right">Current Balance</th>
                  <th className="px-4 py-3 text-right">Credit Limit</th>
                  <th className="px-4 py-3 text-right">Available Headroom</th>
                  <th className="px-4 py-3 text-center">Credit Terms</th>
                  <th className="px-4 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const hasDebt = cust.balance > 0;
                  const headroomPercent = cust.limit > 0 ? (cust.availableHeadroom / cust.limit) * 100 : 100;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{cust.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{cust.phone}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        ₦{cust.totalPurchases.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {hasDebt ? (
                          <span className="text-rose-700">
                            ₦{cust.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">₦0.00</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-900 font-semibold">
                        ₦{cust.limit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-semibold text-slate-900">
                          ₦{cust.availableHeadroom.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {headroomPercent.toFixed(0)}% available
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {cust.creditTermsDays ? `${cust.creditTermsDays} Days` : "Net 14"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/owner/customers/${cust.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-md transition-colors"
                        >
                          <Eye size={12} />
                          <span>Ledger</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onAdd={handleAddCustomer}
        />
      </div>
    </AppShell>
  );
}

