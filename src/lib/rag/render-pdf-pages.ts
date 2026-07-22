/**
 * Client-side PDF page rendering helpers for the /rag lab.
 * Renders pages for review and preserves native text line breaks for local extraction.
 */

export type RenderedPdfPage = {
  pageNumber: number;
  pageText: string;
  textSource: "native" | "ocr" | "native+ocr" | "none";
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
    hasEOL?: boolean;
    transform?: number[];
    width?: number;
    height?: number;
  }>;

  const sequencedText = items
    .map((item) => {
      const text = item.str ?? "";
      if (!text.trim()) return "";
      return `${text}${item.hasEOL ? "\n" : " "}`;
    })
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (sequencedText.length > 40) {
    return sequencedText;
  }

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

async function recognizePageText(imageDataUrl: string) {
  const { recognize } = await import("tesseract.js");
  const result = await recognize(imageDataUrl, "eng+ara");
  return result.data.text
    .replace(/\u00d9/g, "ff")
    .replace(/\u00fb/g, "fi")
    .replace(/\u00f9/g, "fi")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mergeNativeAndOcrText(nativeText: string, ocrText: string) {
  const native = nativeText.trim();
  const ocr = ocrText.trim();

  if (!native) return ocr;
  if (!ocr) return native;
  if (ocr.length > native.length * 1.4) return ocr;
  if (native.length > ocr.length * 1.4) return native;
  return `${native}\n\n${ocr}`;
}

function countMeaningfulText(text: string) {
  return (text.match(/[\p{L}\p{N}]/gu) ?? []).length;
}

export async function renderPdfPages(
  file: File,
  options?: {
    maxPages?: number;
    scale?: number;
    renderImages?: boolean;
    ocr?: "never" | "auto" | "always";
    ocrMinChars?: number;
    onProgress?: (done: number, total: number, label?: string) => void;
  },
): Promise<RenderedPdfPage[]> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const total = Math.min(doc.numPages, options?.maxPages ?? doc.numPages);
  const scale = options?.scale ?? 1.5;
  const renderImages = options?.renderImages ?? true;
  const ocrMode = options?.ocr ?? "never";
  const ocrMinChars = options?.ocrMinChars ?? 140;
  const pages: RenderedPdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
    options?.onProgress?.(pageNumber, total, "render");
    const page = await doc.getPage(pageNumber);
    let pageImageUrl = "";
    const baseViewport = page.getViewport({ scale: 1 });
    const width = Math.floor(baseViewport.width * scale);
    const height = Math.floor(baseViewport.height * scale);
    const textContent = await page.getTextContent();
    const nativeText = extractTextLines(textContent);
    const shouldOcr =
      ocrMode === "always" ||
      (ocrMode === "auto" && countMeaningfulText(nativeText) < ocrMinChars);
    const needsCanvas = renderImages || shouldOcr;
    let canvas: HTMLCanvasElement | null = null;

    if (needsCanvas) {
      const viewport = page.getViewport({ scale });
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      if (renderImages) {
        pageImageUrl = canvas.toDataURL("image/jpeg", 0.82);
      }
    }

    let ocrText = "";

    if (canvas && shouldOcr) {
      options?.onProgress?.(pageNumber, total, "ocr");
      ocrText = await recognizePageText(pageImageUrl || canvas.toDataURL("image/jpeg", 0.82));
    }

    const pageText = mergeNativeAndOcrText(nativeText, ocrText);
    const textSource =
      nativeText.trim() && ocrText.trim()
        ? "native+ocr"
        : ocrText.trim()
          ? "ocr"
          : nativeText.trim()
            ? "native"
            : "none";

    pages.push({
      pageNumber,
      pageText,
      textSource,
      pageImageUrl,
      width,
      height,
    });

    options?.onProgress?.(pageNumber, total, textSource);
  }

  return pages;
}
