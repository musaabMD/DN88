"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import type { JSONContent } from "@tiptap/react";
import { Check, Copy, Highlighter, X } from "lucide-react";

type HighlightRun = {
  id: string;
  text: string;
  color: string | null;
  blockId: string | null;
  section: string | null;
};

function extractHighlights(doc: JSONContent): HighlightRun[] {
  const runs: HighlightRun[] = [];
  let section: string | null = null;
  let blockId: string | null = null;
  let counter = 0;

  // Pending run accumulator so adjacent highlighted text merges into a phrase.
  let pending: { text: string; color: string | null; blockId: string | null; section: string | null } | null =
    null;

  const flush = () => {
    if (pending && pending.text.trim()) {
      runs.push({ id: `hl-${counter++}`, ...pending, text: pending.text.trim() });
    }
    pending = null;
  };

  const walk = (node: JSONContent) => {
    const type = node.type;
    const attrs = node.attrs as Record<string, unknown> | undefined;

    if (attrs && typeof attrs["data-block-id"] === "string") {
      blockId = attrs["data-block-id"] as string;
    }
    if (type === "heading" && (attrs?.level === 2 || attrs?.level === 3)) {
      const text = (node.content ?? [])
        .map((child) => child.text ?? "")
        .join("");
      if (text) section = text;
    }

    if (type === "text") {
      const marks = node.marks ?? [];
      const highlight = marks.find((mark) => mark.type === "highlight");
      if (highlight) {
        const color =
          (highlight.attrs?.color as string | undefined) ?? null;
        if (pending && pending.color === color && pending.blockId === blockId) {
          pending.text += node.text ?? "";
        } else {
          flush();
          pending = {
            text: node.text ?? "",
            color,
            blockId,
            section,
          };
        }
      } else {
        flush();
      }
      return;
    }

    if (node.content) {
      for (const child of node.content) walk(child);
      flush();
    }
  };

  if (doc.content) for (const child of doc.content) walk(child);
  flush();
  return runs;
}

/**
 * "My highlights" — a floating panel listing every highlight the reader has
 * made, with jump-to-location (via stable block anchors) and copy-with-citation.
 */
export function HighlightsPanel({
  editor,
  articleTitle,
  containerSelector = ".simple-editor-scroll",
}: {
  editor: Editor;
  articleTitle: string;
  containerSelector?: string;
}) {
  const [open, setOpen] = useState(false);
  const [runs, setRuns] = useState<HighlightRun[]>(() =>
    extractHighlights(editor.getJSON())
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setRuns(extractHighlights(editor.getJSON()));
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor]);

  const jumpTo = (run: HighlightRun) => {
    const container = document.querySelector(containerSelector);
    if (!(container instanceof HTMLElement)) return;
    const el = run.blockId
      ? container.querySelector<HTMLElement>(`[data-block-id="${run.blockId}"]`)
      : null;
    const target = el ?? container.querySelector<HTMLElement>("mark");
    if (target) {
      const offset =
        target.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        80;
      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
      target.classList.add("reader-flash");
      window.setTimeout(() => target.classList.remove("reader-flash"), 1200);
    }
    setOpen(false);
  };

  const copyWithCitation = async (run: HighlightRun) => {
    const citation = run.section
      ? `“${run.text}” — ${articleTitle} › ${run.section}, DrNote`
      : `“${run.text}” — ${articleTitle}, DrNote`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopiedId(run.id);
      window.setTimeout(() => setCopiedId(null), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="reader-highlights">
      {open ? (
        <div className="reader-highlights-panel" role="dialog" aria-label="My highlights">
          <div className="reader-highlights-head">
            <span className="reader-highlights-title">
              My highlights
              <span className="reader-highlights-count">{runs.length}</span>
            </span>
            <button
              type="button"
              className="reader-highlights-close"
              aria-label="Close highlights"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          {runs.length === 0 ? (
            <p className="reader-highlights-empty">
              Select text and pick a color to highlight it. Your highlights are
              saved and collected here.
            </p>
          ) : (
            <ul className="reader-highlights-list">
              {runs.map((run) => (
                <li key={run.id} className="reader-highlights-item">
                  <button
                    type="button"
                    className="reader-highlights-quote"
                    onClick={() => jumpTo(run)}
                    style={
                      run.color
                        ? { borderLeftColor: run.color }
                        : undefined
                    }
                  >
                    {run.section ? (
                      <span className="reader-highlights-section">
                        {run.section}
                      </span>
                    ) : null}
                    <span className="reader-highlights-text">{run.text}</span>
                  </button>
                  <button
                    type="button"
                    className="reader-highlights-copy"
                    title="Copy with citation"
                    aria-label="Copy with citation"
                    onClick={() => copyWithCitation(run)}
                  >
                    {copiedId === run.id ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <button
        type="button"
        className="reader-highlights-fab"
        aria-label={open ? "Close highlights" : "Open my highlights"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Highlighter size={18} />
        {runs.length > 0 ? (
          <span className="reader-highlights-badge">{runs.length}</span>
        ) : null}
      </button>
    </div>,
    document.body
  );
}
