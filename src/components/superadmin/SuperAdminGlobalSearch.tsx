"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, X, Building2, ExternalLink, ShieldCheck } from "lucide-react";

interface SuperAdminGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TenantSearchResult {
  id: string;
  name: string;
  plan: string;
  status: string;
  maskedEmail: string;
}

const SAMPLE_TENANTS: TenantSearchResult[] = [
  { id: "ten-001", name: "Alpha Health & Retail Emporium Ltd", plan: "Growth", status: "active", maskedEmail: "o***@alpha-retail.ng" },
  { id: "ten-002", name: "Lekki Superette & Cold Store", plan: "Business", status: "active", maskedEmail: "m***@lekkisuperette.ng" },
  { id: "ten-003", name: "Ikeja Wholesale Depot", plan: "Enterprise", status: "suspended", maskedEmail: "a***@ikejadepot.com" },
  { id: "ten-004", name: "Abuja Modern Pharmacy Ltd", plan: "Starter", status: "trial", maskedEmail: "d***@abujapharm.ng" },
  { id: "ten-005", name: "Victoria Island Gourmet Grocers", plan: "Business", status: "active", maskedEmail: "c***@vigrocers.com" },
];

export function SuperAdminGlobalSearch({ isOpen, onClose }: SuperAdminGlobalSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = SAMPLE_TENANTS.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.id.toLowerCase().includes(query.toLowerCase()) ||
      t.maskedEmail.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 flex items-center gap-2">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenants by business name, masked email, or ID..."
            className="flex-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching tenant found for &quot;<span className="font-semibold">{query}</span>&quot;
            </div>
          ) : (
            filtered.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/superadmin/tenants/${tenant.id}`}
                onClick={onClose}
                className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-md transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {tenant.name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500">
                      ID: {tenant.id} • Owner: {tenant.maskedEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                    {tenant.plan}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                      tenant.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : tenant.status === "suspended"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {tenant.status}
                  </span>
                  <ExternalLink size={13} className="text-slate-400 group-hover:text-indigo-600" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Strict Privacy Shield Active: Owner emails masked automatically</span>
          </span>
          <span className="font-mono">Press ↵ to view</span>
        </div>
      </div>
    </div>
  );
}

