const PAGE_MARKER = /^<!--\s*PAGE:(\d+)\s*-->$/;

/** Ensure markdown has `<!-- PAGE:n -->` markers for each page. */
export function ensurePageAwareMarkdown(markdown: string): string {
  if (PAGE_MARKER.test(markdown.trim().split("\n")[0] ?? "")) {
    return markdown;
  }

  const formFeedPages = markdown.split("\f");
  if (formFeedPages.length > 1) {
    return formFeedPages
      .map((page, index) => {
        const body = page.trim();
        if (!body) return "";
        return `<!-- PAGE:${index + 1} -->\n${body}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  const explicitPages = markdown.match(/<!--\s*pages:\s*(\d+)\s*-->/i);
  if (explicitPages?.[1]) {
    const total = parseInt(explicitPages[1], 10);
    if (total > 1) {
      const charsPerPage = Math.ceil(markdown.length / total);
      const chunks: string[] = [];
      for (let p = 0; p < total; p++) {
        const slice = markdown.slice(p * charsPerPage, (p + 1) * charsPerPage).trim();
        if (slice) chunks.push(`<!-- PAGE:${p + 1} -->\n${slice}`);
      }
      return chunks.join("\n\n");
    }
  }

  return `<!-- PAGE:1 -->\n${markdown.trim()}`;
}

/** Merge page-range parse results into one page-aware document. */
export function mergePageRangeMarkdown(
  parts: Array<{ startPage: number; markdown: string }>
): string {
  return parts
    .map(({ startPage, markdown }) => {
      const trimmed = markdown.trim();
      if (!trimmed) return "";
      if (PAGE_MARKER.test(trimmed.split("\n")[0] ?? "")) return trimmed;
      return `<!-- PAGE:${startPage} -->\n${trimmed}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export function getPageNumbers(markdown: string): number[] {
  const pages = new Set<number>();
  for (const line of markdown.split("\n")) {
    const match = line.match(PAGE_MARKER);
    if (match?.[1]) pages.add(parseInt(match[1], 10));
  }
  return [...pages].sort((a, b) => a - b);
}

export function getPageContent(markdown: string, page: number): string {
  const lines = markdown.split("\n");
  let currentPage = 1;
  const buffer: string[] = [];

  for (const line of lines) {
    const marker = line.match(PAGE_MARKER);
    if (marker?.[1]) {
      const nextPage = parseInt(marker[1], 10);
      if (nextPage === page) {
        currentPage = page;
        continue;
      }
      if (currentPage === page && nextPage !== page) {
        break;
      }
      currentPage = nextPage;
      continue;
    }
    if (currentPage === page) buffer.push(line);
  }

  return buffer.join("\n").trim();
}

export function estimateTotalPages(markdown: string): number {
  const pages = getPageNumbers(markdown);
  if (pages.length > 0) return Math.max(...pages);
  return Math.max(1, Math.ceil(markdown.length / 3000));
}
