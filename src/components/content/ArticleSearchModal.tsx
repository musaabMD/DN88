"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { LibraryArticle } from "@/lib/set-content";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";

function snippetAround(text: string, query: string, radius = 80): string {
  const lower = text.toLowerCase();
  const index = lower.indexOf(query);
  if (index < 0) return text.slice(0, radius * 2);
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + query.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

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

    const matches: Array<{ heading: string; snippet: string; id: string }> = [];

    const pushMatch = (heading: string, text: string, id: string) => {
      matches.push({
        heading,
        snippet: snippetAround(text, q),
        id,
      });
    };

    if (article.summary?.toLowerCase().includes(q)) {
      pushMatch("Summary", article.summary, "summary");
    }
    if (article.highYield?.toLowerCase().includes(q)) {
      pushMatch("High yield", article.highYield, "high-yield");
    }

    for (const section of article.sections) {
      const anchor = sectionSlug(section.heading);
      if (section.body.toLowerCase().includes(q)) {
        pushMatch(section.heading, section.body, anchor);
      }
      for (const bullet of section.bullets ?? []) {
        if (bullet.toLowerCase().includes(q)) {
          pushMatch(section.heading, bullet, anchor);
        }
      }
      for (const callout of section.callouts ?? []) {
        if (callout.body?.toLowerCase().includes(q)) {
          pushMatch(section.heading, callout.body, anchor);
        }
        for (const bullet of callout.bullets ?? []) {
          if (bullet.toLowerCase().includes(q)) {
            pushMatch(section.heading, bullet, anchor);
          }
        }
      }
    }

    return matches;
  }, [article, query]);

  return (
    <div
      className="article-search-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="article-search-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search article"
      >
        <div className="article-search-header">
          <Search size={18} strokeWidth={2.5} className="shrink-0" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this article..."
            className="article-search-input"
          />
          <button
            type="button"
            onClick={onClose}
            className="article-search-close"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="article-search-results">
          {query.trim() && results.length === 0 ? (
            <p className="article-search-empty">No matches found</p>
          ) : null}
          {results.map((result, i) => (
            <a
              key={`${result.id}-${i}`}
              href={`#${result.id}`}
              onClick={onClose}
              className="article-search-result"
            >
              <p className="article-search-result-heading">{result.heading}</p>
              <p className="article-search-result-snippet">{result.snippet}</p>
            </a>
          ))}
          {!query.trim() ? (
            <p className="article-search-empty">
              Search headings, bullets, callouts, and high-yield notes
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
