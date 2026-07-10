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
import { UniqueID } from "@tiptap/extension-unique-id";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StudyModeFilter } from "@/components/content/ArticleStudyModes";
import { FloatingToc } from "@/components/content/FloatingToc";
import type { LibraryArticle } from "@/lib/set-content";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { ArticleHeaderNav } from "@/components/library/editor/ArticleHeaderNav";
import { DrNoteSlides } from "@/components/library/editor/DrNoteSlides";
import { DecorationOnly } from "@/components/library/editor/decoration-only";
import { SectionHeading } from "@/components/library/editor/section-heading";
import { articleToTiptapContent } from "@/components/library/editor/article-to-tiptap";
import {
  getArticleEditorContent,
  saveArticleEditorContent,
} from "@/lib/library-editor-preferences";
import {
  ZOOM_DEFAULT,
  type ZoomLevel,
} from "@/components/library/editor/zoom-dropdown-menu";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";
import {
  WikiLink,
  WikiLinkEditorOverlay,
  WikiLinkHoverPreview,
} from "@/components/library/editor/wiki-link";
import { SelectionBubbleMenu } from "@/components/library/editor/selection-bubble-menu";
import { EditorOverflowMenu } from "@/components/library/editor/editor-overflow-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArticleExamView,
  ArticleFlashcardsView,
  ArticleHYView,
  ArticlePracticeView,
  ArticleQAView,
  ArticleRoundView,
} from "@/components/library/editor/ArticleStudyViews";
import { articleToSlideDeck } from "@/lib/article-to-slides";

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
  const [activeStudyMode, setActiveStudyMode] = useState<StudyModeFilter | null>(
    null
  );
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
        scrollParent: getScrollParent,
      }),
      // Stable per-block anchors for deep links + future backlinks.
      // Uses a dedicated attribute so it never clobbers heading slug ids.
      UniqueID.configure({
        attributeName: "data-block-id",
        types: ["heading", "paragraph", "blockquote", "listItem", "details"],
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

  const slideDeck = useMemo(() => articleToSlideDeck(article), [article]);

  const isPresentation = activeStudyMode === "presentation";
  const isReadMode = activeStudyMode === null;

  if (isPresentation) {
    return (
      <DrNoteSlides
        deck={slideDeck}
        onExit={() => setActiveStudyMode(null)}
      />
    );
  }

  if (!editor) return null;

  function renderStudyContent() {
    switch (activeStudyMode) {
      case "questions":
        return <ArticlePracticeView article={article} />;
      case "hy":
        return <ArticleHYView article={article} />;
      case "exam":
        return <ArticleExamView article={article} />;
      case "flashcards":
        return <ArticleFlashcardsView article={article} />;
      case "round":
        return <ArticleRoundView article={article} />;
      case "qa":
        return <ArticleQAView article={article} />;
      default:
        return <Tiptap.Content />;
    }
  }

  return (
    <Tiptap editor={editor}>
      <div
        className={`simple-editor-page${!isReadMode ? " simple-editor-page--study" : ""}`}
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
            <DrNoteLogo showWordmark />
          </div>

          <div className="simple-editor-header-end">
            <EditorOverflowMenu
              currentZoom={zoom}
              onZoomChange={setZoom}
              onFitToPage={() => setZoom(ZOOM_DEFAULT)}
            />
            <ThemeToggle />
            <ArticleHeaderNav
              activeStudyMode={activeStudyMode}
              onStudyModeChange={setActiveStudyMode}
            />
          </div>
        </header>

        <div className="simple-editor-body">
          <div
            ref={scrollRef}
            className="simple-editor-scroll"
            data-study-mode={activeStudyMode ?? "read"}
          >
            <div
              className="simple-editor-canvas"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {renderStudyContent()}
            </div>
          </div>
        </div>

        {isReadMode ? <SelectionBubbleMenu editor={editor} /> : null}
        {isReadMode ? <WikiLinkEditorOverlay editor={editor} /> : null}
        {isReadMode ? (
          <WikiLinkHoverPreview containerSelector=".simple-editor-scroll" />
        ) : null}
        {isReadMode ? (
          <FloatingToc containerSelector=".simple-editor-scroll" />
        ) : null}
      </div>
    </Tiptap>
  );
}
