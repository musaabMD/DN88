import type { HomeReadPage } from "./home-data";

const PAGE_CHARS = 2800;

/** Split Context.dev markdown into paginated slices for the split-screen reader. */
export function splitMarkdownIntoPages(markdown: string, targetPageCount?: number): string[] {
  const text = markdown.trim();
  if (!text) return [""];

  if (text.includes("\f")) {
    const pages = text.split("\f").map((page) => page.trim()).filter(Boolean);
    if (pages.length > 0) return pages;
  }

  const sections = text.split(/\n(?=##?\s+)/).filter((section) => section.trim());
  if (sections.length > 1) {
    if (targetPageCount && targetPageCount > 0 && sections.length !== targetPageCount) {
      return chunkSections(sections, targetPageCount);
    }
    return sections;
  }

  if (targetPageCount && targetPageCount > 1) {
    return chunkByLength(text, targetPageCount);
  }

  if (text.length <= PAGE_CHARS) return [text];
  return chunkByLength(text, Math.max(1, Math.ceil(text.length / PAGE_CHARS)));
}

function chunkSections(sections: string[], targetCount: number): string[] {
  if (sections.length <= targetCount) {
    const padded = [...sections];
    while (padded.length < targetCount) {
      padded.push("");
    }
    return padded;
  }

  const pages: string[] = [];
  const perPage = Math.ceil(sections.length / targetCount);
  for (let index = 0; index < sections.length; index += perPage) {
    pages.push(sections.slice(index, index + perPage).join("\n\n"));
  }
  return pages.slice(0, targetCount);
}

function chunkByLength(text: string, targetCount: number): string[] {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  if (paragraphs.length === 0) return [text];

  const pages: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (current && pages.length < targetCount - 1 && next.length > PAGE_CHARS) {
      pages.push(current);
      current = paragraph;
      continue;
    }
    current = next;
  }

  if (current) pages.push(current);
  if (pages.length === 0) return [text];

  while (pages.length < targetCount) {
    pages.push("");
  }

  return pages.slice(0, targetCount);
}

/** Demo fallback when Context.dev markdown is unavailable (unsigned / processing). */
export function readPagesToMarkdown(pages: HomeReadPage[], title: string): string {
  const parts: string[] = [`# ${title}`];

  for (const page of pages) {
    parts.push(`## ${page.h}`);
    for (const line of page.body) {
      parts.push(line);
    }
    if (page.key) {
      parts.push(`> ${page.key}`);
    }
    parts.push("");
  }

  return parts.join("\n").trim();
}

/** Cycle locale demo pages to match a fixed page count (split-screen demo files). */
export function readPagesToPaginatedMarkdown(
  pages: HomeReadPage[],
  title: string,
  totalPages: number
): string {
  if (totalPages <= 0 || pages.length === 0) return readPagesToMarkdown(pages, title);

  const slices: string[] = [];
  for (let index = 0; index < totalPages; index += 1) {
    const page = pages[index % pages.length];
    if (!page) continue;
    const chunk = [`## ${page.h}`, ...page.body];
    if (page.key) chunk.push(`> ${page.key}`);
    slices.push(chunk.join("\n"));
  }

  return `# ${title}\n\n${slices.join("\f")}`.trim();
}
