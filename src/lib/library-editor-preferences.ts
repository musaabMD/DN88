import type { JSONContent } from "@tiptap/react";

const ARTICLE_CONTENT_KEY = "drnote-library-article-content";

/** Bump when article→Tiptap conversion changes (e.g. callout nodes). */
export const ARTICLE_EDITOR_CONTENT_VERSION = 2;

type StoredArticleContent = {
  articleId: string;
  content: JSONContent;
  /** Missing on legacy saves — treated as version 0. */
  version?: number;
};

/** Count callout nodes in a Tiptap JSON tree (for migration checks). */
export function countCalloutNodes(content: JSONContent | null | undefined): number {
  if (!content) return 0;
  let count = 0;
  const walk = (node: JSONContent) => {
    if (node.type === "callout") count += 1;
    node.content?.forEach(walk);
  };
  walk(content);
  return count;
}

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

export function getStoredArticleEditorVersion(articleId: string): number {
  const all = readJson<StoredArticleContent[]>(ARTICLE_CONTENT_KEY, []);
  return all.find((entry) => entry.articleId === articleId)?.version ?? 0;
}

export function saveArticleEditorContent(
  articleId: string,
  content: JSONContent,
  version: number = ARTICLE_EDITOR_CONTENT_VERSION
): void {
  const all = readJson<StoredArticleContent[]>(ARTICLE_CONTENT_KEY, []);
  const without = all.filter((entry) => entry.articleId !== articleId);
  writeJson(ARTICLE_CONTENT_KEY, [
    ...without,
    { articleId, content, version },
  ]);
}

/**
 * Pick saved editor JSON or regenerate from the article when a legacy save
 * predates callouts / a content-version bump.
 */
export function resolveArticleEditorContent(
  articleId: string,
  freshContent: JSONContent
): JSONContent {
  const saved = getArticleEditorContent(articleId);
  if (!saved) return freshContent;

  const storedVersion = getStoredArticleEditorVersion(articleId);
  if (storedVersion < ARTICLE_EDITOR_CONTENT_VERSION) return freshContent;

  const savedCallouts = countCalloutNodes(saved);
  const freshCallouts = countCalloutNodes(freshContent);
  if (freshCallouts > savedCallouts) return freshContent;

  return saved;
}

const TOC_VISIBLE_KEY = "drnote-library-toc-visible";

export function getTocVisible(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TOC_VISIBLE_KEY) !== "false";
}

export function setTocVisible(visible: boolean): void {
  localStorage.setItem(TOC_VISIBLE_KEY, visible ? "true" : "false");
}

const GLOSSARY_KEY = "drnote-library-glossary-enabled";

export function getGlossaryEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(GLOSSARY_KEY) !== "false";
}

export function setGlossaryEnabled(enabled: boolean): void {
  localStorage.setItem(GLOSSARY_KEY, enabled ? "true" : "false");
}

const COLORFUL_KEY = "drnote-library-colorful-view";

/** Colorful reader view: tint semantic callout boxes by type. Off by default. */
export function getColorfulViewEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COLORFUL_KEY) === "true";
}

export function setColorfulViewEnabled(enabled: boolean): void {
  localStorage.setItem(COLORFUL_KEY, enabled ? "true" : "false");
}
