"use client";

import { ChevronLeft, ChevronRight, Highlighter, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { HomeReadPage } from "@/lib/medgenius/home-data";

type DemoPdfPage = {
  heading: string;
  paragraphs: string[];
  callout?: string;
};

const HIGHLIGHT_COLORS = [
  { id: "yellow", bg: "#FEF08A", label: "Yellow" },
  { id: "green", bg: "#BBF7D0", label: "Green" },
  { id: "blue", bg: "#BFDBFE", label: "Blue" },
  { id: "pink", bg: "#FBCFE8", label: "Pink" },
] as const;

type HighlightColorId = (typeof HIGHLIGHT_COLORS)[number]["id"];

function buildDemoPages(readPages: HomeReadPage[], totalPages: number): DemoPdfPage[] {
  if (totalPages <= 0) return [];
  const pages: DemoPdfPage[] = [];
  for (let index = 0; index < totalPages; index += 1) {
    const source = readPages[index % readPages.length];
    if (!source) {
      pages.push({
        heading: `Page ${index + 1}`,
        paragraphs: ["Demo content unavailable."],
      });
      continue;
    }
    pages.push({
      heading: source.h,
      paragraphs: source.body,
      callout: source.key,
    });
  }
  return pages;
}

type StoredHighlight = {
  page: number;
  text: string;
  color: HighlightColorId;
};

function loadHighlights(fileId: string): StoredHighlight[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`dn-split-hl-${fileId}`);
    return raw ? (JSON.parse(raw) as StoredHighlight[]) : [];
  } catch {
    return [];
  }
}

function saveHighlights(fileId: string, highlights: StoredHighlight[]) {
  localStorage.setItem(`dn-split-hl-${fileId}`, JSON.stringify(highlights));
}

export function DemoPdfViewer({
  fileId,
  fileName,
  pageCount,
  readPages,
  onAskSelection,
}: {
  fileId: string;
  fileName: string;
  pageCount: number;
  readPages: HomeReadPage[];
  onAskSelection?: (text: string) => void;
}) {
  const pages = useMemo(() => buildDemoPages(readPages, pageCount), [readPages, pageCount]);
  const [page, setPage] = useState(1);
  const [annotateMode, setAnnotateMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState<HighlightColorId>("yellow");
  const [highlights, setHighlights] = useState<StoredHighlight[]>(() => loadHighlights(fileId));
  const [ask, setAsk] = useState<{ x: number; y: number; text: string } | null>(null);

  const current = pages[page - 1];
  const pageHighlights = highlights.filter((item) => item.page === page);

  const persistHighlights = useCallback(
    (next: StoredHighlight[]) => {
      setHighlights(next);
      saveHighlights(fileId, next);
    },
    [fileId]
  );

  const onMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (text.length <= 2 || !sel?.rangeCount) {
      setAsk(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setAsk({ x: rect.left + rect.width / 2, y: rect.top - 8, text });

    if (annotateMode) {
      persistHighlights([
        ...highlights.filter((item) => !(item.page === page && item.text === text)),
        { page, text, color: highlightColor },
      ]);
      window.getSelection()?.removeAllRanges();
      setAsk(null);
    }
  }, [annotateMode, highlightColor, highlights, page, persistHighlights]);

  const colorMap = Object.fromEntries(HIGHLIGHT_COLORS.map((item) => [item.id, item.bg])) as Record<
    HighlightColorId,
    string
  >;

  return (
    <div className="flex h-full flex-col bg-[#EEF2F6]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#E5E7EB] bg-white/90 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => setAnnotateMode((value) => !value)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${
            annotateMode ? "bg-[#FEF08A] text-[#854D0E]" : "bg-[#F8FAFC] text-[#64748B]"
          }`}
        >
          <Highlighter size={14} />
          Annotate
        </button>
        {HIGHLIGHT_COLORS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setHighlightColor(item.id);
              setAnnotateMode(true);
            }}
            className={`h-6 w-6 rounded-full border-2 ${
              highlightColor === item.id && annotateMode ? "border-[#334155]" : "border-white"
            }`}
            style={{ background: item.bg }}
            title={item.label}
            aria-label={item.label}
          />
        ))}
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
          Demo PDF · select text to highlight or ask
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4" onMouseUp={onMouseUp}>
        <article className="mx-auto max-w-[620px] rounded-xl border border-[#D1D5DB] bg-white px-8 py-10 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          <header className="mb-6 border-b border-[#E5E7EB] pb-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#94A3B8]">{fileName}</p>
            <h2 className="mt-1 text-xl font-black text-[#111827]">{current?.heading ?? "Page"}</h2>
            <p className="mt-1 text-xs font-bold text-[#64748B]">
              Page {page} of {pages.length}
            </p>
          </header>
          {current?.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-4 text-[15px] leading-7 font-semibold text-[#1F2937]">
              {paragraph}
            </p>
          ))}
          {current?.callout ? (
            <div className="rounded-xl border-l-4 border-[#58CC02] bg-[#F0FDF4] px-4 py-3 text-sm font-bold text-[#166534]">
              {current.callout}
            </div>
          ) : null}
          {pageHighlights.length > 0 ? (
            <div className="mt-6 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#94A3B8]">Highlights</p>
              {pageHighlights.map((item) => (
                <div
                  key={`${item.text}-${item.color}`}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#1F2937]"
                  style={{ background: colorMap[item.color] }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 border-t border-[#E5E7EB] bg-white px-3 py-2 text-sm font-bold text-[#64748B]">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#E5E7EB] disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          {page} / {pages.length}
        </span>
        <button
          type="button"
          disabled={page >= pages.length}
          onClick={() => setPage((value) => value + 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#E5E7EB] disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {ask && onAskSelection ? (
        <button
          type="button"
          className="fixed z-[220] inline-flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-xl bg-[#111827] px-3 py-2 text-xs font-extrabold text-white shadow-lg"
          style={{ left: ask.x, top: ask.y }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onAskSelection(ask.text);
            setAsk(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <Sparkles size={13} />
          Ask AI
        </button>
      ) : null}
    </div>
  );
}
