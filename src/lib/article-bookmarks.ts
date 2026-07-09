const STORAGE_KEY = "drnote-article-bookmarks";

function readBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function getArticleBookmarks(): string[] {
  return readBookmarks();
}

export function isArticleBookmarked(articleId: string): boolean {
  return readBookmarks().includes(articleId);
}

export function toggleArticleBookmark(articleId: string): boolean {
  const current = readBookmarks();
  const bookmarked = current.includes(articleId);
  const next = bookmarked
    ? current.filter((id) => id !== articleId)
    : [...current, articleId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return !bookmarked;
}
