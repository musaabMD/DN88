export type HighlightColor = "yellow" | "green" | "blue" | "underline";

export type TextHighlight = {
  id: string;
  articleId: string;
  sectionId: string;
  text: string;
  style: HighlightColor;
};

export type ParagraphBookmark = {
  articleId: string;
  sectionId: string;
};

const HIGHLIGHTS_KEY = "drnote-article-highlights";
const PARAGRAPH_BOOKMARKS_KEY = "drnote-paragraph-bookmarks";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getArticleHighlights(articleId: string): TextHighlight[] {
  const all = readJson<TextHighlight[]>(HIGHLIGHTS_KEY, []);
  return all.filter((h) => h.articleId === articleId);
}

export function addTextHighlight(
  articleId: string,
  sectionId: string,
  text: string,
  style: HighlightColor
): TextHighlight {
  const all = readJson<TextHighlight[]>(HIGHLIGHTS_KEY, []);
  const highlight: TextHighlight = {
    id: `${articleId}-${sectionId}-${Date.now()}`,
    articleId,
    sectionId,
    text,
    style,
  };
  writeJson(HIGHLIGHTS_KEY, [...all, highlight]);
  return highlight;
}

export function removeTextHighlight(id: string): void {
  const all = readJson<TextHighlight[]>(HIGHLIGHTS_KEY, []);
  writeJson(
    HIGHLIGHTS_KEY,
    all.filter((h) => h.id !== id)
  );
}

export function getParagraphBookmarks(articleId: string): ParagraphBookmark[] {
  const all = readJson<ParagraphBookmark[]>(PARAGRAPH_BOOKMARKS_KEY, []);
  return all.filter((b) => b.articleId === articleId);
}

export function isParagraphBookmarked(
  articleId: string,
  sectionId: string
): boolean {
  return getParagraphBookmarks(articleId).some((b) => b.sectionId === sectionId);
}

export function toggleParagraphBookmark(
  articleId: string,
  sectionId: string
): boolean {
  const all = readJson<ParagraphBookmark[]>(PARAGRAPH_BOOKMARKS_KEY, []);
  const exists = all.some(
    (b) => b.articleId === articleId && b.sectionId === sectionId
  );
  const next = exists
    ? all.filter(
        (b) => !(b.articleId === articleId && b.sectionId === sectionId)
      )
    : [...all, { articleId, sectionId }];
  writeJson(PARAGRAPH_BOOKMARKS_KEY, next);
  return !exists;
}

export const HIGHLIGHT_CLASSES: Record<HighlightColor, string> = {
  yellow: "bg-amber-100 decoration-amber-300",
  green: "bg-emerald-100 decoration-emerald-300",
  blue: "bg-sky-100 decoration-sky-300",
  underline: "underline decoration-slate-500 decoration-2 underline-offset-2",
};
