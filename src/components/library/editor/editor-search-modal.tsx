"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";

type SearchHit = {
  id: string;
  heading: string;
  snippet: string;
};

function collectTextFromDoc(editor: Editor): SearchHit[] {
  const hits: SearchHit[] = [];
  let currentHeading = "";

  editor.state.doc.descendants((node) => {
    if (node.type.name === "heading" && node.attrs.level === 2) {
      currentHeading = node.textContent;
    }
    if (node.isText && node.text) {
      const text = node.text.trim();
      if (text.length > 0) {
        hits.push({
          id: currentHeading ? sectionSlug(currentHeading) : "",
          heading: currentHeading || "Introduction",
          snippet: text,
        });
      }
    }
  });

  return hits;
}

export function EditorSearchModal({
  editor,
  onClose,
  onNavigate,
}: {
  editor: Editor;
  onClose: () => void;
  onNavigate: (headingId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const allHits = useMemo(() => collectTextFromDoc(editor), [editor]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allHits.filter(
      (hit) =>
        hit.snippet.toLowerCase().includes(q) ||
        hit.heading.toLowerCase().includes(q)
    );
  }, [allHits, query]);

  return (
    <div
      className="simple-editor-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="simple-editor-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search article"
      >
        <div className="simple-editor-modal-header">
          <Search size={18} strokeWidth={2.5} className="shrink-0 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this article..."
            className="simple-editor-modal-input"
          />
          <button
            type="button"
            onClick={onClose}
            className="simple-editor-icon-btn"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="simple-editor-modal-body">
          {query.trim() && results.length === 0 ? (
            <p className="simple-editor-modal-empty">No matches found</p>
          ) : null}
          {results.slice(0, 40).map((result, i) => (
            <button
              key={`${result.id}-${i}`}
              type="button"
              className="simple-editor-search-hit"
              onClick={() => {
                onNavigate(result.id);
                onClose();
              }}
            >
              <p className="simple-editor-search-hit-heading">{result.heading}</p>
              <p className="simple-editor-search-hit-snippet">{result.snippet}</p>
            </button>
          ))}
          {!query.trim() ? (
            <p className="simple-editor-modal-empty">
              Search headings, paragraphs, and highlights
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
