import { getLibraryArticleById } from "@/lib/set-content";
import { getPageById, resolvePageHref } from "@/lib/pages/page-index";

export type WikiLinkPreview = {
  title: string;
  subject?: string;
  readMinutes?: number;
  updated?: string;
  snippet?: string;
  href: string;
  exists: boolean;
};

/** Strip `[[wiki]]` markup and collapse whitespace for a plain-text snippet. */
function toPlainText(input: string): string {
  return input
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  const clipped = input.slice(0, max);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

/**
 * Resolve a lightweight preview for a wiki-link target page, used by the
 * hover "peek" card. Returns `null` when the target has no published content.
 */
export function getWikiLinkPreview(pageId: string): WikiLinkPreview | null {
  const article = getLibraryArticleById(pageId);
  if (article) {
    const rawSnippet =
      article.summary ??
      article.sections.find((section) => section.body?.trim())?.body ??
      "";
    const snippet = toPlainText(rawSnippet);
    return {
      title: article.title,
      subject: article.subject,
      readMinutes: article.readMinutes,
      updated: article.updated,
      snippet: snippet ? truncate(snippet, 180) : undefined,
      href: resolvePageHref(article.id),
      exists: true,
    };
  }

  const page = getPageById(pageId);
  if (page) {
    return {
      title: page.title,
      href: resolvePageHref(page.id),
      exists: true,
    };
  }

  return null;
}
