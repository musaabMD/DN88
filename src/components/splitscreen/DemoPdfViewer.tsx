"use client";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { HomeReadPage } from "@/lib/medgenius/home-data";
import { SS } from "@/components/splitscreen/splitscreen-theme";

type DemoPdfPage = {
  heading: string;
  paragraphs: string[];
  callout?: string;
};

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
      document.execCommand("hiliteColor", false, SS.highlight);
    } catch {
      /* selection may not support hiliteColor */
    }
    setAsk({ x: rect.left + rect.width / 2, y: rect.top - 8, text });
  }, []);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-auto bg-white p-4" onMouseUp={onMouseUp}>
        <article
          className="mx-auto max-w-[620px] rounded-xl border bg-white px-8 py-10 shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
          style={{ borderColor: SS.panelBorder }}
        >
          <header
            className="mb-6 border-b pb-4"
            style={{ borderColor: SS.panelBorder }}
          >
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
              style={{ color: SS.faint }}
            >
              {fileName}
            </p>
            <h2 className="mt-1 text-xl font-black" style={{ color: SS.ink }}>
              {current?.heading ?? "Page"}
            </h2>
            <p className="mt-1 text-xs font-bold" style={{ color: SS.sub }}>
              Page {page} of {pages.length}
            </p>
          </header>
          {current?.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="mb-4 text-[15px] leading-7 font-semibold"
              style={{ color: SS.ink }}
            >
              {paragraph}
            </p>
          ))}
          {current?.callout ? (
            <div
              className="rounded-xl border-l-4 px-4 py-3 text-sm font-bold"
              style={{
                borderColor: SS.green,
                background: SS.calloutBg,
                color: SS.calloutText,
              }}
            >
              {current.callout}
            </div>
          ) : null}
        </article>
      </div>

      <div
        className="flex shrink-0 items-center justify-center gap-3 border-t bg-white px-3 py-2 text-sm font-bold"
        style={{ borderColor: SS.panelBorder, color: SS.sub }}
      >
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40"
          style={{ borderColor: SS.panelBorder }}
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
          className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40"
          style={{ borderColor: SS.panelBorder }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {ask && onAskSelection ? (
        <button
          type="button"
          className="fixed z-[220] inline-flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-white shadow-lg"
          style={{ left: ask.x, top: ask.y, background: SS.ink }}
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
