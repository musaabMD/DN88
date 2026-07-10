import type { JSONContent } from "@tiptap/react";
import type { LibraryEditorMode } from "@/components/library/editor/types";

const MODE_KEY = "drnote-library-editor-mode";
const SECTION_CONTENT_KEY = "drnote-library-section-content";

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

export function getLibraryEditorMode(): LibraryEditorMode {
  const mode = readJson<string>(MODE_KEY, "docx");
  if (mode === "agent" || mode === "docx" || mode === "notion" || mode === "simple") {
    return mode;
  }
  return "docx";
}

export function setLibraryEditorMode(mode: LibraryEditorMode): void {
  writeJson(MODE_KEY, mode);
}

type StoredSectionContent = {
  articleId: string;
  sectionId: string;
  content: JSONContent;
};

export function getSectionContent(
  articleId: string,
  sectionId: string
): JSONContent | null {
  const all = readJson<StoredSectionContent[]>(SECTION_CONTENT_KEY, []);
  const match = all.find(
    (entry) => entry.articleId === articleId && entry.sectionId === sectionId
  );
  return match?.content ?? null;
}

export function saveSectionContent(
  articleId: string,
  sectionId: string,
  content: JSONContent
): void {
  const all = readJson<StoredSectionContent[]>(SECTION_CONTENT_KEY, []);
  const without = all.filter(
    (entry) => !(entry.articleId === articleId && entry.sectionId === sectionId)
  );
  writeJson(SECTION_CONTENT_KEY, [
    ...without,
    { articleId, sectionId, content },
  ]);
}
