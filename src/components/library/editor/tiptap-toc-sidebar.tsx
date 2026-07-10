"use client";

import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { X } from "lucide-react";

type TiptapTocSidebarProps = {
  anchors: TableOfContentData;
  visible: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: (id: string, element: HTMLElement) => void;
};

function TocNav({
  anchors,
  onNavigate,
}: {
  anchors: TableOfContentData;
  onNavigate: (id: string, element: HTMLElement) => void;
}) {
  const h2Anchors = anchors.filter((a) => a.originalLevel === 2);
  if (h2Anchors.length === 0) return null;

  return (
    <nav className="simple-editor-toc-nav">
      {h2Anchors.map((anchor) => (
        <button
          key={anchor.id}
          type="button"
          className={`simple-editor-toc-item ${anchor.isActive ? "is-active" : ""}`}
          onClick={() => onNavigate(anchor.id, anchor.dom)}
        >
          {anchor.itemIndex > 0 ? `${anchor.itemIndex}. ` : null}
          {anchor.textContent}
        </button>
      ))}
    </nav>
  );
}

/** Reading TOC — desktop sidebar + mobile bottom sheet */
export function TiptapTocSidebar({
  anchors,
  visible,
  mobileOpen,
  onCloseMobile,
  onNavigate,
}: TiptapTocSidebarProps) {
  const h2Anchors = anchors.filter((a) => a.originalLevel === 2);
  if (h2Anchors.length === 0) return null;

  const handleNavigate = (id: string, element: HTMLElement) => {
    onNavigate(id, element);
    onCloseMobile();
  };

  return (
    <>
      {visible ? (
        <aside className="simple-editor-toc" aria-label="On this page">
          <p className="simple-editor-toc-label">Contents</p>
          <TocNav anchors={anchors} onNavigate={handleNavigate} />
        </aside>
      ) : null}

      {mobileOpen ? (
        <div className="simple-editor-toc-sheet" role="dialog" aria-label="Table of contents">
          <div className="simple-editor-toc-sheet-backdrop" onClick={onCloseMobile} role="presentation" />
          <div className="simple-editor-toc-sheet-panel">
            <div className="simple-editor-toc-sheet-header">
              <p className="simple-editor-toc-label">Contents</p>
              <button
                type="button"
                className="simple-editor-icon-btn"
                onClick={onCloseMobile}
                aria-label="Close contents"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <TocNav anchors={anchors} onNavigate={handleNavigate} />
          </div>
        </div>
      ) : null}
    </>
  );
}
