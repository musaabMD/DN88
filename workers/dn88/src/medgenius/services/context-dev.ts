import { sanitizeUserError } from "./user-errors";
import { mergePageRangeMarkdown } from "../mcq/markdown-pages";
import { isCorruptParsedMarkdown, markdownNeedsOcrRetry } from "./markdown-quality";

/** Context.dev Parse API body limit (25 MiB). */
export const CONTEXT_DEV_PARSE_MAX_BYTES = 25 * 1024 * 1024;

export const CONTEXT_DEV_PARSE_URL = "https://api.context.dev/v1/parse";

export type ContextDevErrorCode =
  | "INPUT_VALIDATION_ERROR"
  | "WEBSITE_ACCESS_ERROR"
  | "UNSUPPORTED_CONTENT"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "AUTH_ERROR"
  | "UNKNOWN";

export type ContextDevParseOptions = {
  /** Preserve hyperlinks in HTML/XML/Office output. Default: true. */
  includeLinks?: boolean;
  /** Include image references in HTML/Office output. Default: false. */
  includeImages?: boolean;
  /** Shorten inline base64 image data. Default: true. */
  shortenBase64Images?: boolean;
  /** Strip nav/header/footer from HTML/Office. Default: false. */
  useMainContentOnly?: boolean;
  /**
   * OCR scanned PDF pages or transcribe/describe raster images.
   * When omitted, enabled automatically for PDFs and image formats.
   */
  ocr?: boolean;
  /** 1-based inclusive PDF page range. */
  pdf?: {
    start?: number;
    end?: number;
  };
  /** Optional client identifier for usage attribution. */
  client?: string;
};

export type ContextDevParseParams = {
  fileBytes: ArrayBuffer;
  filename: string;
  mimeType: string;
  options?: ContextDevParseOptions;
};

export type ContextDevParseResult = {
  markdown: string;
  type: string;
  pageCount: number;
  images: Array<{
    url: string;
    page: number;
    type?: string;
    alt?: string;
  }>;
  jobId: string;
  creditsConsumed: number;
  creditsRemaining?: number;
};

type ContextDevParseResponse = {
  success?: boolean;
  markdown?: string;
  type?: string;
  message?: string;
  error_code?: ContextDevErrorCode | string;
  key_metadata?: {
    credits_consumed?: number;
    credits_remaining?: number;
  };
};

export class ContextDevParseError extends Error {
  readonly status: number;
  readonly errorCode?: ContextDevErrorCode;
  readonly creditsConsumed?: number;
  readonly creditsRemaining?: number;
  readonly retryable: boolean;

  constructor(params: {
    message: string;
    status: number;
    errorCode?: ContextDevErrorCode;
    creditsConsumed?: number;
    creditsRemaining?: number;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = "ContextDevParseError";
    this.status = params.status;
    this.errorCode = params.errorCode;
    this.creditsConsumed = params.creditsConsumed;
    this.creditsRemaining = params.creditsRemaining;
    this.retryable = params.retryable ?? false;
  }
}

/** Formats that can be read as plain text without Context.dev. */
const PLAIN_TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "html",
  "htm",
]);

const BINARY_PARSE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
  "rtf",
  "epub",
]);

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "jpe",
  "png",
  "gif",
  "bmp",
  "tiff",
  "tif",
  "webp",
  "ppm",
  "pbm",
  "pgm",
  "pnm",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  htm: "text/html",
  csv: "text/csv",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  tiff: "image/tiff",
  tif: "image/tiff",
  bmp: "image/bmp",
};

/**
 * Parse uploaded document content via Context.dev POST /parse.
 * Reads the API key from `CONTEXT_DEV_API_KEY` (passed in by the caller).
 * Falls back to plain-text extraction when the key is unavailable.
 */
