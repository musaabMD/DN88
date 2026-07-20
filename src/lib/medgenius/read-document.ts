import type { HomeReadPage } from "./home-data";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

function formatBlock(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";

  if (/^[-*•]\s+/.test(trimmed)) {
    return `<ul><li>${formatInlineMarkdown(trimmed.replace(/^[-*•]\s+/, ""))}</li></ul>`;
  }

  if (/^>\s+/.test(trimmed)) {
    return `<blockquote><p>${formatInlineMarkdown(trimmed.replace(/^>\s+/, ""))}</p></blockquote>`;
  }

  if (/^#{1,3}\s+/.test(trimmed)) {
    const level = trimmed.match(/^#+/)?.[0].length ?? 2;
    const tag = level <= 2 ? "h2" : "h3";
    return `<${tag}>${formatInlineMarkdown(trimmed.replace(/^#+\s+/, ""))}</${tag}>`;
  }

  return `<p>${formatInlineMarkdown(trimmed)}</p>`;
}

export function readPagesToStudyHtml(pages: HomeReadPage[], title: string): string {
  if (pages.length === 0) return `<h1>${escapeHtml(title)}</h1><p></p>`;

  const parts: string[] = [`<h1>${escapeHtml(title)}</h1>`];

  for (const page of pages) {
    parts.push(`<h2>${formatInlineMarkdown(page.h)}</h2>`);

    if (page.body[0]) {
      parts.push(`<p>${formatInlineMarkdown(page.body[0])}</p>`);
    }

    if (page.key) {
      parts.push(
        `<div data-callout="note"><p>${formatInlineMarkdown(page.key)}</p></div>`
      );
    }

    for (const line of page.body.slice(1)) {
      const block = formatBlock(line);
      if (block) parts.push(block);
    }
  }

  return parts.join("");
}

export function markdownToStudyHtml(markdown: string, title: string): string {
  const text = markdown.trim();
  if (!text) return `<h1>${escapeHtml(title)}</h1><p></p>`;

  const sections = text.split(/\n(?=##?\s+)/).filter((section) => section.trim());
  const parts: string[] = [`<h1>${escapeHtml(title)}</h1>`];

  for (const section of sections) {
    const lines = section.trim().split("\n").filter(Boolean);
    if (lines.length === 0) continue;

    const first = lines[0] ?? "";
    if (/^#/.test(first)) {
      parts.push(formatBlock(first));
      for (const line of lines.slice(1)) {
        const block = formatBlock(line);
        if (block) parts.push(block);
      }
      continue;
    }

    for (const line of lines) {
      const block = formatBlock(line);
      if (block) parts.push(block);
    }
  }

  return parts.join("");
}

const READ_NOTES_PREFIX = "drnote-study-read:";

export function loadReadNotes(documentId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${READ_NOTES_PREFIX}${documentId}`);
  } catch {
    return null;
  }
}

export function saveReadNotes(documentId: string, html: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${READ_NOTES_PREFIX}${documentId}`, html);
  } catch {
    /* ignore quota errors */
  }
}
