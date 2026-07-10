"use client";

import type { TableOfContentData } from "@tiptap/extension-table-of-contents";

type TiptapTocSidebarProps = {
  anchors: TableOfContentData;
  visible: boolean;
  onNavigate: (id: string, element: HTMLElement) => void;
};

/** Minimal reading TOC — plain text links, no progress rail */
export function TiptapTocSidebar({
  anchors,
  visible,
  onNavigate,
}: TiptapTocSidebarProps) {
  if (!visible) return null;

  const h2Anchors = anchors.filter((a) => a.originalLevel === 2);
  if (h2Anchors.length === 0) return null;

  return (
    <aside className="simple-editor-toc" aria-label="On this page">
      <p className="simple-editor-toc-label">On this page</p>
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
            {anchor.itemIndex > 0 ? `${anchor.itemIndex}. ` : null}
            {anchor.textContent}
          </button>
        ))}
      </nav>
    </aside>
  );
}
