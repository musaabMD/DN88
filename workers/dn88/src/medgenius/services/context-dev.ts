export type ContextDevParseResult = {
  markdown: string;
  pageCount: number;
  images: Array<{
    url: string;
    page: number;
    type?: string;
    alt?: string;
  }>;
  jobId: string;
};

/**
 * Parse a document via Context.dev (called once per upload, never again).
 * Falls back to plain-text extraction when Context.dev is not configured.
 */
export async function parseDocumentWithContextDev(
  apiKey: string | undefined,
  params: {
    fileBytes: ArrayBuffer;
    filename: string;
    mimeType: string;
  }
): Promise<ContextDevParseResult> {
  if (!apiKey) {
    return fallbackParse(params);
  }

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([params.fileBytes], { type: params.mimeType }),
    params.filename
  );
  formData.append("output_format", "markdown");
  formData.append("ocr", "auto");

  const response = await fetch("https://api.context.dev/v1/parse", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Context.dev parse failed: ${errorText.slice(0, 500)}`);
  }

  const payload = (await response.json()) as {
    job_id?: string;
    markdown?: string;
    page_count?: number;
    images?: Array<{ url: string; page: number; type?: string; alt?: string }>;
  };

  if (!payload.markdown) {
    throw new Error("Context.dev returned no markdown content");
  }

  return {
    markdown: payload.markdown,
    pageCount: payload.page_count ?? estimatePageCount(payload.markdown),
    images: payload.images ?? [],
    jobId: payload.job_id ?? crypto.randomUUID(),
  };
}

async function fallbackParse(params: {
  fileBytes: ArrayBuffer;
  filename: string;
  mimeType: string;
}): Promise<ContextDevParseResult> {
  const text = new TextDecoder().decode(params.fileBytes);
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();

  if (cleaned.length < 50 && params.mimeType !== "text/plain") {
    throw new Error(
      "Context.dev API key not configured. Binary documents require Context.dev for OCR and parsing."
    );
  }

  const markdown = `# ${params.filename}\n\n${cleaned || "_No extractable text. Configure CONTEXT_DEV_API_KEY for PDF/OCR support._"}`;
  return {
    markdown,
    pageCount: estimatePageCount(markdown),
    images: [],
    jobId: `fallback-${crypto.randomUUID()}`,
  };
}

function estimatePageCount(markdown: string): number {
  const explicit = markdown.match(/<!--\s*pages:\s*(\d+)\s*-->/i);
  if (explicit?.[1]) return parseInt(explicit[1], 10);

  const pageBreaks = (markdown.match(/\f/g) ?? []).length;
  if (pageBreaks > 0) return pageBreaks + 1;

  return Math.max(1, Math.ceil(markdown.length / 3000));
}

export async function computeFileHash(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
