"use client";

import { Tiptap, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import {
  getHierarchicalIndexes,
  TableOfContents,
} from "@tiptap/extension-table-of-contents";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { ArrowLeft, List } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { LibraryArticle } from "@/lib/set-content";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { DecorationOnly } from "@/components/library/editor/decoration-only";
import { SectionHeading } from "@/components/library/editor/section-heading";
import { articleToTiptapContent } from "@/components/library/editor/article-to-tiptap";
import {
  getArticleEditorContent,
  getTocVisible,
  saveArticleEditorContent,
  setTocVisible,
} from "@/lib/library-editor-preferences";
import {
  ZoomDropdownMenu,
  ZOOM_DEFAULT,
  type ZoomLevel,
} from "@/components/library/editor/zoom-dropdown-menu";
import {
  TiptapTocSidebar,
  useHasTableOfContents,
} from "@/components/library/editor/tiptap-toc-sidebar";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";
import {
  WikiLink,
  WikiLinkEditorOverlay,
} from "@/components/library/editor/wiki-link";
import { SelectionBubbleMenu } from "@/components/library/editor/selection-bubble-menu";
import { EditorOverflowMenu } from "@/components/library/editor/editor-overflow-menu";

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

function getScrollParent(): HTMLElement | Window {
  return (
    (document.querySelector(".simple-editor-scroll") as HTMLElement | null) ??
    window
  );
}

export function LibraryTiptapEditor({
  article,
  onBack,
}: {
  article: LibraryArticle;
  onBack: () => void;
}) {
  const [zoom, setZoom] = useState<ZoomLevel>(ZOOM_DEFAULT);
  const [tocAnchors, setTocAnchors] = useState<TableOfContentData>([]);
  const [tocOpen, setTocOpen] = useState(() => getTocVisible());
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleToc = () => {
    setTocOpen((prev) => {
      const next = !prev;
      setTocVisible(next);
      return next;
    });
  };

  const initialContent = useMemo(() => {
    const saved = getArticleEditorContent(article.id);
    return saved ?? articleToTiptapContent(article);
  }, [article]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      SectionHeading,
      Highlight.configure({ multicolor: true }),
      Underline,
      WikiLink,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Details.configure({ persist: true }),
      DetailsSummary,
      DetailsContent,
      Image.configure({
        HTMLAttributes: { class: "simple-editor-image" },
        resize: {
          enabled: true,
          directions: ["top", "bottom", "left", "right"],
          minWidth: 50,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: { class: "simple-editor-table" },
        },
      }),
      TableOfContents.configure({
        anchorTypes: ["heading"],
        getId: (content) => sectionSlug(content),
        getIndex: getHierarchicalIndexes,
        onUpdate: (anchors) => setTocAnchors(anchors),
        scrollParent: getScrollParent,
      }),
      DecorationOnly,
    ],
    content: initialContent,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      saveArticleEditorContent(article.id, ed.getJSON());
    },
    editorProps: {
      attributes: {
        class: "tiptap simple-editor-prose",
        spellcheck: "false",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const saved = getArticleEditorContent(article.id);
    if (!saved) {
      editor.commands.setContent(articleToTiptapContent(article));
    }
  }, [article, editor]);

  const navigateToHeading = useCallback(
    (id: string, element?: HTMLElement) => {
      const scrollEl = scrollRef.current;
      const root = editor?.view.dom;
      const target =
        element ??
        (root?.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null) ??
        (root?.querySelector(`[data-section-id="${id}"]`) as HTMLElement | null);

      if (!target) return;

      if (scrollEl) {
        const offset =
          target.getBoundingClientRect().top -
          scrollEl.getBoundingClientRect().top +
          scrollEl.scrollTop -
          72;
        scrollEl.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (isMobile) setTocOpen(false);
      editor?.chain().focus().run();
    },
    [editor, isMobile]
  );

  const hasToc = useHasTableOfContents(tocAnchors, article.sections);
  const showDesktopToc = hasToc && tocOpen && !isMobile;
  const showMobileToc = hasToc && tocOpen && isMobile;

  if (!editor) return null;

  return (
    <Tiptap editor={editor}>
      <div className="simple-editor-page">
        <header className="simple-editor-header">
          <div className="simple-editor-header-start">
            <button
              type="button"
              className="simple-editor-back"
              onClick={onBack}
              aria-label="Back to library"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <DrNoteLogo showWordmark />
          </div>

          <div className="simple-editor-header-end">
            {hasToc ? (
              <button
                type="button"
                className={`simple-editor-toc-toggle ${tocOpen ? "is-active" : ""}`}
                onClick={toggleToc}
                aria-label={tocOpen ? "Hide contents" : "Show contents"}
                title="Contents"
              >
                <List size={16} strokeWidth={2} />
              </button>
            ) : null}
            <EditorOverflowMenu editor={editor} />
            <ZoomDropdownMenu
              currentZoom={zoom}
              onZoomChange={setZoom}
              onFitToPage={() => setZoom(ZOOM_DEFAULT)}
            />
          </div>
        </header>

        <div
          className={`simple-editor-body ${showDesktopToc ? "simple-editor-body--with-toc" : ""}`}
        >
          <div ref={scrollRef} className="simple-editor-scroll">
            <div
              className="simple-editor-canvas"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <Tiptap.Content />
            </div>
          </div>

          {showDesktopToc ? (
            <TiptapTocSidebar
              anchors={tocAnchors}
              fallbackSections={article.sections}
              visible
              onNavigate={navigateToHeading}
            />
          ) : null}
        </div>

        {showMobileToc ? (
          <TiptapTocSidebar
            anchors={tocAnchors}
            fallbackSections={article.sections}
            visible
            mobile
            onNavigate={navigateToHeading}
            onClose={() => setTocOpen(false)}
          />
        ) : null}

        <SelectionBubbleMenu editor={editor} />
        <WikiLinkEditorOverlay editor={editor} />
      </div>
    </Tiptap>
  );
}
