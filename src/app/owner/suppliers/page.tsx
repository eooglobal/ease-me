"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { AddSupplierModal, SupplierItem } from "@/components/modals/AddSupplierModal";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

interface SupplierViewRow extends SupplierItem {
  totalPurchases: number;
}

export default function OwnerSuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [suppliers, setSuppliers] = useState<SupplierViewRow[]>([
    {
      id: "supp-1",
      name: "Mega Pharmaceuticals Ltd",
      contact: "0803 111 2233",
      email: "orders@megapharma.ng",
      term: "Net 14",
      totalPurchases: 4500000,
      balance: 470000,
    },
    {
      id: "supp-2",
      name: "Olam Grains & Wholesale Nig",
      contact: "0802 444 8899",
      email: "sales@olamgrains.com",
      term: "Net 30",
      totalPurchases: 8200000,
      balance: 1300000,
    },
    {
      id: "supp-3",
      name: "Nestle Consumer Depot",
      contact: "0818 777 6655",
      email: "depot-lagos@nestle.ng",
      term: "Net 14",
      totalPurchases: 2900000,
      balance: 0,
    },
    {
      id: "supp-4",
      name: "Dangote Sugar & Flour Refinery",
      contact: "0809 333 4455",
      email: "b2b@dangotegroup.com",
      term: "Payment on Delivery",
      totalPurchases: 6100000,
      balance: 0,
    },
  ]);

  const handleAddSupplier = (newSupp: SupplierItem) => {
    const row: SupplierViewRow = {
      ...newSupp,
      totalPurchases: 0,
    };
    setSuppliers((prev) => [row, ...prev]);
    triggerToast(`Supplier "${newSupp.name}" registered successfully.`);
  };

  const filteredSuppliers = suppliers.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact.includes(searchTerm) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalPayableObligation = suppliers.reduce((acc, s) => acc + s.balance, 0);
  const totalPurchasesAllTime = suppliers.reduce((acc, s) => acc + s.totalPurchases, 0);

  const handleExportCSV = () => {
    const headers = [
      "Supplier Name",
      "Contact",
      "Email",
      "Payment Terms",
      "Total Purchases (NGN)",
      "Outstanding Payables (NGN)",
    ];

    const rows = filteredSuppliers.map((s) => [
      s.name,
      s.contact,
      s.email || "",
      s.term,
      s.totalPurchases,
      s.balance,
    ]);

    const csv = buildCSV(headers, rows);
    downloadCSV(`EaseMe_Suppliers_${new Date().toISOString().slice(0, 10)}`, csv);
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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Supplier Directory &amp; Payables</h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Vendors
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vendor profiles, trade payment terms, purchase history, and outstanding trade credit obligations
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
              href="/owner/purchases"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Truck size={14} />
              <span>Purchase Orders</span>
            </Link>

            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle size={14} />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Registered Suppliers</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{suppliers.length}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Active trade accounts</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Outstanding Accounts Payable</span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
              ₦{totalPayableObligation.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Store trade credit obligations</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Cumulative Procurement Spend</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ₦{totalPurchasesAllTime.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Total orders all-time</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor name, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Vendor Name</th>
                  <th className="px-4 py-3">Contact &amp; Email</th>
                  <th className="px-4 py-3">Trade Payment Terms</th>
                  <th className="px-4 py-3 text-right">Total Purchases</th>
                  <th className="px-4 py-3 text-right">Payable Balance</th>
                  <th className="px-4 py-3 text-right">Profile &amp; Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((s) => {
                  const hasDebt = s.balance > 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-mono text-slate-900">{s.contact}</div>
                        <div className="text-[11px] text-slate-400">{s.email || "No email"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {s.term}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        ₦{s.totalPurchases.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {hasDebt ? (
                          <span className="text-rose-700">
                            ₦{s.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">₦0.00</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/owner/suppliers/${s.id}`}
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

        {/* Add Supplier Modal */}
        <AddSupplierModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onAdd={handleAddSupplier}
        />
      </div>
    </AppShell>
  );
}

