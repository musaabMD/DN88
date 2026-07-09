"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { LibraryArticle } from "@/lib/set-content";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";

export function ArticleSearchModal({
  article,
  onClose,
}: {
  article: LibraryArticle;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return article.sections.flatMap((section) => {
      const matches: Array<{ heading: string; snippet: string; id: string }> = [];
      if (section.body.toLowerCase().includes(q)) {
        matches.push({
          heading: section.heading,
          snippet: section.body,
          id: sectionSlug(section.heading),
        });
      }
      for (const bullet of section.bullets ?? []) {
        if (bullet.toLowerCase().includes(q)) {
          matches.push({
            heading: section.heading,
            snippet: bullet,
            id: sectionSlug(section.heading),
          });
        }
      }
      return matches;
    });
  }, [article.sections, query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search article"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search size={18} strokeWidth={2.5} className="shrink-0 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this article..."
            className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() && results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm font-bold text-slate-400">
              No matches found
            </p>
          ) : null}
          {results.map((result, i) => (
            <a
              key={`${result.id}-${i}`}
              href={`#${result.id}`}
              onClick={onClose}
              className="block rounded-xl px-3 py-2.5 hover:bg-slate-50"
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                {result.heading}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm font-medium text-slate-700">
                {result.snippet}
              </p>
            </a>
          ))}
          {!query.trim() ? (
            <p className="px-3 py-6 text-center text-sm font-medium text-slate-400">
              Search headings, paragraphs, and bullet points
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
