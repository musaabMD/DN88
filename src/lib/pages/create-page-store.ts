import type { Page } from "@/lib/pages/types";
import { pageTitleToSlug, pendingPageId } from "@/lib/pages/page-slug";

const CREATED_PAGES_KEY = "drnote:wiki-created-pages";

type StoredPage = Page & { subject?: string };

function readCreatedPages(): StoredPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CREATED_PAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreatedPages(pages: StoredPage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CREATED_PAGES_KEY, JSON.stringify(pages));
}

export function getCreatedPages(): StoredPage[] {
  return readCreatedPages();
}

export function getCreatedPageById(id: string): StoredPage | undefined {
  return readCreatedPages().find((page) => page.id === id);
}

export function getCreatedPageByTitle(title: string): StoredPage | undefined {
  const slug = pageTitleToSlug(title);
  return readCreatedPages().find(
    (page) => page.slug === slug || page.title.toLowerCase() === title.trim().toLowerCase()
  );
}

/** Create a user-defined page in localStorage (demo persistence). */
export function createStoredPage(input: {
  title: string;
  subject?: string;
}): StoredPage {
  const title = input.title.trim();
  const slug = pageTitleToSlug(title);
  const id = slug;

  const existing = readCreatedPages().find((p) => p.id === id || p.slug === slug);
  if (existing) return existing;

  const page: StoredPage = {
    id,
    title,
    slug,
    subject: input.subject,
  };

  writeCreatedPages([...readCreatedPages(), page]);
  return page;
}

export function resolvePendingToCreated(pendingId: string): StoredPage | undefined {
  if (!pendingId.startsWith("pending:")) return undefined;
  const slug = pendingId.slice("pending:".length);
  return readCreatedPages().find((p) => p.slug === slug);
}

export function pendingIdForTitle(title: string): string {
  return pendingPageId(title);
}
