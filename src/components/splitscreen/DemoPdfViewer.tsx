"use client";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { HomeReadPage } from "@/lib/medgenius/home-data";

type DemoPdfPage = {
  heading: string;
  paragraphs: string[];
  callout?: string;
};

const HIGHLIGHT_COLOR = "#FEF08A";

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

export function DemoPdfViewer({
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
  const [ask, setAsk] = useState<{ x: number; y: number; text: string } | null>(null);

  const current = pages[page - 1];

  const onMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (text.length <= 2 || !sel?.rangeCount) {
      setAsk(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    try {
      document.execCommand("hiliteColor", false, HIGHLIGHT_COLOR);
    } catch {
      /* selection may not support hiliteColor */
    }
    setAsk({ x: rect.left + rect.width / 2, y: rect.top - 8, text });
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#EEF2F6]">
      <div className="min-h-0 flex-1 overflow-auto p-4" onMouseUp={onMouseUp}>
        <article className="mx-auto max-w-[620px] rounded-xl border border-[#D1D5DB] bg-white px-8 py-10 shadow-[0_18px_50px_rgba(15,23,42,0.12)] selection:bg-[#FEF08A]">
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
