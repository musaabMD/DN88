import type { JSONContent } from "@tiptap/react";

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

const SCROLL_KEY = "drnote-library-scroll";

/** Remember/resume the reader scroll position per article. */
export function getArticleScroll(articleId: string): number {
  const all = readJson<Record<string, number>>(SCROLL_KEY, {});
  return all[articleId] ?? 0;
}

export function saveArticleScroll(articleId: string, top: number): void {
  const all = readJson<Record<string, number>>(SCROLL_KEY, {});
  all[articleId] = Math.max(0, Math.round(top));
  writeJson(SCROLL_KEY, all);
}

const GLOSSARY_KEY = "drnote-library-glossary-enabled";

export function getGlossaryEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(GLOSSARY_KEY) !== "false";
}

export function setGlossaryEnabled(enabled: boolean): void {
  localStorage.setItem(GLOSSARY_KEY, enabled ? "true" : "false");
}
