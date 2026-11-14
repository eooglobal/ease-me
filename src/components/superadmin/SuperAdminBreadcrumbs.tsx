"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function SuperAdminBreadcrumbs() {
  const pathname = usePathname();

  // If at root /superadmin, no breadcrumbs needed
  if (pathname === "/superadmin") return null;

  const parts = pathname.split("/").filter(Boolean);
  // parts[0] is "superadmin"

  const crumbs = parts.slice(1).map((part, index) => {
    const href = "/" + parts.slice(0, index + 2).join("/");
    // Format label cleanly
    const formatted = part
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return { label: formatted, href, isLast: index === parts.length - 2 };
  });

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 select-none" aria-label="Breadcrumb">
      <Link
        href="/superadmin"
        className="inline-flex items-center gap-1 hover:text-indigo-700 transition-colors font-medium text-slate-600"
      >
        <Home size={13} />
        <span>Console</span>
      </Link>

      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight size={13} className="text-slate-400 shrink-0" />
          {crumb.isLast ? (
            <span className="font-semibold text-slate-900">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-indigo-700 transition-colors font-medium text-slate-600">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

