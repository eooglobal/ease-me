"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  KeyRound,
} from "lucide-react";
import {
  ManagerCoSignModal,
  ShiftDetailForCoSign,
} from "@/components/modals/ManagerCoSignModal";

export default function ManagerShiftsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedShiftForCoSign, setSelectedShiftForCoSign] = useState<ShiftDetailForCoSign | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [shifts, setShifts] = useState<ShiftDetailForCoSign[]>([
    {
      id: "shift-101",
      cashierName: "Adaeze Okon",
      registerId: "POS-01",
      startTime: "Today, 08:00 AM",
      endTime: "Today, 04:30 PM",
      openingFloat: 25000,
      cashSales: 184500,
      cashPayouts: 3500,
      expectedCash: 206000,
      actualCash: 203800,
      variance: -2200,
      varianceReason: "Customer change rounding error and unrecorded ice block purchase",
      cashierNotes: "Petty cash payout for store ice was not entered into register before count.",
      status: "locked",
    },
    {
      id: "shift-102",
      cashierName: "Ibrahim Musa",
      registerId: "POS-02",
      startTime: "Today, 08:15 AM",
      endTime: "Today, 04:45 PM",
      openingFloat: 30000,
      cashSales: 242000,
      cashPayouts: 0,
      expectedCash: 272000,
      actualCash: 271700,
      variance: -300,
      varianceReason: "Customer change ₦300 difference",
      cashierNotes: "Small denomination change shortage.",
      status: "closed",
    },
    {
      id: "shift-103",
      cashierName: "Emeka Chidi",
      registerId: "POS-03",
      startTime: "Today, 09:00 AM",
      endTime: "Today, 05:00 PM",
      openingFloat: 20000,
      cashSales: 310500,
      cashPayouts: 1500,
      expectedCash: 329000,
      actualCash: 329000,
      variance: 0,
      varianceReason: "Balanced",
      cashierNotes: "Shift reconciled perfectly.",
      status: "closed",
    },
  ]);

  const handleCoSignSuccess = ({
    shiftId,
    managerName,
    notes,
  }: {
    shiftId: string;
    managerName: string;
    notes: string;
  }) => {
    setShifts((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              status: "closed",
              cashierNotes: `${s.cashierNotes || ""} [Co-signed by ${managerName}: ${notes}]`,
            }
          : s
      )
    );
    triggerToast(`Shift ${shiftId} successfully co-signed and unlocked.`);
  };

  const filteredShifts = shifts.filter((s) => {
    const matchesSearch =
      s.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "locked" && s.status === "locked") ||
      (statusFilter === "variance" && s.variance !== 0) ||
      (statusFilter === "balanced" && s.variance === 0);
    return matchesSearch && matchesStatus;
  });

  const lockedCount = shifts.filter((s) => s.status === "locked").length;
  const varianceCount = shifts.filter((s) => s.variance !== 0).length;

  return (
    <AppShell
      role="manager"
      userEmail="manager@alpha-retail.ng"
      userName="Chinedu Obi"
      businessName="Alpha Supermarket & Pharmacy"
    >
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shift Reconciliation & Co-Sign</h1>
              {lockedCount > 0 && (
                <span className="text-[11px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 font-semibold flex items-center gap-1">
                  <Lock size={12} />
                  <span>{lockedCount} Locked Shift</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily register custody review, cashier blind count verification, and supervisor co-signatures
            </p>
          </div>

          <Link
            href="/manager"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors self-start sm:self-auto"
          >
            <span>Manager Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Active / Completed Shifts</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{shifts.length}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Across 3 registers today</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Shifts with Discrepancy</span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{varianceCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Requires review note</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Locked Shifts Pending Co-Sign</span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{lockedCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Shortage exceeding ₦500</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search cashier or register ID..."
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
              <option value="all">All Shifts</option>
              <option value="locked">Locked Only (&gt; ₦500)</option>
              <option value="variance">With Discrepancy</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>
        </div>

        {/* Shifts Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Register / Cashier</th>
                  <th className="px-4 py-3">Shift Period</th>
                  <th className="px-4 py-3 text-right">Opening Float</th>
                  <th className="px-4 py-3 text-right">Expected Cash</th>
                  <th className="px-4 py-3 text-right">Actual Count</th>
                  <th className="px-4 py-3 text-right">Variance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShifts.map((shift) => {
                  const hasShortage = shift.variance < 0;
                  const hasOverage = shift.variance > 0;
                  const isLocked = shift.status === "locked";

                  return (
                    <tr
                      key={shift.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLocked ? "bg-rose-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{shift.cashierName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{shift.registerId}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <div>{shift.startTime}</div>
                        <div className="text-[11px] text-slate-400">to {shift.endTime || "Active"}</div>
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
                        ) : hasOverage ? (
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
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock size={11} />
                            <span>Locked</span>
                          </span>
                        ) : shift.variance !== 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle size={11} />
                            <span>Variance</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            <span>Reconciled</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {isLocked ? (
                          <button
                            onClick={() => setSelectedShiftForCoSign(shift)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md transition-colors shadow-xs"
                          >
                            <KeyRound size={12} />
                            <span>Co-Sign</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedShiftForCoSign(shift)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                          >
                            <Eye size={12} />
                            <span>Review</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manager Co-Sign Modal */}
        <ManagerCoSignModal
          isOpen={Boolean(selectedShiftForCoSign)}
          onClose={() => setSelectedShiftForCoSign(null)}
          shift={selectedShiftForCoSign}
          onCoSign={handleCoSignSuccess}
        />
      </div>
    </AppShell>
  );
}

