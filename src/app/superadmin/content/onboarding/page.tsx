"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  Zap,
  Save,
  HelpCircle,
} from "lucide-react";
import {
  PlatformContentService,
  OnboardingStepItem,
} from "@/lib/superadmin/content-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function OnboardingChecklistPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [steps, setSteps] = useState<OnboardingStepItem[]>(() =>
    PlatformContentService.getOnboardingSteps()
  );

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const reordered = [...steps];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Update sortOrder
    for (let i = 0; i < reordered.length; i++) {
      reordered[i].sortOrder = i + 1;
      await PlatformContentService.updateOnboardingStep(
        reordered[i].stepKey,
        { sortOrder: i + 1 },
        currentStaff
      );
    }

    setSteps(PlatformContentService.getOnboardingSteps());
    setFeedback({ type: "success", message: "Onboarding step order updated without code release." });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">New Owner Onboarding Journey</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero Deploy Code-Free Config
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure the setup checklist new business owners see upon signup. Completion rules tie to automated platform events.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs text-slate-700 border border-slate-200">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Section 6.7: System Event Completion Rules</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-md text-xs flex items-start gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Steps List */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0 mt-0.5">
                  {step.sortOrder}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                    {step.isMandatory ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Mandatory
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-brand-600">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Trigger: {step.completionRule}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                  className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                  title="Move Step Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === steps.length - 1}
                  onClick={() => handleMove(index, "down")}
                  className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                  title="Move Step Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

