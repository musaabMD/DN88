"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { SplitScreenPager } from "@/components/splitscreen/SplitScreenPager";
import { SS } from "@/components/splitscreen/splitscreen-theme";
import type { HomeReadPage } from "@/lib/medgenius/home-data";
import { renderMarkdownSlice } from "@/lib/medgenius/render-markdown-slice";
import {
  readPagesToPaginatedMarkdown,
  splitMarkdownIntoPages,
} from "@/lib/medgenius/split-markdown-pages";

function tryHighlightSelection(range: Range): void {
  try {
    const mark = document.createElement("mark");
    mark.className = "ss-md-highlight";
    mark.style.backgroundColor = SS.highlight;
    range.surroundContents(mark);
  } catch {
    try {
      document.execCommand("hiliteColor", false, SS.highlight);
    } catch {
      /* selection may not support highlighting */
    }
  }
}

export function ParsedMarkdownViewer({
  fileName,
  pageCount,
  rawMarkdown,
  readPages,
  loading,
  onAskSelection,
}: {
  fileName: string;
  pageCount: number;
  rawMarkdown?: string | null;
  readPages: HomeReadPage[];
  loading?: boolean;
  onAskSelection?: (text: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [ask, setAsk] = useState<{ x: number; y: number; text: string } | null>(null);

  const markdown = useMemo(() => {
    if (rawMarkdown?.trim()) return rawMarkdown.trim();
    if (readPages.length > 0) {
      return readPagesToPaginatedMarkdown(readPages, fileName, pageCount);
    }
    return "";
  }, [rawMarkdown, readPages, fileName, pageCount]);

  const pages = useMemo(
    () => splitMarkdownIntoPages(markdown, pageCount > 0 ? pageCount : undefined),
    [markdown, pageCount]
  );

  const totalPages = Math.max(1, pages.length);
  const safePage = Math.min(page, totalPages);
  const pageHtml = useMemo(
    () => renderMarkdownSlice(pages[safePage - 1] ?? ""),
    [pages, safePage]
  );

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (text.length <= 2 || !sel?.rangeCount) {
      setAsk(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    tryHighlightSelection(range.cloneRange());
    setAsk({ x: rect.left + rect.width / 2, y: rect.top - 8, text });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-white p-6 text-sm font-semibold" style={{ color: SS.sub }}>
        Loading parsed document…
      </div>
    );
  }

  if (!markdown) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-white p-6 text-sm font-semibold" style={{ color: SS.sub }}>
        Parsed text not available yet
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div
        className="ss-md-scroll min-h-0 flex-1 overflow-auto bg-white p-4 pb-2 select-text selection:bg-[#FFF3B0]/90"
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
      >
        <article
          className="ss-md-article mx-auto max-w-[620px] rounded-xl border bg-white px-8 py-10 shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
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
            <p className="mt-1 text-xs font-bold" style={{ color: SS.sub }}>
              Page {safePage} of {totalPages}
            </p>
          </header>
          <div
            className="ss-md-body text-[15px] leading-7 font-semibold [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-black [&_h3]:mb-3 [&_h3]:text-[17px] [&_h3]:font-extrabold [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-[#1CB0F6] [&_a]:underline [&_mark]:rounded-sm [&_mark]:bg-[#FFF3B0]"
            style={{ color: SS.ink }}
            dangerouslySetInnerHTML={{ __html: pageHtml }}
          />
        </article>
      </div>

      <SplitScreenPager page={safePage} totalPages={totalPages} onPageChange={setPage} />

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
