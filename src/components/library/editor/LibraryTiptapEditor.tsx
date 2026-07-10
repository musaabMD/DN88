"use client";

import { Tiptap, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { TableOfContents } from "@tiptap/extension-table-of-contents";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LibraryArticle } from "@/lib/set-content";
import { DecorationOnly } from "@/components/library/editor/decoration-only";
import { SectionHeading } from "@/components/library/editor/section-heading";
import { articleToTiptapContent } from "@/components/library/editor/article-to-tiptap";
import {
  getArticleEditorContent,
  saveArticleEditorContent,
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

/**
 * Full-page Simple Editor for library articles.
 * @see https://tiptap.dev/docs/ui-components/templates/simple-editor
 */
export function LibraryTiptapEditor({
  article,
  onBack,
}: {
  article: LibraryArticle;
  onBack: () => void;
}) {
  const [zoom, setZoom] = useState<ZoomLevel>(ZOOM_DEFAULT);
  const [tocAnchors, setTocAnchors] = useState<TableOfContentData>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableOfContents.configure({
        anchorTypes: ["heading"],
        getId: (content) => sectionSlug(content),
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

  if (!editor) return null;

  return (
    <div className="simple-editor-page">
      <header className="simple-editor-header">
        <button
          type="button"
          className="simple-editor-back"
          onClick={onBack}
          aria-label="Back to library"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          <span>Library</span>
        </button>
        <ZoomDropdownMenu
          currentZoom={zoom}
          onZoomChange={setZoom}
          onFitToPage={() => setZoom(ZOOM_DEFAULT)}
        />
      </header>

      <Tiptap editor={editor}>
        <div className="simple-editor-toolbar-wrap">
          <SimpleEditorToolbar />
        </div>

        <div className="simple-editor-body">
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

          <TiptapTocSidebar anchors={tocAnchors} onNavigate={navigateToHeading} />
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
      </Tiptap>
    </div>
  );
}
