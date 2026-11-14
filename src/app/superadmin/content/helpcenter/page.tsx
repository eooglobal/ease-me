"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Plus,
  Search,
  Eye,
  CheckCircle,
  AlertTriangle,
  Users,
  Tag,
  BookOpen,
} from "lucide-react";
import {
  PlatformContentService,
  HelpArticleItem,
} from "@/lib/superadmin/content-service";

export default function HelpCenterPage() {
  const [articles, setArticles] = useState<HelpArticleItem[]>(() =>
    PlatformContentService.getArticles()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [previewArticle, setPreviewArticle] = useState<HelpArticleItem | null>(null);

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.searchKeywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || art.roleVisibility.includes(roleFilter as any);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Help Center & Knowledge Base</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Role-Gated Visibility
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Publish support articles. Strictly gated by role so cashier training guides never leak to portal customers.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          <BookOpen className="w-3.5 h-3.5 text-brand-600" />
          <span>Section 6.7: Cashier articles never appear for customers</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documentation by title, keyword or body..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Audience Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="all">All Audiences</option>
            <option value="owner">Business Owner</option>
            <option value="manager">Store Manager</option>
            <option value="cashier">Cashier</option>
            <option value="customer">Portal Customer</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Article Title & Summary</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Role Visibility</th>
                <th className="py-2.5 px-3">Search Keywords</th>
                <th className="py-2.5 px-4 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArticles.map((art) => (
                <tr key={art.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-semibold text-slate-900">{art.title}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{art.body}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                      {art.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {art.roleVisibility.map((r) => (
                        <span
                          key={r}
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            r === "customer"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : r === "cashier"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {art.searchKeywords.map((k) => (
                        <span key={k} className="text-[10px] text-slate-500 font-mono">
                          #{k}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setPreviewArticle(art)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> Read
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Article Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-brand-600" />
                <span>Help Panel Article Preview</span>
              </div>
              <button onClick={() => setPreviewArticle(null)} className="text-slate-400 text-xs">✕</button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                  {previewArticle.category}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Visibility: {previewArticle.roleVisibility.join(", ")}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{previewArticle.title}</h2>
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200 whitespace-pre-wrap">
                {previewArticle.body}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

