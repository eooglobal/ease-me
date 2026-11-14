"use client";

import React, { useState } from "react";
import {
  PackagePlus,
  CheckCircle,
  AlertTriangle,
  Layers,
  Edit2,
  Tag,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  PlatformContentService,
  BusinessPresetItem,
} from "@/lib/superadmin/content-service";

export default function BusinessPresetsPage() {
  const [presets, setPresets] = useState<BusinessPresetItem[]>(() =>
    PlatformContentService.getPresets()
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Business Starter Presets</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Deep Copy Isolation
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Starter catalogs, expense categories, tax rates, and tracking settings cloned into new tenant workspaces upon creation.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs text-slate-700 border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Section 11: Preset edits never alter existing tenants</span>
        </div>
      </div>

      {/* Presets Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{preset.name}</h2>
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Type: {preset.businessType}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                  Default VAT: {preset.defaultTaxRate}%
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {preset.description}
              </p>

              <div className="mt-4 space-y-3">
                {/* Feature switches */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        preset.batchTracking ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <span className={preset.batchTracking ? "font-semibold text-emerald-700" : "text-slate-500"}>
                      Batch Tracking: {preset.batchTracking ? "ON" : "OFF"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        preset.expiryTracking ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <span className={preset.expiryTracking ? "font-semibold text-emerald-700" : "text-slate-500"}>
                      Expiry Tracking: {preset.expiryTracking ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>

                {/* Categories preview */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Starter Categories ({preset.productCategories.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {preset.productCategories.slice(0, 4).map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                        {c}
                      </span>
                    ))}
                    {preset.productCategories.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 text-slate-400">
                        +{preset.productCategories.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Units of Measure */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Units of Measure:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {preset.unitsOfMeasure.map((u) => (
                      <span key={u} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Deep clone on provisioning</span>
              <span className="text-emerald-700 font-medium">Active Starter</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

