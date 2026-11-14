"use client";

import React, { useState } from "react";
import {
  FileText,
  Mail,
  MessageSquare,
  Receipt,
  Send,
  CheckCircle,
  AlertTriangle,
  Code,
  Save,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import {
  PlatformContentService,
  MessageTemplateItem,
  APPROVED_TEMPLATE_VARIABLES,
} from "@/lib/superadmin/content-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function MessageTemplatesPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [templates, setTemplates] = useState<MessageTemplateItem[]>(() =>
    PlatformContentService.getTemplates()
  );

  const [selectedKey, setSelectedKey] = useState<string>(templates[0]?.templateKey || "");
  const activeTemplate = templates.find((t) => t.templateKey === selectedKey) || templates[0];

  const [formData, setFormData] = useState({
    subject: activeTemplate?.subject || "",
    body: activeTemplate?.body || "",
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);

  const handleSelectTemplate = (tmpl: MessageTemplateItem) => {
    setSelectedKey(tmpl.templateKey);
    setFormData({
      subject: tmpl.subject || "",
      body: tmpl.body,
    });
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const updated = await PlatformContentService.updateTemplate(
        activeTemplate.templateKey,
        formData.body,
        activeTemplate.channel === "email" ? formData.subject : undefined,
        currentStaff
      );

      setTemplates(PlatformContentService.getTemplates());
      setFeedback({
        type: "success",
        message: `Template '${updated.name}' updated to version ${updated.activeVersion}. Variables verified against sanctioned schema.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save template." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSend = () => {
    setIsTestSending(true);
    setFeedback(null);

    try {
      const res = PlatformContentService.testSendTemplate(
        activeTemplate.templateKey,
        currentStaff.email
      );

      setFeedback({
        type: "success",
        message: `Test send dispatched successfully to ${res.recipient} with simulated dummy tenant data.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to simulate test send." });
    } finally {
      setIsTestSending(false);
    }
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case "email":
        return <Mail className="w-4 h-4 text-blue-600" />;
      case "whatsapp":
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case "sms":
        return <MessageSquare className="w-4 h-4 text-amber-600" />;
      default:
        return <Receipt className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Message & Receipt Templates</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Sanctioned Variables Only
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Define standard tenant onboarding emails, renewal notices, WhatsApp debt reminders, and POS receipts.
          </p>
        </div>

        <button
          onClick={handleTestSend}
          disabled={isTestSending}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors shrink-0 disabled:opacity-50"
        >
          {isTestSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-amber-400" />}
          Send Test to My Email ({currentStaff.email})
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List Selector */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-2 lg:col-span-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
            System Message Templates
          </h2>
          <div className="space-y-1">
            {templates.map((tmpl) => {
              const isSelected = tmpl.templateKey === selectedKey;
              return (
                <button
                  key={tmpl.templateKey}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`w-full text-left p-3 rounded-md border text-xs transition-colors flex items-start gap-3 ${
                    isSelected
                      ? "bg-brand-50/60 border-brand-300 text-brand-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="p-1.5 bg-white border border-slate-200 rounded shadow-xs mt-0.5">
                    {getChannelIcon(tmpl.channel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{tmpl.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">
                      {tmpl.channel} • v{tmpl.activeVersion}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Editor */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{activeTemplate.name}</h2>
              <span className="text-[11px] font-mono text-slate-500">Key: {activeTemplate.templateKey}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
              {activeTemplate.channel}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {activeTemplate.channel === "email" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Subject Line</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-md font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Template Body Text & Formatting
              </label>
              <textarea
                rows={10}
                required
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full text-xs p-3 border border-slate-300 rounded-md font-mono text-slate-800 leading-relaxed"
              />
            </div>

            {/* Approved Variables Palette */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Code className="w-3.5 h-3.5 text-brand-600" />
                <span>Sanctioned Variables (Click to copy/insert)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeTemplate.allowedVariables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormData({ ...formData, body: formData.body + ` ${v}` })}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:border-brand-500 text-slate-700 rounded text-[11px] font-mono transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Section 6.7: The editor strictly rejects unknown variables to prevent leaking unapproved internal tokens.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Changes record a version snapshot upon save.
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Template Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

