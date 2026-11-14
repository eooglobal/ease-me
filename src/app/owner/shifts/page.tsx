"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Download,
  AlertTriangle,
  ArrowRight,
  Eye,
  KeyRound,
  FileSpreadsheet,
} from "lucide-react";
import { buildCSV, downloadCSV } from "@/lib/export/export-utils";

interface OwnerShiftRow {
  id: string;
  date: string;
  registerId: string;
  cashierName: string;
  openingFloat: number;
  cashSales: number;
  cashPayouts: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  status: "open" | "closed" | "locked";
  managerSignature?: {
    name: string;
    signedAt: string;
    notes: string;
  } | null;
}

export default function OwnerShiftsLedgerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [registerFilter, setRegisterFilter] = useState("all");
  const [varianceOnly, setVarianceOnly] = useState(false);
  const [selectedShift, setSelectedShift] = useState<OwnerShiftRow | null>(null);

  const [shifts, setShifts] = useState<OwnerShiftRow[]>([
    {
      id: "SHF-20261106-01",
      date: "Nov 6, 2026",
      registerId: "POS-01",
      cashierName: "Adaeze Okon",
      openingFloat: 25000,
      cashSales: 184500,
      cashPayouts: 3500,
      expectedCash: 206000,
      actualCash: 203800,
      variance: -2200,
      status: "locked",
      managerSignature: null, // Unsigned shift with shortage!
    },
    {
      id: "SHF-20261106-02",
      date: "Nov 6, 2026",
      registerId: "POS-02",
      cashierName: "Ibrahim Musa",
      openingFloat: 30000,
      cashSales: 242000,
      cashPayouts: 0,
      expectedCash: 272000,
      actualCash: 271700,
      variance: -300,
      status: "closed",
      managerSignature: {
        name: "Chinedu Obi (Manager)",
        signedAt: "Nov 6, 05:12 PM",
        notes: "Small denomination coin rounding noted. Approved.",
      },
    },
    {
      id: "SHF-20261106-03",
      date: "Nov 6, 2026",
      registerId: "POS-03",
      cashierName: "Emeka Chidi",
      openingFloat: 20000,
      cashSales: 310500,
      cashPayouts: 1500,
      expectedCash: 329000,
      actualCash: 329000,
      variance: 0,
      status: "closed",
      managerSignature: {
        name: "Chinedu Obi (Manager)",
        signedAt: "Nov 6, 05:30 PM",
        notes: "Perfect balance.",
      },
    },
    {
      id: "SHF-20261105-01",
      date: "Nov 5, 2026",
      registerId: "POS-01",
      cashierName: "Adaeze Okon",
      openingFloat: 25000,
      cashSales: 210000,
      cashPayouts: 0,
      expectedCash: 235000,
      actualCash: 235450,
      variance: 450,
      status: "closed",
      managerSignature: {
        name: "Chinedu Obi (Manager)",
        signedAt: "Nov 5, 05:15 PM",
        notes: "Minor change overage.",
      },
    },
  ]);

  const filteredShifts = shifts.filter((s) => {
    const matchesSearch =
      s.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegister = registerFilter === "all" || s.registerId === registerFilter;
    const matchesVariance = varianceOnly ? s.variance !== 0 : true;
    return matchesSearch && matchesRegister && matchesVariance;
  });

  const totalVariance = shifts.reduce((acc, s) => acc + s.variance, 0);
  const unsignedVarianceCount = shifts.filter((s) => s.variance !== 0 && !s.managerSignature).length;

  const handleExportCSV = () => {
    const headers = [
      "Shift ID",
      "Date",
      "Register",
      "Cashier",
      "Opening Float",
      "Cash Sales",
      "Cash Payouts",
      "Expected Cash",
      "Counted Cash",
      "Variance",
      "Status",
      "Manager Co-Sign",
    ];

    const rows = filteredShifts.map((s) => [
      s.id,
      s.date,
      s.registerId,
      s.cashierName,
      s.openingFloat,
      s.cashSales,
      s.cashPayouts,
      s.expectedCash,
      s.actualCash,
      s.variance,
      s.status.toUpperCase(),
      s.managerSignature ? `${s.managerSignature.name} (${s.managerSignature.signedAt})` : "UNSIGNED",
    ]);

    const csv = buildCSV(headers, rows);
    downloadCSV(`EaseMe_Shift_Reconciliation_${new Date().toISOString().slice(0, 10)}`, csv);
  };

  return (
    <AppShell
      role="owner"
      userEmail="owner@alpha-retail.ng"
      userName="Chief Oladipo Alabi"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Register Shifts & Reconciliation</h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Audit Trail
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Custody history across all terminals, cash float declarations, drawer variances, and manager signatures
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <Link
              href="/owner"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            >
              <span>Back to Overview</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Attention Panel for Unsigned Shifts */}
        {unsignedVarianceCount > 0 && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-rose-900">
                Action Required: {unsignedVarianceCount} Unsigned Shift with Cash Discrepancy
              </p>
              <p className="text-xs text-rose-800">
                Shifts that closed with a cash shortage or overage require store manager investigation and co-signature. Unsigned shifts remain highlighted until signed.
              </p>
            </div>
          </div>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Total Shift Sessions Recorded</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{shifts.length}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Audit logged</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Net Till Variance</span>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
                totalVariance < 0 ? "text-rose-700" : totalVariance > 0 ? "text-blue-700" : "text-emerald-700"
              }`}
            >
              {totalVariance < 0
                ? `-₦${Math.abs(totalVariance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                : totalVariance > 0
                ? `+₦${totalVariance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                : "₦0.00"}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Cumulative discrepancy</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Unsigned Shifts with Variance</span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{unsignedVarianceCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Requires manager resolution</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search cashier, register, or shift ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-700 outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <select
                value={registerFilter}
                onChange={(e) => setRegisterFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-semibold focus:bg-white outline-none"
              >
                <option value="all">All Registers</option>
                <option value="POS-01">Register POS-01</option>
                <option value="POS-02">Register POS-02</option>
                <option value="POS-03">Register POS-03</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={varianceOnly}
                onChange={(e) => setVarianceOnly(e.target.checked)}
                className="rounded border-slate-300 text-indigo-700 focus:ring-indigo-700"
              />
              <span>Variance Only</span>
            </label>
          </div>
        </div>

        {/* Shift Sessions Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Shift ID / Date</th>
                  <th className="px-4 py-3">Terminal & Cashier</th>
                  <th className="px-4 py-3 text-right">Float</th>
                  <th className="px-4 py-3 text-right">Expected</th>
                  <th className="px-4 py-3 text-right">Counted</th>
                  <th className="px-4 py-3 text-right">Variance</th>
                  <th className="px-4 py-3">Manager Co-Sign</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShifts.map((shift) => {
                  const hasDiscrepancy = shift.variance !== 0;
                  const isUnsignedDiscrepancy = hasDiscrepancy && !shift.managerSignature;

                  return (
                    <tr
                      key={shift.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isUnsignedDiscrepancy ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-slate-900">{shift.id}</div>
                        <div className="text-[11px] text-slate-400">{shift.date}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{shift.cashierName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{shift.registerId}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        ₦{shift.openingFloat.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                        ₦{shift.expectedCash.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                        ₦{shift.actualCash.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {shift.variance === 0 ? (
                          <span className="text-emerald-700 font-medium">Balanced</span>
                        ) : shift.variance > 0 ? (
                          <span className="text-blue-700">
                            +₦{shift.variance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-rose-700">
                            -₦{Math.abs(shift.variance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {shift.managerSignature ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 size={12} />
                              <span>{shift.managerSignature.name}</span>
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {shift.managerSignature.signedAt}
                            </div>
                          </div>
                        ) : hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            <ShieldAlert size={11} />
                            <span>Unsigned Discrepancy</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">No variance</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedShift(shift)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                        >
                          <Eye size={12} />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shift Audit Drawer */}
        {selectedShift && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end">
            <div className="bg-white h-full w-full max-w-md shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Shift Custody Audit</h2>
                    <span className="text-xs font-mono text-slate-500">#{selectedShift.id}</span>
                  </div>
                  <button
                    onClick={() => setSelectedShift(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Session:</span>
                    <span className="font-medium text-slate-900">{selectedShift.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cashier:</span>
                    <span className="font-semibold text-slate-900">{selectedShift.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Register Terminal:</span>
                    <span className="font-mono text-slate-900">{selectedShift.registerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shift Status:</span>
                    <span
                      className={`font-semibold uppercase text-[11px] px-2 py-0.5 rounded-full border ${
                        selectedShift.status === "locked"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {selectedShift.status}
                    </span>
                  </div>
                </div>

                {/* Financial Drawer Reconciliation */}
                <div className="space-y-2 text-xs">
                  <h3 className="font-bold text-slate-900 text-xs">Drawer Reconciliation</h3>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Opening Float:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        ₦{selectedShift.openingFloat.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Cash Sales:</span>
                      <span className="font-mono font-semibold text-emerald-700">
                        +₦{selectedShift.cashSales.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Cash Payouts:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        -₦{selectedShift.cashPayouts.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                      <span>System Expected Cash:</span>
                      <span className="font-mono">
                        ₦{selectedShift.expectedCash.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Cashier Counted Cash:</span>
                      <span className="font-mono">
                        ₦{selectedShift.actualCash.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div
                      className={`pt-2 border-t border-slate-100 flex justify-between font-bold ${
                        selectedShift.variance < 0 ? "text-rose-700" : selectedShift.variance > 0 ? "text-blue-700" : "text-emerald-700"
                      }`}
                    >
                      <span>Final Drawer Variance:</span>
                      <span className="font-mono">
                        {selectedShift.variance === 0
                          ? "₦0.00 (Balanced)"
                          : selectedShift.variance > 0
                          ? `+₦${selectedShift.variance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                          : `-₦${Math.abs(selectedShift.variance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manager Co-Signature Information */}
                <div className="space-y-2 text-xs">
                  <h3 className="font-bold text-slate-900 text-xs">Manager Co-Signature Review</h3>
                  {selectedShift.managerSignature ? (
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Signed by {selectedShift.managerSignature.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Signed: {selectedShift.managerSignature.signedAt}
                      </div>
                      <p className="text-slate-800 italic pt-1 font-medium">
                        "{selectedShift.managerSignature.notes}"
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900">
                        <AlertTriangle size={14} className="text-rose-600" />
                        <span>Unsigned Discrepancy</span>
                      </div>
                      <p className="text-rose-800 text-[11px]">
                        This shift closed with an unresolved variance and has not yet been co-signed by an authorized store manager.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedShift(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

