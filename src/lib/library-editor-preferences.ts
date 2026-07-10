import type { JSONContent } from "@tiptap/react";
import type { EditorBgTheme } from "@/lib/editor-bg-colors";

const ARTICLE_CONTENT_KEY = "drnote-library-article-content";

type StoredArticleContent = {
  articleId: string;
  content: JSONContent;
};

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

export function getArticleEditorContent(articleId: string): JSONContent | null {
  const all = readJson<StoredArticleContent[]>(ARTICLE_CONTENT_KEY, []);
  return all.find((entry) => entry.articleId === articleId)?.content ?? null;
}

export function saveArticleEditorContent(
  articleId: string,
  content: JSONContent
): void {
  const all = readJson<StoredArticleContent[]>(ARTICLE_CONTENT_KEY, []);
  const without = all.filter((entry) => entry.articleId !== articleId);
  writeJson(ARTICLE_CONTENT_KEY, [...without, { articleId, content }]);
}

const TOC_VISIBLE_KEY = "drnote-library-toc-visible";

export function getTocVisible(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TOC_VISIBLE_KEY) !== "false";
}

export function setTocVisible(visible: boolean): void {
  localStorage.setItem(TOC_VISIBLE_KEY, visible ? "true" : "false");
}

const CHROME_VISIBLE_KEY = "drnote-library-toolbar-visible";

/** Formatting toolbar visible (false = reading mode, header stays). */
export function getChromeVisible(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CHROME_VISIBLE_KEY) === "true";
}

export function setChromeVisible(visible: boolean): void {
  localStorage.setItem(CHROME_VISIBLE_KEY, visible ? "true" : "false");
}

const BG_THEME_KEY = "drnote-library-bg-theme";

export function getBgTheme(): EditorBgTheme {
  if (typeof window === "undefined") return "white";
  const stored = localStorage.getItem(BG_THEME_KEY);
  if (stored === "sepia" || stored === "gray" || stored === "dark" || stored === "white") {
    return stored;
  }
  return "white";
}

export function setBgTheme(theme: EditorBgTheme): void {
  localStorage.setItem(BG_THEME_KEY, theme);
}

const PUBLISHED_ARTICLES_KEY = "drnote-library-published-articles";

export function getPublishedArticleIds(): string[] {
  return readJson<string[]>(PUBLISHED_ARTICLES_KEY, []);
}

export function isArticlePublished(articleId: string): boolean {
  return getPublishedArticleIds().includes(articleId);
}

export function publishArticle(articleId: string): void {
  const ids = getPublishedArticleIds();
  if (!ids.includes(articleId)) {
    writeJson(PUBLISHED_ARTICLES_KEY, [...ids, articleId]);
  }
}
