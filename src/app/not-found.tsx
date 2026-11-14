"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  const [returnHref, setReturnHref] = useState("/owner");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("ease_me_active_role") || "owner";
      if (role === "super_admin") setReturnHref("/superadmin");
      else if (role === "cashier") setReturnHref("/pos");
      else if (role === "customer") setReturnHref("/portal");
      else if (role === "manager") setReturnHref("/manager");
      else setReturnHref("/owner");
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mb-4">
        <FileQuestion size={24} />
      </div>
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        The requested URL does not exist or has been relocated to another workspace section.
      </p>

      <div className="mt-6">
        <Link
          href={returnHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Return to Workspace</span>
        </Link>
      </div>
    </div>
  );
}

