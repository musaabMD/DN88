"use client";

import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import type { LibraryArticleSection } from "@/lib/set-content";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";

type TiptapTocSidebarProps = {
  anchors: TableOfContentData;
  fallbackSections?: LibraryArticleSection[];
  visible: boolean;
  mobile?: boolean;
  onNavigate: (id: string, element?: HTMLElement) => void;
  onClose?: () => void;
};

type TocItem = {
  id: string;
  textContent: string;
  itemIndex: number;
  isActive?: boolean;
  dom?: HTMLElement;
};

function buildFallbackItems(sections: LibraryArticleSection[]): TocItem[] {
  return sections.map((section, index) => ({
    id: sectionSlug(section.heading),
    textContent: section.heading,
    itemIndex: index + 1,
  }));
}

/** Reading TOC — desktop sidebar or mobile drawer. */
export function TiptapTocSidebar({
  anchors,
  fallbackSections = [],
  visible,
  mobile = false,
  onNavigate,
  onClose,
}: TiptapTocSidebarProps) {
  if (!visible) return null;

  const fromExtension = anchors.filter((a) => a.originalLevel === 2);
  const items: TocItem[] =
    fromExtension.length > 0
      ? fromExtension.map((a) => ({
          id: a.id,
          textContent: a.textContent,
          itemIndex: a.itemIndex,
          isActive: a.isActive,
          dom: a.dom,
        }))
      : buildFallbackItems(fallbackSections);

  if (items.length === 0) return null;

  return (
    <>
      {mobile ? (
        <button
          type="button"
          className="simple-editor-toc-backdrop"
          aria-label="Close contents"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`simple-editor-toc ${mobile ? "simple-editor-toc--mobile" : ""}`}
        aria-label="On this page"
      >
        <div className="simple-editor-toc-head">
          <p className="simple-editor-toc-label">On this page</p>
          {mobile ? (
            <button type="button" className="simple-editor-toc-close" onClick={onClose}>
              Close
            </button>
          ) : null}
        </div>
        <nav className="simple-editor-toc-nav">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`simple-editor-toc-item ${item.isActive ? "is-active" : ""}`}
              onClick={() => onNavigate(item.id, item.dom)}
            >
              {item.itemIndex > 0 ? `${item.itemIndex}. ` : null}
              {item.textContent}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

export function useHasTableOfContents(
  anchors: TableOfContentData,
  sections: LibraryArticleSection[]
): boolean {
  return anchors.some((a) => a.originalLevel === 2) || sections.length > 0;
}
