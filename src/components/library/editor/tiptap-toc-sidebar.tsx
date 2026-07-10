"use client";

import type { TableOfContentData } from "@tiptap/extension-table-of-contents";

type TiptapTocSidebarProps = {
  anchors: TableOfContentData;
  onNavigate: (id: string, element: HTMLElement) => void;
};

/** Floating TOC sidebar driven by @tiptap/extension-table-of-contents */
export function TiptapTocSidebar({ anchors, onNavigate }: TiptapTocSidebarProps) {
  if (anchors.length === 0) return null;

  const h2Anchors = anchors.filter((a) => a.originalLevel === 2);

  if (h2Anchors.length === 0) return null;

  return (
    <aside className="simple-editor-toc" aria-label="Table of contents">
      <div className="simple-editor-toc-rail">
        {h2Anchors.map((anchor) => (
          <span
            key={anchor.id}
            className={`simple-editor-toc-rail-line ${
              anchor.isActive ? "is-active" : anchor.isScrolledOver ? "is-passed" : ""
            }`}
          />
        ))}
      </div>
      <nav className="simple-editor-toc-nav">
        {h2Anchors.map((anchor) => (
          <button
            key={anchor.id}
            type="button"
            className={`simple-editor-toc-item ${
              anchor.isActive ? "is-active" : ""
            }`}
            onClick={() => onNavigate(anchor.id, anchor.dom)}
          >
            {anchor.textContent}
          </button>
        ))}
      </nav>
    </aside>
  );
}
