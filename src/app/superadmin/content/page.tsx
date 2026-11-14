import React from "react";
import Link from "next/link";
import {
  Megaphone,
  HelpCircle,
  FileText,
  Scale,
  CheckSquare,
  PackagePlus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Content Management | Ease Me Super Admin",
  description: "Manage announcements, help articles, message templates, legal terms, presets and onboarding checklists.",
};

const CONTENT_SECTIONS = [
  {
    title: "Broadcast Announcements",
    href: "/superadmin/content/announcements",
    icon: Megaphone,
    color: "text-brand-600 bg-brand-50 border-brand-200",
    description: "Publish operational notifications, scheduled downtime notices, and plan-specific banners inside tenant dashboards.",
  },
  {
    title: "Help Center Articles",
    href: "/superadmin/content/helpcenter",
    icon: HelpCircle,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    description: "Create and publish knowledge base documentation with strict role visibility so cashier guides never leak to portal customers.",
  },
  {
    title: "Message & Layout Templates",
    href: "/superadmin/content/templates",
    icon: FileText,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    description: "Configure transactional email, WhatsApp, SMS debt notices, and POS printed receipts with sanctioned variable validation.",
  },
  {
    title: "Legal Terms & Acceptance Gate",
    href: "/superadmin/content/legal",
    icon: Scale,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    description: "Manage Terms of Service, Privacy Policy, and Data Processing Terms. Dual-control publishing forces tenant owner re-acceptance.",
  },
  {
    title: "Onboarding Checklist",
    href: "/superadmin/content/onboarding",
    icon: CheckSquare,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    description: "Define the setup journey new store owners complete upon sign-in. Editable rules and ordering without requiring code deploys.",
  },
  {
    title: "Business Starter Presets",
    href: "/superadmin/content/presets",
    icon: PackagePlus,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    description: "Industry starter templates (pharmacy, supermarket, restaurant) with deep copy isolation ensuring edits never alter active stores.",
  },
];

export default function ContentManagementHubPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Content Management Hub</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
              Section 6.7
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Every content type follows one strict lifecycle: Draft, Scheduled, Published, Archived. Every publish stores a version.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs text-slate-700 border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero Instant Publishing Without Version Snapshot</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CONTENT_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg border ${sec.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {sec.title}
                </h2>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {sec.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-brand-600 flex items-center gap-1">
                Open Manager &rarr;
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