export async function parseDocumentWithContextDev(
  apiKey: string | undefined,
  params: ContextDevParseParams
): Promise<ContextDevParseResult> {
  if (!apiKey) {
    return fallbackParse(params);
  }

  assertParseableSize(params.fileBytes.byteLength);

  const extension = extractExtension(params.filename);
  const opts = params.options ?? {};
  const ocr = opts.ocr ?? shouldEnableOcr(extension, params.mimeType);

  const url = buildParseUrl({
    extension,
    includeLinks: opts.includeLinks ?? true,
    includeImages: opts.includeImages ?? false,
    shortenBase64Images: opts.shortenBase64Images ?? true,
    useMainContentOnly: opts.useMainContentOnly ?? false,
    ocr,
    pdf: opts.pdf,
    client: opts.client ?? "drnote",
  });

  const contentType = resolveContentType(params.mimeType, extension);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": contentType,
    },
    body: params.fileBytes,
  });

  const payload = (await response.json()) as ContextDevParseResponse;
  const keyMeta = payload.key_metadata;

  if (!response.ok || payload.success !== true || !payload.markdown) {
    throw mapParseError(response.status, payload);
  }

  const markdown = payload.markdown;
  return {
    markdown,
    type: payload.type ?? extension,
    pageCount: estimatePageCount(markdown, opts.pdf),
    images: [],
    jobId: crypto.randomUUID(),
    creditsConsumed: keyMeta?.credits_consumed ?? 1,
    creditsRemaining: keyMeta?.credits_remaining,
  };
}

/**
 * Parse with OCR enabled for PDFs/images, and retry with OCR when output is too thin.
 */
export async function parseDocumentWithOcrFallback(
  apiKey: string | undefined,
  params: ContextDevParseParams
): Promise<ContextDevParseResult> {
  const extension = extractExtension(params.filename);
  const ocrDefault = shouldEnableOcr(extension, params.mimeType);
  const firstOptions = {
    includeLinks: true,
    includeImages: true,
    shortenBase64Images: true,
    useMainContentOnly: false,
    ...params.options,
    ocr: params.options?.ocr ?? ocrDefault,
  };

  let result = await parseDocumentWithContextDev(apiKey, {
    ...params,
    options: firstOptions,
  });

  if (
    !firstOptions.ocr &&
    markdownNeedsOcrRetry(result.markdown, params.fileBytes.byteLength)
  ) {
    result = await parseDocumentWithContextDev(apiKey, {
      ...params,
      options: { ...firstOptions, ocr: true },
    });
  }

  if (isCorruptParsedMarkdown(result.markdown)) {
    throw new ContextDevParseError({
      status: 415,
      errorCode: "UNSUPPORTED_CONTENT",
      message: sanitizeUserError(
        "Could not extract readable text from this file. For scanned PDFs, ensure the scan is clear and try reprocessing.",
        "parse"
      ),
    });
  }

  return result;
}

const PDF_BATCH_SIZE = 8;

/**
 * Parse a PDF in page batches so each section gets a `<!-- PAGE:n -->` marker.
 * Falls back to single parse when batching fails.
 */
export async function parsePdfWithPageMarkers(
  apiKey: string | undefined,
  params: ContextDevParseParams
): Promise<ContextDevParseResult> {
  if (!apiKey) {
    return parseDocumentWithOcrFallback(apiKey, params);
  }

  const parts: Array<{ startPage: number; markdown: string }> = [];
  let totalCredits = 0;
  let startPage = 1;

  while (startPage <= 500) {
    const endPage = startPage + PDF_BATCH_SIZE - 1;
    try {
      const batch = await parseDocumentWithContextDev(apiKey, {
        ...params,
        options: {
          includeLinks: true,
          includeImages: true,
          shortenBase64Images: true,
          useMainContentOnly: false,
          ocr: params.options?.ocr ?? true,
          pdf: { start: startPage, end: endPage },
          client: params.options?.client ?? "drnote",
        },
      });

      const trimmed = batch.markdown.trim();
      if (trimmed.length < 40) break;

      parts.push({ startPage, markdown: trimmed });
      totalCredits += batch.creditsConsumed;
      startPage = endPage + 1;
    } catch {
      break;
    }
  }

  if (parts.length === 0) {
    return parseDocumentWithOcrFallback(apiKey, params);
  }

  const markdown = mergePageRangeMarkdown(parts);
  return {
    markdown,
    type: "pdf",
    pageCount: parts.length > 0 ? startPage - 1 : estimatePageCount(markdown),
    images: [],
    jobId: crypto.randomUUID(),
    creditsConsumed: totalCredits,
  };
}

