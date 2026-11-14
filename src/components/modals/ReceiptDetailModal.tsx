"use client";

import React from "react";
import { Modal } from "../ui/Modal";
import { Printer, CheckCircle2, QrCode, Store } from "lucide-react";

export interface SaleTransaction {
  id: string;
  time: string;
  items: string;
  amount: number;
  method: string;
  cashier: string;
  customer?: string;
}

interface ReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: SaleTransaction | null;
  storeName?: string;
  storePhone?: string;
}

export function ReceiptDetailModal({
  isOpen,
  onClose,
  sale,
  storeName = "EASE ME RETAIL STORE",
  storePhone = "+234 800 EASE ME",
}: ReceiptDetailModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sales Transaction Receipt"
      subtitle={`Invoice #${sale.id}`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Printable Thermal Receipt Container */}
        <div
          id="thermal-receipt-printable"
          className="bg-white p-4 border border-slate-200/90 rounded-md font-mono text-slate-800 text-xs shadow-xs space-y-3"
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-slate-900 uppercase">
              <Store size={15} className="text-orange-600 no-print" />
              <span>{storeName}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">Main Commercial Outlet, Lagos</p>
            <p className="text-[10px] text-slate-400 font-sans">Tel: {storePhone}</p>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>INVOICE NO:</span>
              <span className="font-bold text-slate-900">{sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span>DATE/TIME:</span>
              <span className="font-medium text-slate-900 tabular-nums">{sale.time}</span>
            </div>
            <div className="flex justify-between">
              <span>ATTENDANT:</span>
              <span className="font-medium text-slate-900">{sale.cashier}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-bold text-orange-700">{sale.customer}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>PAYMENT TENDER:</span>
              <span className="font-bold text-slate-900 uppercase">{sale.method.replace("_", " ")}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="py-2 border-y border-dashed border-slate-300 space-y-1.5">
            <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase tracking-wider">
              <span>Item Description</span>
              <span>Amount</span>
            </div>
            <div className="space-y-1 text-slate-800 text-[11px]">
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium break-words flex-1">{sale.items}</span>
                <span className="font-bold shrink-0 num-mono tabular-nums">₦{sale.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-1 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>SUBTOTAL:</span>
              <span className="num-mono tabular-nums">₦{sale.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>DISCOUNT / TAX:</span>
              <span className="num-mono tabular-nums">₦0.00</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL PAID:</span>
              <span className="num-mono tabular-nums text-orange-600">₦{sale.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="p-2 bg-emerald-50 rounded-sm text-center text-emerald-800 text-[10px] font-semibold flex items-center justify-center gap-1 border border-emerald-200/60">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>PAYMENT VERIFIED & RECONCILED</span>
          </div>

          {/* Thermal Footer */}
          <div className="text-center pt-1 border-t border-dashed border-slate-300 text-[10px] text-slate-400 space-y-0.5">
            <p className="font-bold text-slate-600">THANK YOU FOR YOUR PATRONAGE!</p>
            <p>Goods returned in good condition eligible for exchange within 48h.</p>
            <p className="font-mono text-[9px] pt-1 text-slate-300">*** {sale.id} ***</p>
          </div>
        </div>

        {/* Modal Buttons (Hidden during Print) */}
        <div className="no-print pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer size={14} />
            <span>Print 80mm Slip</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
