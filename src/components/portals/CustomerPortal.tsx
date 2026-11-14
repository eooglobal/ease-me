"use client";

import React, { useState } from "react";
import {
  User,
  CreditCard,
  Receipt,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  LogOut,
  Building,
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  History,
} from "lucide-react";
import { ReceiptDetailModal } from "../modals/ReceiptDetailModal";

interface CustomerPortalProps {
  customerName?: string;
  phone?: string;
  balance?: number;
  creditLimit?: number;
  storeName?: string;
  onLogout?: () => void;
  triggerToast: (msg: string) => void;
}

type CustomerTab = "statement" | "invoices" | "payments";

export function CustomerPortal({
  customerName = "Alhaji Musa Enterprises",
  phone = "+234 803 123 4567",
  balance: initialBalance = 40000,
  creditLimit = 100000,
  storeName = "Alpha Health & Retail Emporium Ltd",
  onLogout,
  triggerToast,
}: CustomerPortalProps) {
  const [activeTab, setActiveTab] = useState<CustomerTab>("statement");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balance, setBalance] = useState(initialBalance);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState<"bank" | "card">("bank");
  const [repaymentHistory, setRepaymentHistory] = useState([
    {
      id: "REP-902",
      date: "2026-10-24 11:20 AM",
      amount: 25000,
      method: "Bank Transfer",
      ref: "GTB/TRF/092183",
      status: "Confirmed",
    },
    {
      id: "REP-881",
      date: "2026-10-10 03:45 PM",
      amount: 50000,
      method: "Bank Transfer",
      ref: "ZENITH/TRF/482019",
      status: "Confirmed",
    },
  ]);

  const [invoices, setInvoices] = useState([
    {
      id: "TX-9012",
      time: "2026-10-28 08:50 AM",
      items: "Sparkling Energy Drink (x12), Paracetamol 500mg (x2)",
      amount: 8900,
      method: "credit",
      cashier: "Adaeze (POS-1)",
    },
    {
      id: "TX-8941",
      time: "2026-10-22 04:15 PM",
      items: "Royal Stallion Rice 5kg (x2), Sunflower Oil 3L (x1)",
      amount: 28300,
      method: "credit",
      cashier: "Adaeze (POS-1)",
    },
    {
      id: "TX-8802",
      time: "2026-10-15 01:10 PM",
      items: "Amoxicillin 500mg (x5), Vitamin C (x2)",
      amount: 15400,
      method: "bank_transfer",
      cashier: "Ibrahim (POS-2)",
    },
  ]);

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(repayAmount);
    if (isNaN(val) || val <= 0) return;

    setBalance((prev) => Math.max(0, prev - val));
    setRepaymentHistory((prev) => [
      {
        id: `REP-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toLocaleString(),
        amount: val,
        method: repayMethod === "bank" ? "Bank Transfer" : "Card Payment",
        ref: `MANUAL/TRF/${Math.floor(100000 + Math.random() * 900000)}`,
        status: "Pending Store Verification",
      },
      ...prev,
    ]);

    setIsRepayModalOpen(false);
    setRepayAmount("");
    triggerToast(`✓ Submitted repayment of ₦${val.toLocaleString()}`);
  };

  const utilizationPercent = Math.min(100, Math.round((balance / creditLimit) * 100));

  const navigationItems = [
    {
      id: "statement" as CustomerTab,
      label: "Account Statement",
      description: "Credit balance, headroom & settlement",
      icon: CreditCard,
    },
    {
      id: "invoices" as CustomerTab,
      label: "Invoices & Receipts",
      description: "Digital purchase history & 80mm slips",
      icon: Receipt,
      badge: `${invoices.length}`,
    },
    {
      id: "payments" as CustomerTab,
      label: "Repayment History",
      description: "Past settlements & transfer receipts",
      icon: History,
      badge: `${repaymentHistory.length}`,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 select-none font-sans">
      {/* ======================= SIDEBAR NAVIGATION ======================= */}
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-16"
        } transition-all duration-200 flex flex-col shrink-0 bg-white border-r border-slate-200/90 z-20`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-slate-900 text-orange-500 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-800">
              <Building size={16} />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs tracking-tight text-slate-900 truncate">{storeName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600">
                  Buyer Account
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-orange-50 text-orange-950 font-bold border border-orange-200/80 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon
                  size={16}
                  className={`shrink-0 ${isActive ? "text-orange-600" : "text-slate-500"}`}
                />
                {sidebarOpen && (
                  <div className="flex-1 text-left flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/60">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  {customerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 truncate">{customerName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{phone}</p>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-md transition-colors"
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono" title={customerName}>
                {customerName.slice(0, 2).toUpperCase()}
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ======================= MAIN CONTENT AREA ======================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div>
            <h1 className="text-sm font-bold text-slate-900">
              {navigationItems.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-[11px] text-slate-500">
              {navigationItems.find((i) => i.id === activeTab)?.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
              Customer Portal
            </span>
            <button
              onClick={() => setIsRepayModalOpen(true)}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
            >
              <CreditCard size={12} />
              <span>Settle Balance</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-5 max-w-5xl w-full mx-auto space-y-6">
          {/* ======================= TAB: STATEMENT ======================= */}
          {activeTab === "statement" && (
            <div className="space-y-6">
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Outstanding Balance */}
                <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Outstanding Balance
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Active Debt"></span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 num-mono tabular-nums tracking-tight">
                    ₦{balance.toLocaleString()}
                  </p>
                  <button
                    onClick={() => setIsRepayModalOpen(true)}
                    className="w-full py-1.5 px-3 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CreditCard size={13} />
                    <span>Settle Balance Now</span>
                  </button>
                </div>

                {/* Credit Limit Gauge */}
                <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Store Credit Limit
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Approved Limit"></span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 num-mono tabular-nums tracking-tight">
                    ₦{creditLimit.toLocaleString()}
                  </p>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1">
                      <span>Credit Utilized</span>
                      <span className="num-mono tabular-nums">{utilizationPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          utilizationPercent > 80 ? "bg-rose-500" : "bg-orange-600"
                        }`}
                        style={{ width: `${utilizationPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Standing */}
                <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Account Standing
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Good Standing"></span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span className="text-base font-bold text-slate-900">Good Standing</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Eligible for Net-14 credit renewals. Digital invoices can be verified and printed on demand.
                  </p>
                </div>
              </div>

              {/* Recent Account Activity Preview */}
              <div className="bg-white rounded-lg border border-slate-200/90 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Recent Purchase Ledger</h3>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                  >
                    <span>View all invoices &rarr;</span>
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {invoices.slice(0, 2).map((inv) => (
                    <div key={inv.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{inv.items}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{inv.id} · {inv.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 num-mono tabular-nums">₦{inv.amount.toLocaleString()}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded border bg-amber-50 text-amber-700 border-amber-200">
                          {inv.method === "credit" ? "Store Credit" : "Bank Transfer"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: INVOICES ======================= */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900">Purchases & Invoices</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full historical archive of purchases and credit orders with digital 80mm thermal receipts.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Receipt Ref</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Items Summary</th>
                        <th className="py-3 px-4">Tender</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {inv.id}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono tabular-nums text-xs">{inv.time}</td>
                          <td className="py-3 px-4 text-slate-800 text-xs font-medium">{inv.items}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                                inv.method === "credit"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {inv.method === "credit" ? "Store Credit" : "Bank Transfer"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 num-mono tabular-nums text-right text-xs">
                            ₦{inv.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedReceipt(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
                            >
                              <Eye size={12} />
                              <span>View Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: PAYMENTS ======================= */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Debt Repayment History</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Settlement records and electronic transaction verification references.
                  </p>
                </div>
                <button
                  onClick={() => setIsRepayModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <CreditCard size={13} />
                  <span>Submit Payment Proof</span>
                </button>
              </div>

              <div className="bg-white rounded-lg border border-slate-200/90 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Payment Ref</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Method / Bank Ref</th>
                      <th className="py-3 px-4 text-right">Amount Settled</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {repaymentHistory.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {rep.id}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono tabular-nums text-xs">{rep.date}</td>
                        <td className="py-3 px-4 text-slate-700">
                          <p className="font-semibold text-xs text-slate-900">{rep.method}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{rep.ref}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 num-mono tabular-nums text-xs">
                          ₦{rep.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              rep.status === "Confirmed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                rep.status === "Confirmed" ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            ></span>
                            {rep.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================= MODAL: REPAY DEBT ======================= */}
      {isRepayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-xl max-w-md w-full p-6 space-y-4 text-sm animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Settle Outstanding Debt</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record payment to reduce balance. Transfer proofs are verified by the store manager.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Outstanding Balance:</span>
                <span className="font-bold text-slate-900 num-mono tabular-nums">₦{balance.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleRepaySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800 text-xs">Repayment Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={balance}
                  step="any"
                  placeholder={`Max: ₦${balance.toLocaleString()}`}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 num-mono tabular-nums text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 text-xs">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepayMethod("bank")}
                    className={`p-2.5 rounded-md border text-center font-bold text-xs transition-colors ${
                      repayMethod === "bank"
                        ? "bg-orange-50 border-orange-500 text-orange-950 shadow-xs"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Direct Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayMethod("card")}
                    className={`p-2.5 rounded-md border text-center font-bold text-xs transition-colors ${
                      repayMethod === "card"
                        ? "bg-orange-50 border-orange-500 text-orange-950 shadow-xs"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Debit Card (Paystack)
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-xs transition-colors"
                >
                  Submit Payment Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: RECEIPT DETAIL ======================= */}
      {selectedReceipt && (
        <ReceiptDetailModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          sale={selectedReceipt}
        />
      )}
    </div>
  );
}
