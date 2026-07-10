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
import {
  ArrowLeft,
  List,
  PanelBottom,
  PanelTop,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LibraryArticle } from "@/lib/set-content";
import { getEditorBgTheme, type EditorBgTheme } from "@/lib/editor-bg-colors";
import { DecorationOnly } from "@/components/library/editor/decoration-only";
import { SectionHeading } from "@/components/library/editor/section-heading";
import { articleToTiptapContent } from "@/components/library/editor/article-to-tiptap";
import {
  getArticleEditorContent,
  getBgTheme,
  getChromeVisible,
  getTocVisible,
  saveArticleEditorContent,
  setBgTheme,
  setChromeVisible,
  setTocVisible,
} from "@/lib/library-editor-preferences";
import { SimpleEditorToolbar } from "@/components/library/editor/simple-editor-toolbar";
import { TiptapTocSidebar } from "@/components/library/editor/tiptap-toc-sidebar";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";
import { HIGHLIGHT_COLORS } from "@/components/library/editor/color-highlight-popover";
import {
  WikiLink,
  WikiLinkEditorOverlay,
} from "@/components/library/editor/wiki-link";
import { EditorSearchModal } from "@/components/library/editor/editor-search-modal";
import { EditorBgColorPicker } from "@/components/library/editor/editor-bg-color-picker";

export function LibraryTiptapEditor({
  article,
  onBack,
}: {
  article: LibraryArticle;
  onBack: () => void;
}) {
  const [tocAnchors, setTocAnchors] = useState<TableOfContentData>([]);
  const [tocOpen, setTocOpen] = useState(true);
  const [tocMobileOpen, setTocMobileOpen] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [bgTheme, setBgThemeState] = useState<EditorBgTheme>("white");
  const [searchOpen, setSearchOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const theme = getEditorBgTheme(bgTheme);

  useEffect(() => {
    setTocOpen(getTocVisible());
    setToolbarVisible(getChromeVisible());
    setBgThemeState(getBgTheme());
  }, [article.id]);

  const toggleToolbar = () => {
    setToolbarVisible((prev) => {
      const next = !prev;
      setChromeVisible(next);
      return next;
    });
  };

  const toggleToc = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTocMobileOpen((v) => !v);
      return;
    }
    setTocOpen((prev) => {
      const next = !prev;
      setTocVisible(next);
      return next;
    });
  };

  const handleBgChange = (next: EditorBgTheme) => {
    setBgThemeState(next);
    setBgTheme(next);
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
        style: `color: ${theme.prose}`,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: "tiptap simple-editor-prose",
          spellcheck: "false",
          style: `color: ${theme.prose}`,
        },
      },
    });
  }, [editor, theme.prose]);

  useEffect(() => {
    if (!editor) return;
    const saved = getArticleEditorContent(article.id);
    if (!saved) {
      editor.commands.setContent(articleToTiptapContent(article));
    }
  }, [article, editor]);

  const navigateToHeading = useCallback(
    (headingId: string) => {
      const el =
        headingId && scrollRef.current
          ? (scrollRef.current.querySelector(`#${CSS.escape(headingId)}`) as HTMLElement | null)
          : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      editor?.chain().focus().run();
    },
    [editor]
  );

  const navigateToHeadingFromToc = useCallback(
    (_id: string, element: HTMLElement) => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      editor?.chain().focus().run();
    },
    [editor]
  );

  const hasToc = tocAnchors.some((a) => a.originalLevel === 2);

  if (!editor) return null;

  const pageStyle = {
    "--editor-bg": theme.page,
    "--editor-fg": theme.prose,
    background: theme.page,
    color: theme.prose,
  } as React.CSSProperties;

  return (
    <div
      className={`simple-editor-page simple-editor-page--${bgTheme} ${toolbarVisible ? "simple-editor-page--toolbar" : "simple-editor-page--reading"}`}
      style={pageStyle}
    >
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
          <h1 className="simple-editor-title" title={article.title}>
            {article.title}
          </h1>
        </div>

        <div className="simple-editor-header-end">
          <button
            type="button"
            className="simple-editor-action-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            title="Search"
          >
            <Search size={16} strokeWidth={2} />
          </button>

          {hasToc ? (
            <button
              type="button"
              className={`simple-editor-action-btn ${tocOpen || tocMobileOpen ? "is-active" : ""}`}
              onClick={toggleToc}
              aria-label="Table of contents"
              title="Contents"
            >
              <List size={16} strokeWidth={2} />
            </button>
          ) : null}

          <EditorBgColorPicker theme={bgTheme} onChange={handleBgChange} />
        </div>
      </header>

      <Tiptap editor={editor}>
        {toolbarVisible ? (
          <div className="simple-editor-toolbar-wrap">
            <SimpleEditorToolbar />
          </div>
        ) : null}

        <div
          className={`simple-editor-body ${tocOpen && hasToc ? "simple-editor-body--with-toc" : ""}`}
        >
          <div ref={scrollRef} className="simple-editor-scroll">
            <div className="simple-editor-canvas">
              <div className="simple-editor-article-hero">
                <h2 className="simple-editor-article-title">{article.title}</h2>
                <p className="simple-editor-article-meta">
                  {article.subject} · {article.readMinutes} min read
                </p>
              </div>
              <Tiptap.Content />
            </div>
          </div>

          <TiptapTocSidebar
            anchors={tocAnchors}
            visible={tocOpen}
            mobileOpen={tocMobileOpen}
            onCloseMobile={() => setTocMobileOpen(false)}
            onNavigate={navigateToHeadingFromToc}
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

      <button
        type="button"
        className="simple-editor-chrome-fab"
        onClick={toggleToolbar}
        aria-label={toolbarVisible ? "Hide formatting tools" : "Show formatting tools"}
        title={toolbarVisible ? "Hide tools" : "Annotate"}
      >
        {toolbarVisible ? (
          <PanelBottom size={20} strokeWidth={2} />
        ) : (
          <PanelTop size={20} strokeWidth={2} />
        )}
      </button>

      {searchOpen ? (
        <EditorSearchModal
          editor={editor}
          onClose={() => setSearchOpen(false)}
          onNavigate={navigateToHeading}
        />
      ) : null}
    </div>
  );
}
