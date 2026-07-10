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
