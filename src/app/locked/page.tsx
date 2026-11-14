"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LockKeyhole, CreditCard, ArrowRight, ShieldAlert, LogOut, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SubscriptionLockedPage() {
  const router = useRouter();
  const [role] = useState<"owner" | "staff">("owner");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 text-rose-700 shadow-xs mb-4">
          <LockKeyhole size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workspace Access Suspended</h1>
        <p className="mt-1 text-xs text-slate-600">
          This store account is currently locked due to an outstanding subscription payment.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-6 shadow-xs rounded-lg border border-slate-200 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Notice:</span> The automated 3-day grace period for subscription renewal has expired.
            Transaction processing and till operations are temporarily disabled to prevent data reconciliation errors.
          </div>

          {role === "owner" ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-700">
                As the Store Owner, you can immediately restore access by settling your overdue plan invoice via Paystack.
              </p>
              <Link
                href="/owner/billing"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 transition-colors shadow-xs"
              >
                <CreditCard size={15} />
                <span>Settle Overdue Invoice (₦15,000.00)</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-600">
                Please inform your Store Owner or General Manager that the store subscription requires settlement to restore cashier operations.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/login" className="flex items-center gap-1 hover:text-slate-800">
              <LogOut size={13} />
              <span>Back to Sign In</span>
            </Link>
            <a
              href="mailto:support@easeme.ng"
              className="flex items-center gap-1 hover:text-indigo-600"
            >
              <HelpCircle size={13} />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

