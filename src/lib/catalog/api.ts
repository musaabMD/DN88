import { getApiBaseUrl } from "@/lib/api";
import type {
  AdminArticleSummary,
  CatalogArticleDetail,
  CatalogArticleSummary,
  CatalogState,
} from "@/lib/catalog/types";

let staticIndexCache: CatalogArticleSummary[] | null = null;

function catalogEnabled(): boolean {
  if (process.env.DEMO_MODE === "true") return false;
  return process.env.NEXT_PUBLIC_CATALOG_API_ENABLED !== "false";
}

export function isCatalogApiEnabled(): boolean {
  return catalogEnabled();
}

export async function fetchCatalogState(): Promise<CatalogState | null> {
  if (!catalogEnabled()) return null;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/catalog/state`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      syncState: CatalogState["syncState"];
      activeSnapshotId: string | null;
      lastSuccessAt: string | null;
      lastFailureAt: string | null;
      lastError: string | null;
    };
    return {
      syncState: data.syncState,
      activeSnapshotId: data.activeSnapshotId,
      lastSuccessAt: data.lastSuccessAt,
      lastFailureAt: data.lastFailureAt,
      lastError: data.lastError,
    };
  } catch {
    return null;
  }
}

export async function fetchPublicArticles(): Promise<{
  articles: CatalogArticleSummary[];
  syncState: CatalogState["syncState"];
}> {
  if (!catalogEnabled()) return { articles: [], syncState: "unavailable" };
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/catalog/articles`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { articles: [], syncState: "unavailable" };
    const data = (await res.json()) as {
      articles: CatalogArticleSummary[];
      syncState: CatalogState["syncState"];
    };
    if (!data.articles?.length) {
      return { articles: await fetchStaticArticleIndex(), syncState: data.syncState };
    }
    return data;
  } catch {
    return { articles: await fetchStaticArticleIndex(), syncState: "fresh" };
  }
}

export async function fetchPublicArticle(
  slug: string
): Promise<CatalogArticleDetail | null> {
  if (!catalogEnabled()) return null;
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/catalog/articles/${encodeURIComponent(slug)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return fetchStaticArticle(slug);
    return res.json() as Promise<CatalogArticleDetail>;
  } catch {
    return fetchStaticArticle(slug);
  }
}

export async function searchCatalog(
  query: string
): Promise<CatalogArticleSummary[]> {
  if (!catalogEnabled()) return [];
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/catalog/search?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results: CatalogArticleSummary[] };
    return data.results;
  } catch {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (await fetchStaticArticleIndex())
      .filter(
        (article) =>
          article.title.toLowerCase().includes(q) ||
          article.publicSlug.toLowerCase().includes(q) ||
          article.slug.toLowerCase().includes(q) ||
          (article.subject ?? "").toLowerCase().includes(q)
      )
      .slice(0, 50);
  }
}

async function fetchStaticArticleIndex(): Promise<CatalogArticleSummary[]> {
  if (staticIndexCache) return staticIndexCache;
  try {
    const res = await fetch("/catalog/index.json", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { articles: CatalogArticleSummary[] };
    staticIndexCache = data.articles ?? [];
    return staticIndexCache;
  } catch {
    return [];
  }
}

function entitySlugFromTitle(title: string): string {
  const assessment = title.match(/^Assessment of (.+)$/i);
  const overview = title.match(/^Overview of (.+)$/i);
  const base = assessment?.[1] ?? overview?.[1] ?? title;
  return base
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchStaticArticle(
  slug: string
): Promise<CatalogArticleDetail | null> {
  const normalized = slug.toLowerCase();
  const match = (await fetchStaticArticleIndex()).find((article) => {
    return (
      article.id.toLowerCase() === normalized ||
      article.publicSlug.toLowerCase() === normalized ||
      article.slug.toLowerCase() === normalized ||
      entitySlugFromTitle(article.title) === normalized
    );
  });

  if (!match) return null;

  try {
    const res = await fetch(`/catalog/articles/${encodeURIComponent(match.id)}.json`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<CatalogArticleDetail>;
  } catch {
    return null;
  }
}

export async function fetchAdminSummary(token: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/catalog/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load admin summary");
  return res.json();
}

export async function fetchAdminArticles(
  token: string,
  status?: string
): Promise<AdminArticleSummary[]> {
  const url = status
    ? `${getApiBaseUrl()}/api/admin/articles?status=${encodeURIComponent(status)}`
    : `${getApiBaseUrl()}/api/admin/articles`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load admin articles");
  const data = (await res.json()) as { articles: AdminArticleSummary[] };
  return data.articles;
}

export async function adminApproveArticle(token: string, id: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/articles/${id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Approve failed");
  }
  return res.json();
}

export async function adminRejectArticle(
  token: string,
  id: string,
  note: string
) {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/articles/${id}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Reject failed");
  }
  return res.json();
}

export async function adminRequestAiReview(token: string, id: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/articles/${id}/ai-review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "AI review failed");
  }
  return res.json();
}

export function catalogArticleToLibraryArticle(
  article: CatalogArticleDetail
): import("@/lib/set-content").LibraryArticle {
  return {
    id: article.id,
    subject: article.subject ?? article.specialty,
    title: article.title,
    readMinutes: article.readMinutes,
    updated: article.updatedAt,
    sections: article.sections.map((s) => ({
      id: s.id,
      heading: s.heading,
      body: s.bodyMarkdown,
    })),
    summary: article.preambleMarkdown ?? undefined,
  };
}
