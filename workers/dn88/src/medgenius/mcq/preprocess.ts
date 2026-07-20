const HEADER_FOOTER_PATTERNS = [
  /^https?:\/\/\S+$/i,
  /^www\.\S+$/i,
  /^t\.me\/\S+$/i,
  /^telegram\.me\/\S+$/i,
  /^@\w+$/,
  /^page\s+\d+\s*(\/\s*\d+)?$/i,
  /^-\s*\d+\s*-$/,
];

const UNCERTAIN_OPTION = /^([A-H])[\.\)]\s*(>|>>|\?|\.{2,}|…)\s*$/i;

export function stripRepeatedHeadersAndUrls(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      return !HEADER_FOOTER_PATTERNS.some((pattern) => pattern.test(trimmed));
    })
    .join("\n");
}

export type SuspiciousPageReason =
  | "short_text"
  | "embedded_images"
  | "broken_options"
  | "answer_hint_without_answer"
  | "ocr_poor";

export type SuspiciousPage = {
  page: number;
  reasons: SuspiciousPageReason[];
  textLength: number;
};

export function detectSuspiciousPages(markdown: string): SuspiciousPage[] {
  const pageBlocks = splitByPageMarkers(markdown);
  const suspicious: SuspiciousPage[] = [];

  for (const { page, content } of pageBlocks) {
    const reasons: SuspiciousPageReason[] = [];
    const text = content.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim();
    const textLength = text.length;

    if (textLength < 120) reasons.push("short_text");
    if (/!\[[^\]]*\]\([^)]+\)/.test(content)) reasons.push("embedded_images");
    if (UNCERTAIN_OPTION.test(content) || /\n\s*[A-H][\.\)]\s*(>|>>|\?)\s*$/m.test(content)) {
      reasons.push("broken_options");
    }
    if (
      /\b(answer|correct|key)\s*[:\-]/i.test(content) &&
      !/\b[A-H][\.\)]\s+\S{3,}/.test(content)
    ) {
      reasons.push("answer_hint_without_answer");
    }
    if (textLength > 0 && (content.match(/[^\x20-\x7E\n\r\t\u0600-\u06FF]/g)?.length ?? 0) / textLength > 0.15) {
      reasons.push("ocr_poor");
    }

    if (reasons.length > 0) {
      suspicious.push({ page, reasons, textLength });
    }
  }

  return suspicious;
}

function splitByPageMarkers(markdown: string): Array<{ page: number; content: string }> {
  const lines = markdown.split("\n");
  const blocks: Array<{ page: number; content: string }> = [];
  let currentPage = 1;
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      blocks.push({ page: currentPage, content: buffer.join("\n") });
      buffer = [];
    }
  };

  for (const line of lines) {
    const marker = line.match(/^<!--\s*PAGE:(\d+)\s*-->$/);
    if (marker?.[1]) {
      flush();
      currentPage = parseInt(marker[1], 10);
      continue;
    }
    buffer.push(line);
  }
  flush();

  if (blocks.length === 0) {
    return [{ page: 1, content: markdown }];
  }
  return blocks;
}

export function pageNeedsVision(page: SuspiciousPage): boolean {
  return (
    page.reasons.includes("embedded_images") ||
    page.reasons.includes("broken_options") ||
    page.reasons.includes("short_text")
  );
}
