"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Users, Search, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface CustomerHeadroomRecord {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  currentDebt: number;
  headroom: number;
  status: "active" | "suspended";
}

export default function PosCustomersLookupPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const customers: CustomerHeadroomRecord[] = [
    {
      id: "cust-1",
      name: "Alhaji Danladi Enterprises",
      phone: "0803 123 4567",
      creditLimit: 150000,
      currentDebt: 45000,
      headroom: 105000,
      status: "active",
    },
    {
      id: "cust-2",
      name: "Mrs. Folashade Adeleke",
      phone: "0802 987 6543",
      creditLimit: 50000,
      currentDebt: 48000,
      headroom: 2000,
      status: "active",
    },
    {
      id: "cust-3",
      name: "Emeka & Sons Provisions",
      phone: "0814 555 7788",
      creditLimit: 100000,
      currentDebt: 100000,
      headroom: 0,
      status: "suspended",
    },
    {
      id: "cust-4",
      name: "Mama Nkechi Canteen",
      phone: "0805 111 2233",
      creditLimit: 75000,
      currentDebt: 12500,
      headroom: 62500,
      status: "active",
    },
  ];

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <AppShell role="cashier" userEmail="cashier@alpha-retail.ng" userName="Adaeze Okon" businessName="Alpha Retail Ltd">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Credit Headroom Lookup</h1>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                Protected View
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify customer credit limits and available headroom before issuing goods on credit
            </p>
          </div>

          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Register</span>
          </Link>
        </div>

        {/* Security Shield Banner */}
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md flex items-center gap-2 text-xs text-indigo-900">
          <ShieldCheck size={16} className="text-indigo-700 shrink-0" />
          <span>
            <strong>Frontline Protection:</strong> Cashiers see only credit headroom and operational status. All pricing
            margins and store profits remain shielded.
          </span>
        </div>

        {/* Search Input */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 font-mono"
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4 text-right">Credit Limit</th>
                  <th className="py-2.5 px-4 text-right">Current Debt</th>
                  <th className="py-2.5 px-4 text-right">Available Headroom</th>
                  <th className="py-2.5 px-4 text-center">Credit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const hasHeadroom = c.headroom > 0 && c.status === "active";
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{c.phone}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        ₦{c.creditLimit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        ₦{c.currentDebt.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₦{c.headroom.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            hasHeadroom
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {hasHeadroom ? "Credit Eligible" : "Credit Locked"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

