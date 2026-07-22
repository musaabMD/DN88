/**
 * Client-side PDF page rendering helpers for the /rag lab.
 * Renders pages for review and preserves native text line breaks for local extraction.
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

function extractTextLines(textContent: { items: unknown[] }) {
  const items = textContent.items as Array<{
    str?: string;
    transform?: number[];
    width?: number;
    height?: number;
  }>;
  const rows: Array<{ y: number; x: number; text: string }> = [];

  for (const item of items) {
    const text = item.str?.trim();
    const transform = item.transform;

    if (!text || !Array.isArray(transform)) {
      continue;
    }

    rows.push({
      x: Number(transform[4] ?? 0),
      y: Number(transform[5] ?? 0),
      text,
    });
  }

  return rows
    .sort((a, b) => Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x)
    .reduce<Array<{ y: number; parts: string[] }>>((lines, item) => {
      const current = lines.at(-1);

      if (!current || Math.abs(current.y - item.y) > 3) {
        lines.push({ y: item.y, parts: [item.text] });
      } else {
        current.parts.push(item.text);
      }

      return lines;
    }, [])
    .map((line) => line.parts.join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export async function renderPdfPages(
  file: File,
  options?: {
    maxPages?: number;
    scale?: number;
    renderImages?: boolean;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<RenderedPdfPage[]> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const total = Math.min(doc.numPages, options?.maxPages ?? doc.numPages);
  const scale = options?.scale ?? 1.5;
  const renderImages = options?.renderImages ?? true;
  const pages: RenderedPdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    let pageImageUrl = "";
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    if (renderImages) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      await page.render({ canvasContext: ctx, viewport }).promise;
      pageImageUrl = canvas.toDataURL("image/png");
    }

    const textContent = await page.getTextContent();
    const pageText = extractTextLines(textContent);

    pages.push({
      pageNumber,
      pageText,
      pageImageUrl,
      width,
      height,
    });

    options?.onProgress?.(pageNumber, total);
  }

  return pages;
}