function assertParseableSize(byteLength: number): void {
  if (byteLength <= 0) {
    throw new ContextDevParseError({
      status: 400,
      errorCode: "INPUT_VALIDATION_ERROR",
      message: sanitizeUserError("File is empty", "parse"),
    });
  }

  if (byteLength > CONTEXT_DEV_PARSE_MAX_BYTES) {
    throw new ContextDevParseError({
      status: 413,
      errorCode: "INPUT_VALIDATION_ERROR",
      message: sanitizeUserError(
        "File is too large. Maximum size is 25 MB.",
        "parse"
      ),
    });
  }
}

function buildParseUrl(params: {
  extension: string;
  includeLinks: boolean;
  includeImages: boolean;
  shortenBase64Images: boolean;
  useMainContentOnly: boolean;
  ocr: boolean;
  pdf?: { start?: number; end?: number };
  client?: string;
}): string {
  const url = new URL(CONTEXT_DEV_PARSE_URL);

  if (params.extension) {
    url.searchParams.set("extension", params.extension);
  }
  url.searchParams.set("includeLinks", String(params.includeLinks));
  url.searchParams.set("includeImages", String(params.includeImages));
  url.searchParams.set("shortenBase64Images", String(params.shortenBase64Images));
  url.searchParams.set("useMainContentOnly", String(params.useMainContentOnly));
  url.searchParams.set("ocr", String(params.ocr));

  if (params.pdf?.start !== undefined) {
    url.searchParams.set("pdf[start]", String(params.pdf.start));
  }
  if (params.pdf?.end !== undefined) {
    url.searchParams.set("pdf[end]", String(params.pdf.end));
  }

  if (params.client) {
    url.searchParams.set("client", params.client);
  }

  return url.toString();
}

