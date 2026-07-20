"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Highlighter, Sparkles } from "lucide-react";
import { fetchDocumentFileBlob } from "@/lib/medgenius/api";
import { getClerkToken } from "@/lib/clerk-token";

type PdfJsModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

type DocumentPdfViewerProps = {
  documentId: string;
  pageCount?: number;
  onAskSelection?: (text: string) => void;
  showAnnotationToolbar?: boolean;
};

const HIGHLIGHT_COLORS = [
  { id: "yellow", bg: "#FEF08A" },
  { id: "green", bg: "#BBF7D0" },
  { id: "blue", bg: "#BFDBFE" },
  { id: "pink", bg: "#FBCFE8" },
] as const;

export function DocumentPdfViewer({
  documentId,
  pageCount = 1,
  onAskSelection,
  showAnnotationToolbar = false,
}: DocumentPdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(pageCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotateMode, setAnnotateMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState<(typeof HIGHLIGHT_COLORS)[number]["bg"]>(
    HIGHLIGHT_COLORS[0].bg
  );
  const [ask, setAsk] = useState<{ x: number; y: number; text: string } | null>(null);
  const renderTaskRef = useRef<import("pdfjs-dist").RenderTask | null>(null);

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getClerkToken();
        if (!token) throw new Error("Sign in required");
        const blob = await fetchDocumentFileBlob(token, documentId);
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument(blobUrl).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPage(1);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      void pdfDoc?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when document changes
  }, [documentId]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        renderTaskRef.current?.cancel();
        const pdfPage = await pdfDoc.getPage(page);
        if (cancelled) return;

        const viewport = pdfPage.getViewport({ scale: 1.35 });
        const canvas = canvasRef.current;
        const textLayerEl = textLayerRef.current;
        if (!canvas || !textLayerEl) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        textLayerEl.style.width = `${viewport.width}px`;
        textLayerEl.style.height = `${viewport.height}px`;
        textLayerEl.innerHTML = "";

        const renderTask = pdfPage.render({ canvasContext: context, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        const textContent = await pdfPage.getTextContent();
        const pdfjs = await loadPdfJs();
        const textLayerView = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayerEl,
          viewport,
        });
        await textLayerView.render();
      } catch {
        /* render cancelled or failed */
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdfDoc, page]);

  const onMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (text.length <= 2 || !sel?.rangeCount) {
      setAsk(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (annotateMode) {
      try {
        document.execCommand("hiliteColor", false, highlightColor);
      } catch {
        /* browser may block hiliteColor on PDF text layer */
      }
      window.getSelection()?.removeAllRanges();
      setAsk(null);
      return;
    }
    setAsk({ x: rect.left + rect.width / 2, y: rect.top - 8, text });
  }, [annotateMode, highlightColor]);

  if (loading) {
    return <div className="dn-pdf-state">Loading PDF…</div>;
  }

  if (error) {
    return <div className="dn-pdf-state dn-pdf-error">{error}</div>;
  }

  return (
    <div className="dn-pdf-wrap">
      {showAnnotationToolbar ? (
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
                setHighlightColor(item.bg);
                setAnnotateMode(true);
              }}
              className={`h-6 w-6 rounded-full border-2 ${
                highlightColor === item.bg && annotateMode ? "border-[#334155]" : "border-white"
              }`}
              style={{ background: item.bg }}
              aria-label={`Highlight ${item.id}`}
            />
          ))}
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
            Select text to highlight or ask
          </span>
        </div>
      ) : null}
      <div className="dn-pdf-page" ref={pageWrapRef} onMouseUp={onMouseUp}>
        <canvas ref={canvasRef} className="dn-pdf-canvas" />
        <div ref={textLayerRef} className="dn-pdf-text-layer textLayer" />
      </div>
      <div className="dn-pdf-pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
          <ChevronLeft size={18} />
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
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
