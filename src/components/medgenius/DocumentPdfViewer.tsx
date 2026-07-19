"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
};

export function DocumentPdfViewer({ documentId, pageCount = 1 }: DocumentPdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(pageCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  if (loading) {
    return <div className="dn-pdf-state">Loading PDF…</div>;
  }

  if (error) {
    return <div className="dn-pdf-state dn-pdf-error">{error}</div>;
  }

  return (
    <div className="dn-pdf-wrap">
      <div className="dn-pdf-page">
        <canvas ref={canvasRef} className="dn-pdf-canvas" />
        <div ref={textLayerRef} className="dn-pdf-text-layer textLayer" />
      </div>
      <div className="dn-pdf-pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
          <ChevronLeft size={18} />
        </button>
        <span>
          Page {page} of {totalPages}
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
    </div>
  );
}