function resolveContentType(mimeType: string, extension: string): string {
  const trimmed = mimeType.trim();
  if (trimmed && trimmed !== "application/octet-stream") {
    return trimmed;
  }
  return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

function shouldEnableOcr(extension: string, mimeType: string): boolean {
  if (extension === "pdf" || mimeType === "application/pdf") return true;
  if (IMAGE_EXTENSIONS.has(extension) || mimeType.startsWith("image/")) return true;
  return false;
}

function extractExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

function mapParseError(
  status: number,
  payload: ContextDevParseResponse
): ContextDevParseError {
  const errorCode = normalizeErrorCode(payload.error_code);
  const keyMeta = payload.key_metadata;
  const apiMessage = payload.message?.trim();

  switch (status) {
    case 400:
      if (errorCode === "WEBSITE_ACCESS_ERROR") {
        return new ContextDevParseError({
          status,
          errorCode,
          message: sanitizeUserError(
            apiMessage ??
              "No readable content found. For scanned PDFs, enable OCR and verify the page range.",
            "parse"
          ),
          creditsConsumed: keyMeta?.credits_consumed,
          creditsRemaining: keyMeta?.credits_remaining,
        });
      }
      return new ContextDevParseError({
        status,
        errorCode: errorCode ?? "INPUT_VALIDATION_ERROR",
        message: sanitizeUserError(
          apiMessage ?? "Invalid file or parse options.",
          "parse"
        ),
        creditsConsumed: keyMeta?.credits_consumed,
        creditsRemaining: keyMeta?.credits_remaining,
      });

    case 401:
      return new ContextDevParseError({
        status,
        errorCode: "AUTH_ERROR",
        message: sanitizeUserError(
          "Document parsing is not configured. Contact support.",
          "parse"
        ),
        creditsConsumed: keyMeta?.credits_consumed,
        creditsRemaining: keyMeta?.credits_remaining,
      });

    case 403:
      return new ContextDevParseError({
        status,
        errorCode: errorCode ?? "FORBIDDEN",
        message: sanitizeUserError(
          apiMessage ?? "Document parsing is not available for this account.",
          "parse"
        ),
        creditsConsumed: keyMeta?.credits_consumed,
        creditsRemaining: keyMeta?.credits_remaining,
      });

    case 413:
      return new ContextDevParseError({
        status,
        errorCode: errorCode ?? "INPUT_VALIDATION_ERROR",
        message: sanitizeUserError(
          "File is too large. Maximum size is 25 MB.",
          "parse"
        ),
        creditsConsumed: keyMeta?.credits_consumed,
        creditsRemaining: keyMeta?.credits_remaining,
      });

    case 415:
      return new ContextDevParseError({
        status,
        errorCode: errorCode ?? "UNSUPPORTED_CONTENT",
        message: sanitizeUserError(
          apiMessage ??
            "Unsupported file type. Try PDF, Word, Excel, PowerPoint, or plain text.",
          "parse"
        ),
        creditsConsumed: keyMeta?.credits_consumed,
        creditsRemaining: keyMeta?.credits_remaining,
      });

    case 429:
      return new ContextDevParseError({
        status,
        errorCode: errorCode ?? "RATE_LIMITED",
        message: sanitizeUserError(
          "Too many parse requests. Please wait a moment and try again.",
          "parse"
        ),
        creditsConsumed: keyMeta?.credits_consumed,
        creditsRemaining: keyMeta?.credits_remaining,
        retryable: true,
      });

    default:
      return new ContextDevParseError({
        status,
        errorCode: errorCode ?? "UNKNOWN",
        message: sanitizeUserError(apiMessage ?? "Document parse failed", "parse"),
        creditsConsumed: keyMeta?.credits_consumed,
        creditsRemaining: keyMeta?.credits_remaining,
      });
  }
}

function normalizeErrorCode(code: string | undefined): ContextDevErrorCode | undefined {
  if (!code) return undefined;
  const known: ContextDevErrorCode[] = [
    "INPUT_VALIDATION_ERROR",
    "WEBSITE_ACCESS_ERROR",
    "UNSUPPORTED_CONTENT",
    "FORBIDDEN",
    "RATE_LIMITED",
  ];
  return known.includes(code as ContextDevErrorCode)
    ? (code as ContextDevErrorCode)
    : "UNKNOWN";
}

async function fallbackParse(params: ContextDevParseParams): Promise<ContextDevParseResult> {
  assertParseableSize(params.fileBytes.byteLength);

  const extension = extractExtension(params.filename);
  const mimeType = params.mimeType.trim().toLowerCase();

  if (
    BINARY_PARSE_EXTENSIONS.has(extension) ||
    mimeType === "application/pdf" ||
    mimeType.includes("officedocument") ||
    mimeType.includes("msword") ||
    mimeType.includes("ms-excel") ||
    mimeType.includes("ms-powerpoint")
  ) {
    throw new ContextDevParseError({
      status: 503,
      errorCode: "UNSUPPORTED_CONTENT",
      message: sanitizeUserError(
        "PDF and Office files require document parsing to be configured. Contact support or try a plain-text upload.",
        "parse"
      ),
    });
  }

  if (
    !PLAIN_TEXT_EXTENSIONS.has(extension) &&
    mimeType !== "text/plain" &&
    mimeType !== "text/markdown" &&
    mimeType !== "text/html" &&
    mimeType !== "text/csv" &&
    mimeType !== "application/json"
  ) {
    throw new ContextDevParseError({
      status: 415,
      errorCode: "UNSUPPORTED_CONTENT",
      message: sanitizeUserError(
        "This file type needs document parsing. Upload a .txt or .md file, or contact support.",
        "parse"
      ),
    });
  }

  const text = new TextDecoder().decode(params.fileBytes);
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();

  if (cleaned.length < 50) {
    throw new ContextDevParseError({
      status: 415,
      errorCode: "UNSUPPORTED_CONTENT",
      message: sanitizeUserError("Could not extract text from this file", "parse"),
    });
  }

  const markdown = `# ${params.filename}\n\n${cleaned}`;
  return {
    markdown,
    type: "text",
    pageCount: estimatePageCount(markdown),
    images: [],
    jobId: `fallback-${crypto.randomUUID()}`,
    creditsConsumed: 0,
  };
}

function estimatePageCount(
  markdown: string,
  pdfRange?: { start?: number; end?: number }
): number {
  if (pdfRange?.start !== undefined && pdfRange.end !== undefined) {
    return Math.max(1, pdfRange.end - pdfRange.start + 1);
  }
  if (pdfRange?.start !== undefined) {
    return 1;
  }

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
