import React from "react";
import Link from "next/link";
import { Wrench, Mail, MessageSquare, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Platform Maintenance | Ease Me",
  description: "Ease Me is currently undergoing scheduled platform maintenance.",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-700 mb-6">
          <Wrench className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Scheduled Platform Maintenance
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          Ease Me is currently undergoing scheduled platform maintenance and performance upgrades.
          Tenant dashboards and POS checkout sync will resume shortly.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200 mb-6">
            <div className="flex">
              <div className="flex-1 text-xs text-amber-800">
                <span className="font-semibold block mb-1">Data Safety Guarantee</span>
                Your store inventory, pending offline receipts, and transactions are securely queued in local storage and will automatically synchronize once maintenance completes.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Need Urgent Operational Assistance?
            </h2>

            <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-medium text-xs">support@easeme.ng</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-xs">+234 800 EASE ME (WhatsApp)</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Status: Scheduled Maintenance</span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Staff Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

