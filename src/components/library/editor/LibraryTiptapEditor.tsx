"use client";

import { Tiptap, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
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
import { ArrowLeft, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SimpleEditorToolbar } from "@/components/library/editor/simple-editor-toolbar";
import {
  ZoomDropdownMenu,
  ZOOM_DEFAULT,
  type ZoomLevel,
} from "@/components/library/editor/zoom-dropdown-menu";
import { TiptapTocSidebar } from "@/components/library/editor/tiptap-toc-sidebar";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";
import { HIGHLIGHT_COLORS } from "@/components/library/editor/color-highlight-popover";
import {
  WikiLink,
  WikiLinkEditorOverlay,
} from "@/components/library/editor/wiki-link";

export function LibraryTiptapEditor({
  article,
  onBack,
}: {
  article: LibraryArticle;
  onBack: () => void;
}) {
  const [zoom, setZoom] = useState<ZoomLevel>(ZOOM_DEFAULT);
  const [tocAnchors, setTocAnchors] = useState<TableOfContentData>([]);
  const [tocOpen, setTocOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTocOpen(getTocVisible());
  }, []);

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
        scrollParent: () => scrollRef.current ?? window,
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
    (_id: string, element: HTMLElement) => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      editor?.chain().focus().run();
    },
    [editor]
  );

  const hasToc = tocAnchors.some((a) => a.originalLevel === 2);

  if (!editor) return null;

  return (
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
          <DrNoteLogo showWordmark forceWordmark />
        </div>

        <div className="simple-editor-header-end">
          {hasToc ? (
            <button
              type="button"
              className={`simple-editor-toc-toggle ${tocOpen ? "is-active" : ""}`}
              onClick={toggleToc}
              aria-label={tocOpen ? "Hide table of contents" : "Show table of contents"}
              title={tocOpen ? "Hide contents" : "Show contents"}
            >
              {tocOpen ? (
                <PanelRightClose size={16} strokeWidth={2} />
              ) : (
                <PanelRightOpen size={16} strokeWidth={2} />
              )}
              <span className="hidden sm:inline">Contents</span>
            </button>
          ) : null}
          <ZoomDropdownMenu
            currentZoom={zoom}
            onZoomChange={setZoom}
            onFitToPage={() => setZoom(ZOOM_DEFAULT)}
          />
        </div>
      </header>

      <Tiptap editor={editor}>
        <div className="simple-editor-toolbar-wrap">
          <SimpleEditorToolbar />
        </div>

        <div
          className={`simple-editor-body ${tocOpen && hasToc ? "simple-editor-body--with-toc" : ""}`}
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

          <TiptapTocSidebar
            anchors={tocAnchors}
            visible={tocOpen}
            onNavigate={navigateToHeading}
          />
        </div>

        <BubbleMenu editor={editor} className="tiptap-bubble-menu">
          {HIGHLIGHT_COLORS.slice(0, 4).map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.label}
              className="tiptap-bubble-swatch"
              style={{ backgroundColor: color.value }}
              onClick={() =>
                editor.chain().focus().toggleHighlight({ color: color.value }).run()
              }
            />
          ))}
          <button
            type="button"
            className="tiptap-bubble-copy"
            onClick={async () => {
              const { from, to } = editor.state.selection;
              const text = editor.state.doc.textBetween(from, to, "\n");
              await navigator.clipboard.writeText(text);
            }}
          >
            Copy
          </button>
        </BubbleMenu>

        <WikiLinkEditorOverlay editor={editor} />
      </Tiptap>
    </div>
  );
}
