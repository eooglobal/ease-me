"use client";

import React, { useState, useRef } from "react";
import { Modal } from "../ui/Modal";
import { Upload, Image as ImageIcon, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { uploadAttachmentAction } from "@/actions/storage-actions";

interface LogExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashInDrawer: number;
  onAddExpense: (expense: {
    description: string;
    amount: number;
    category: string;
    source: "cash" | "bank";
    receiptUrl?: string;
  }) => void;
}

export function LogExpenseModal({
  isOpen,
  onClose,
  cashInDrawer,
  onAddExpense,
}: LogExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("utilities");
  const [source, setSource] = useState<"cash" | "bank">("cash");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "receipts");

      const res = await uploadAttachmentAction(formData);
      if (res && res.success && res.publicUrl) {
        setReceiptUrl(res.publicUrl);
        setReceiptFileName(file.name);
      } else {
        setUploadError((res as any)?.error?.message || "Upload failed. Please try again.");
      }
    } catch (err: any) {
      setUploadError(err?.message || "File upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    setReceiptUrl("");
    setReceiptFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!description.trim() || isNaN(val) || val <= 0) return;

    onAddExpense({
      description: description.trim(),
      amount: val,
      category,
      source,
      receiptUrl: receiptUrl || undefined,
    });

    setDescription("");
    setAmount("");
    setReceiptUrl("");
    setReceiptFileName("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Operating Expense"
      subtitle="Log overhead, petty cash disbursements, generator fuel, or logistics."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="space-y-1">
          <label className="font-semibold text-slate-800 text-xs">Expense Description *</label>
          <input
            type="text"
            required
            placeholder="e.g. Generator Petrol (20 Litres) or Shop Cleaning Supplies"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-indigo-700 focus:border-indigo-700 outline-none font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-indigo-700 focus:border-indigo-700 outline-none font-medium"
            >
              <option value="utilities">Utilities & Power</option>
              <option value="logistics">Logistics & Transportation</option>
              <option value="petty_cash">Petty Cash & Consumables</option>
              <option value="repairs">Maintenance & Repairs</option>
              <option value="staff">Staff Meals & Welfare</option>
              <option value="other">Other Operational Expenses</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-800 text-xs">Amount (₦) *</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono tabular-nums text-sm focus:ring-1 focus:ring-indigo-700 focus:border-indigo-700 outline-none font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-800 text-xs">Paid Out From</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSource("cash")}
              className={`p-2.5 rounded-md border text-left transition-colors ${
                source === "cash"
                  ? "bg-indigo-50 border-indigo-700 text-indigo-950 font-semibold shadow-xs"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <p className="text-xs font-bold">Drawer Petty Cash</p>
              <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">₦{cashInDrawer.toLocaleString()} available</p>
            </button>
            <button
              type="button"
              onClick={() => setSource("bank")}
              className={`p-2.5 rounded-md border text-left transition-colors ${
                source === "bank"
                  ? "bg-indigo-50 border-indigo-700 text-indigo-950 font-semibold shadow-xs"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <p className="text-xs font-bold">Bank Transfer</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Corporate Account</p>
            </button>
          </div>
        </div>

        {/* Cloudflare R2 Receipt Attachment */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-800 text-xs flex items-center justify-between">
            <span>Proof Receipt / Invoice Slip (Optional)</span>
            <span className="text-[11px] font-normal text-slate-500 font-mono">Cloudflare R2 Encrypted</span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
          />

          {!receiptUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-3.5 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                isUploading
                  ? "bg-slate-50 border-indigo-300 pointer-events-none"
                  : "bg-slate-50/60 hover:bg-slate-50 border-slate-300 hover:border-indigo-700"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <p className="text-xs font-semibold text-slate-600">Uploading receipt to R2 bucket...</p>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Upload size={16} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload receipt photo or drag & drop
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WEBP, or PDF up to 5MB</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {receiptFileName || "Attached Receipt"}
                  </p>
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-700 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View attachment</span>
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Remove Receipt"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {uploadError && (
            <p className="text-xs font-semibold text-rose-600 mt-1">{uploadError}</p>
          )}
        </div>

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors"
          >
            Log & Deduct Amount
          </button>
        </div>
      </form>
    </Modal>
  );
}
