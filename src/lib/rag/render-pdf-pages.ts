/**
 * Client-side PDF page rendering helpers for the /rag lab.
 * Renders pages to data-URL PNGs for Trigger.dev vision extraction.
 */

export type RenderedPdfPage = {
  pageNumber: number;
  pageText: string;
  pageImageUrl: string;
  width: number;
  height: number;
};

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function renderPdfPages(
  file: File,
  options?: {
    maxPages?: number;
    scale?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<RenderedPdfPage[]> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const total = Math.min(doc.numPages, options?.maxPages ?? doc.numPages);
  const scale = options?.scale ?? 1.5;
  const pages: RenderedPdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    await page.render({ canvasContext: ctx, viewport }).promise;

    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNumber,
      pageText,
      pageImageUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    });

    options?.onProgress?.(pageNumber, total);
  }

  return pages;
}
