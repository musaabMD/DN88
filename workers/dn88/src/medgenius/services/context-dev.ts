import { sanitizeUserError } from "./user-errors";

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
  creditsConsumed?: number;
  creditsRemaining?: number;
};

/**
 * Parse uploaded document content (called once per upload).
 * Uses Context.dev POST /parse with raw bytes per OpenAPI spec.
 * Falls back to plain-text extraction when the API key is unavailable.
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

  const extension = extractExtension(params.filename);
  const url = new URL("https://api.context.dev/v1/parse");
  url.searchParams.set("extension", extension);
  url.searchParams.set("includeLinks", "true");
  url.searchParams.set("ocr", "true");
  url.searchParams.set("client", "drnote");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/octet-stream",
    },
    body: params.fileBytes,
  });

  const payload = (await response.json()) as {
    success?: boolean;
    markdown?: string;
    type?: string;
    message?: string;
    key_metadata?: {
      credits_consumed?: number;
      credits_remaining?: number;
    };
  };

  if (!response.ok || !payload.markdown) {
    throw new Error(
      sanitizeUserError(
        payload.message ?? "Document parse failed",
        "parse"
      )
    );
  }

  const markdown = payload.markdown;
  return {
    markdown,
    pageCount: estimatePageCount(markdown),
    images: [],
    jobId: crypto.randomUUID(),
    creditsConsumed: payload.key_metadata?.credits_consumed,
    creditsRemaining: payload.key_metadata?.credits_remaining,
  };
}

function extractExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return "txt";
  return filename.slice(dot + 1).toLowerCase();
}

async function fallbackParse(params: {
  fileBytes: ArrayBuffer;
  filename: string;
  mimeType: string;
}): Promise<ContextDevParseResult> {
  const text = new TextDecoder().decode(params.fileBytes);
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();

  if (cleaned.length < 50 && params.mimeType !== "text/plain") {
    throw new Error(sanitizeUserError("Could not extract text from this file", "parse"));
  }

  const markdown = `# ${params.filename}\n\n${cleaned || "_No extractable text in this file._"}`;
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
