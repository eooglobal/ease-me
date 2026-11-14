"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EaseMe ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="w-12 h-12 rounded-lg bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mb-4">
        <AlertCircle size={24} />
      </div>
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">Something Went Wrong</h1>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        An unexpected application error occurred while processing this request. Your data remains safe and synchronized.
      </p>

      {error.digest && (
        <p className="mt-2 text-[10px] font-mono text-slate-400">Error Digest: {error.digest}</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
        >
          <RotateCcw size={14} />
          <span>Try Again</span>
        </button>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
        >
          <Home size={14} />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

