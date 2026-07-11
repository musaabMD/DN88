import { LIBRARY_ARTICLES } from "@/lib/set-content";
import { articlePath } from "@/lib/routes";
import {
  entityPathForArticle,
  resolveLibraryArticle,
} from "@/lib/entities";
import {
  createStoredPage,
  getCreatedPageById,
  getCreatedPageByTitle,
  getCreatedPages,
  resolvePendingToCreated,
} from "@/lib/pages/create-page-store";
import { isPendingPageId, pageTitleToSlug, pendingPageId } from "@/lib/pages/page-slug";
import type { InternalLinkAttrs, Page, PageSearchItem } from "@/lib/pages/types";

function articleToPage(article: (typeof LIBRARY_ARTICLES)[number]): Page {
  return {
    id: article.id,
    title: article.title,
    slug: article.id,
  };
}

/** All published pages from static library articles. */
export function getPublishedPages(): Page[] {
  return LIBRARY_ARTICLES.map(articleToPage);
}

/** Combined published + user-created pages. */
export function getAllPages(): Page[] {
  const published = getPublishedPages();
  const created = getCreatedPages().map(({ id, title, slug }) => ({ id, title, slug }));
  const byId = new Map<string, Page>();
  for (const page of [...published, ...created]) {
    byId.set(page.id, page);
  }
  return [...byId.values()];
}

export function getPageById(pageId: string): Page | undefined {
  if (isPendingPageId(pageId)) {
    const created = resolvePendingToCreated(pageId);
    if (created) return created;
    return undefined;
  }
  return (
    getPublishedPages().find((p) => p.id === pageId) ??
    getCreatedPageById(pageId) ??
    undefined
  );
}

export function getPageBySlug(slug: string): Page | undefined {
  return getAllPages().find((p) => p.slug === slug || p.id === slug);
}

export function getPageByTitle(title: string): Page | undefined {
  const normalized = title.trim().toLowerCase();
  return (
    getAllPages().find((p) => p.title.toLowerCase() === normalized) ??
    getCreatedPageByTitle(title)
  );
}

export function resolvePageFromTitle(title: string): PageSearchItem {
  const trimmed = title.trim();
  const existing = getPageByTitle(trimmed);
  if (existing) {
    return { ...existing, exists: true };
  }
  return {
    title: trimmed,
    exists: false,
    pendingId: pendingPageId(trimmed),
  };
}

export function searchPages(query: string, limit = 8): PageSearchItem[] {
  const q = query.trim().toLowerCase();
  const pages = getAllPages();

  const scored = pages
    .map((page) => {
      const title = page.title.toLowerCase();
      if (!q) return { page, score: 0 };
      if (title === q) return { page, score: 100 };
      if (title.startsWith(q)) return { page, score: 80 };
      if (title.includes(q)) return { page, score: 60 };
      return null;
    })
    .filter((entry): entry is { page: Page; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title));

  const results: PageSearchItem[] = scored.slice(0, limit).map(({ page }) => ({
    ...page,
    exists: true as const,
  }));

  if (q && !results.some((r) => r.exists && r.title.toLowerCase() === q)) {
    results.push(resolvePageFromTitle(query.trim()));
  }

  return results.slice(0, limit);
}

/** Resolve slug at render/navigation time from stable pageId. */
export function resolvePageHref(pageId: string): string {
  const article = resolveLibraryArticle(pageId);
  if (article) return entityPathForArticle(article);

  const page = getPageById(pageId);
  if (page) return articlePath(page.slug);
  if (isPendingPageId(pageId)) {
    const slug = pageId.slice("pending:".length);
    return articlePath(slug);
  }
  return articlePath(pageId);
}

export function buildInternalLinkAttrs(input: {
  pageId: string;
  pageTitle: string;
  exists?: boolean;
}): InternalLinkAttrs {
  const page = getPageById(input.pageId);
  const exists = input.exists ?? Boolean(page);
  const title = page?.title ?? input.pageTitle;
  const pageId = page?.id ?? input.pageId;

  return {
    href: resolvePageHref(pageId),
    pageId,
    pageTitle: title,
    exists,
    linkType: "internal",
  };
}

export function buildInternalLinkFromTitle(title: string): InternalLinkAttrs {
  const resolved = resolvePageFromTitle(title);
  if (resolved.exists) {
    return buildInternalLinkAttrs({
      pageId: resolved.id,
      pageTitle: resolved.title,
      exists: true,
    });
  }
  return buildInternalLinkAttrs({
    pageId: resolved.pendingId,
    pageTitle: resolved.title,
    exists: false,
  });
}

/** Re-resolve attrs after a page is created or the index changes. */
export function refreshInternalLinkAttrs(
  attrs: Partial<InternalLinkAttrs> & { pageId: string; pageTitle: string }
): InternalLinkAttrs {
  const page =
    getPageById(attrs.pageId) ??
    getPageByTitle(attrs.pageTitle) ??
    resolvePendingToCreated(attrs.pageId);

  if (page) {
    return buildInternalLinkAttrs({
      pageId: page.id,
      pageTitle: page.title,
      exists: true,
    });
  }

  return buildInternalLinkAttrs({
    pageId: isPendingPageId(attrs.pageId)
      ? attrs.pageId
      : pendingPageId(attrs.pageTitle),
    pageTitle: attrs.pageTitle,
    exists: false,
  });
}

export { pageTitleToSlug, createStoredPage };
