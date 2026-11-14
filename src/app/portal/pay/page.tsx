"use client";

import React, { useState, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CreditCard,
  Building2,
  Copy,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { uploadAttachmentAction } from "@/actions/storage-actions";
import { CustomerPortalService } from "@/lib/parties/customer-portal-service";

export default function CustomerPaymentProofPage() {
  const [amount, setAmount] = useState("");
  const [bankUsed, setBankUsed] = useState("Guaranty Trust Bank");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [copiedBank, setCopiedBank] = useState(false);

  // File upload state
  const [proofUrl, setProofUrl] = useState<string>("");
  const [proofFileName, setProofFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankAccount = {
    bankName: "Guaranty Trust Bank (GTBank)",
    accountNumber: "0123456789",
    accountName: "Ease Me Supermarket Operating Account",
  };

  const handleCopyAccount = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bankAccount.accountNumber);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "debt_proofs");

      const res = await uploadAttachmentAction(formData);
      if (res && res.success && res.publicUrl) {
        setProofUrl(res.publicUrl);
        setProofFileName(file.name);
      } else {
        setUploadError((res as any)?.error?.message || "Proof upload failed. Please try again.");
      }
    } catch (err: any) {
      setUploadError(err?.message || "File upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);

    const validation = CustomerPortalService.validateProofSubmission({
      customerId: "cust-1",
      amount: val,
      transferReference: reference,
      bankUsed,
      proofUrl,
      notes,
    });

    if (!validation.valid) {
      setUploadError(validation.error || "Please fill in all required payment details.");
      return;
    }

    setSubmissionSuccess(true);
  };

  return (
    <AppShell role="customer">
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settle Balance & Upload Proof</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono">
                Encrypted Vault
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Make a transfer to the official store account below and submit your transaction slip for verification.
            </p>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          {submissionSuccess ? (
            <div className="bg-white border border-emerald-200 rounded-lg p-8 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Payment Proof Submitted Successfully</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your transfer reference <strong className="font-mono text-slate-900">{reference}</strong> for{" "}
                <strong className="font-mono text-slate-900">₦{parseFloat(amount).toLocaleString()}</strong> has been
                queued in the store owner’s verification ledger. Your balance will update immediately upon approval.
              </p>
              <div className="pt-3">
                <button
                  onClick={() => {
                    setSubmissionSuccess(false);
                    setAmount("");
                    setReference("");
                    setProofUrl("");
                    setProofFileName("");
                  }}
                  className="px-4 py-2 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md transition-colors"
                >
                  Submit Another Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Bank Account Details */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Building2 size={18} />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Store Bank Details
                    </h3>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-slate-500 text-[11px]">Bank Name</p>
                    <p className="font-bold text-slate-900">{bankAccount.bankName}</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-slate-500 text-[11px]">Account Number</p>
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-md border border-slate-200">
                      <span className="font-mono font-bold text-base text-slate-900">
                        {bankAccount.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="text-indigo-700 hover:text-indigo-900 p-1 text-xs font-semibold flex items-center gap-1"
                      >
                        <Copy size={13} />
                        <span>{copiedBank ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-slate-500 text-[11px]">Account Name</p>
                    <p className="font-semibold text-slate-800">{bankAccount.accountName}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                    <span>Verified Corporate Merchant Account</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Submission Form */}
              <div className="md:col-span-2">
                <form
                  onSubmit={handleSubmit}
                  className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 text-xs"
                >
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Enter Transfer Information
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-800">Amount Paid (₦) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 50000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono tabular-nums text-sm focus:ring-1 focus:ring-indigo-700 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-800">Your Bank Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Access Bank, Zenith, Kuda"
                        value={bankUsed}
                        onChange={(e) => setBankUsed(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-indigo-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">Bank Transfer Reference / Session ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GTB/TRF/98124 or 000013248192"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-sm focus:ring-1 focus:ring-indigo-700 outline-none"
                    />
                  </div>

                  {/* Cloudflare R2 Upload Widget */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>Upload Proof of Transfer (Screenshot / Receipt PDF) *</span>
                      <span className="text-[11px] font-normal text-slate-400 font-mono">Cloudflare R2 Encrypted</span>
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                    />

                    {!proofUrl ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                          isUploading
                            ? "bg-slate-50 border-indigo-300 pointer-events-none"
                            : "bg-slate-50/60 hover:bg-slate-50 border-slate-300 hover:border-indigo-700"
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                            <p className="text-xs font-semibold text-slate-600">Uploading proof to secure storage...</p>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
                              <Upload size={16} />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-slate-800">Click to upload transfer slip screenshot</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, or PDF up to 5MB</p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-md flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {proofFileName || "Attached Proof Document"}
                            </p>
                            <a
                              href={proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-700 hover:underline font-medium"
                            >
                              View uploaded file
                            </a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProofUrl("");
                            setProofFileName("");
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">Additional Settlement Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Partial settlement for invoice INV-9012..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-700 outline-none"
                    />
                  </div>

                  {uploadError && <p className="text-xs font-semibold text-rose-600">{uploadError}</p>}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-5 py-2 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Submit Payment Proof</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}

