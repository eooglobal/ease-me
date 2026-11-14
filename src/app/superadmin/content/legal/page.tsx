"use client";

import React, { useState } from "react";
import {
  Scale,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Send,
  History,
  Clock,
  Eye,
} from "lucide-react";
import {
  PlatformContentService,
  LegalDocumentItem,
} from "@/lib/superadmin/content-service";
import { PlatformStaffContext } from "@/lib/superadmin/permission-engine";

export default function LegalDocumentsPage() {
  const currentStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const [legalDocs, setLegalDocs] = useState<LegalDocumentItem[]>(() =>
    PlatformContentService.getLegalDocuments()
  );

  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Propose New Revision Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocumentItem | null>(null);
  const [newVersionNumber, setNewVersionNumber] = useState("");
  const [newBody, setNewBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openRevisionModal = (doc: LegalDocumentItem) => {
    setSelectedDoc(doc);
    const parts = doc.versionNumber.split(".");
    const nextMinor = `${parts[0]}.${parseInt(parts[1] || "0") + 1}`;
    setNewVersionNumber(nextMinor);
    setNewBody(doc.body);
    setIsModalOpen(true);
  };

  const handleProposeRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await PlatformContentService.proposeLegalVersion(
        selectedDoc.documentType,
        newVersionNumber,
        newBody,
        currentStaff
      );

      setFeedback({
        type: "info",
        message: `Revision proposal for ${selectedDoc.title} submitted to dual-control approval queue (Request ID: ${res.approvalRequestId}). Upon approval, all tenant owners will be prompted to re-accept at next sign in.`,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to submit revision proposal." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Legal Documents & Terms Acceptance</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Dual-Control Publishing
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Terms of Service, NDPR Privacy Policy, and DPA agreements. Publishing enforces mandatory tenant owner sign-in acceptance.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs text-slate-700 border border-slate-200">
          <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
          <span>Section 4: Legal publishing requires peer approval</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-md text-xs flex items-start gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : feedback.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
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

      {/* Legal Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {legalDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-md border border-purple-200">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{doc.title}</h2>
                    <span className="text-[11px] font-mono text-slate-500">
                      Type: {doc.documentType}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 font-mono">
                  v{doc.versionNumber}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-50">
                  <span>Effective Since:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {new Date(doc.effectiveDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-50">
                  <span>Tenant Acceptance Status:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Sign-in Gate Active
                  </span>
                </div>

                <div className="mt-2 text-slate-500 line-clamp-3 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                  {doc.body}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => openRevisionModal(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-semibold"
              >
                <Send className="w-3.5 h-3.5" /> Propose New Revision
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Propose Revision Modal */}
      {isModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Scale className="w-4 h-4 text-purple-600" />
                <span>Propose Revision: {selectedDoc.title}</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-xs text-purple-900 space-y-1">
              <span className="font-semibold block">Mandatory Acceptance Notice</span>
              Once approved and published, all store owners will be gated at sign-in until they review and click to accept this new version (Section 11).
            </div>

            <form onSubmit={handleProposeRevision} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Version Number (e.g. 2.2)
                </label>
                <input
                  type="text"
                  required
                  value={newVersionNumber}
                  onChange={(e) => setNewVersionNumber(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Updated Legal Agreement Text
                </label>
                <textarea
                  rows={8}
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-md font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold"
                >
                  {isSubmitting ? "Submitting..." : "Submit to Dual-Control Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

