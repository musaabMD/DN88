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
import { ArrowLeft, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StudyModeFilter } from "@/components/content/ArticleStudyModes";
import { FloatingToc } from "@/components/content/FloatingToc";
import { ArticleSearchModal } from "@/components/content/ArticleSearchModal";
import type { LibraryArticle } from "@/lib/set-content";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { ArticleHeaderNav } from "@/components/library/editor/ArticleHeaderNav";
import { DrNoteSlides } from "@/components/library/editor/DrNoteSlides";
import { DecorationOnly } from "@/components/library/editor/decoration-only";
import { SectionHeading } from "@/components/library/editor/section-heading";
import { Callout } from "@/components/library/editor/callout";
import { articleToTiptapContent } from "@/components/library/editor/article-to-tiptap";
import {
  ARTICLE_EDITOR_CONTENT_VERSION,
  countCalloutNodes,
  getArticleEditorContent,
  getGlossaryEnabled,
  getStoredArticleEditorVersion,
  resolveArticleEditorContent,
  saveArticleEditorContent,
  setGlossaryEnabled as persistGlossaryEnabled,
} from "@/lib/library-editor-preferences";
import {
  AutoGlossary,
  setGlossaryDecorations,
} from "@/components/library/editor/reader/auto-glossary";
import { ArticleReaderFooter } from "@/components/library/editor/reader/ArticleReaderFooter";
import { HighlightsPanel } from "@/components/library/editor/reader/HighlightsPanel";
import { ImageLightbox } from "@/components/library/editor/reader/ImageLightbox";
import { ReaderProgress } from "@/components/library/editor/reader/ReaderProgress";
import { ArticleSectionToggles } from "@/components/library/editor/reader/ArticleSectionToggles";
import { SectionDeepLink } from "@/components/library/editor/reader/SectionDeepLink";
import {
  clampZoom,
  ZOOM_DEFAULT,
  ZOOM_MAX,
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
  ArticleMindmapView,
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
  const [glossaryOn, setGlossaryOn] = useState(() => getGlossaryEnabled());
  const [searchOpen, setSearchOpen] = useState(false);
  const [sectionToggleKey, setSectionToggleKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initialContent = useMemo(() => {
    const fresh = articleToTiptapContent(article);
    return resolveArticleEditorContent(article.id, fresh);
  }, [article]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      SectionHeading,
      Callout,
      Highlight.configure({ multicolor: true }),
      Underline,
      WikiLink,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Details.configure({ persist: true }),
      DetailsSummary,
      DetailsContent,
      Image.configure({
        HTMLAttributes: { class: "simple-editor-image" },
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
      // Auto-link known topic names to their articles (with hover peek).
      AutoGlossary.configure({ currentPageId: article.id, enabled: true }),
      DecorationOnly,
    ],
    content: initialContent,
    editable: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap simple-editor-prose",
        spellcheck: "false",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const fresh = articleToTiptapContent(article);
    const resolved = resolveArticleEditorContent(article.id, fresh);
    editor.commands.setContent(resolved);

    const storedVersion = getStoredArticleEditorVersion(article.id);
    const saved = getArticleEditorContent(article.id);
    const needsPersist =
      storedVersion < ARTICLE_EDITOR_CONTENT_VERSION ||
      countCalloutNodes(saved) < countCalloutNodes(fresh);
    if (needsPersist) {
      saveArticleEditorContent(article.id, resolved, ARTICLE_EDITOR_CONTENT_VERSION);
    }

    const afterContent = window.requestAnimationFrame(() => {
      setSectionToggleKey((value) => value + 1);
    });
    return () => window.cancelAnimationFrame(afterContent);
  }, [article.id, editor]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const resetScroll = () => {
      root.scrollTop = 0;
    };

    resetScroll();
    const afterPaint = window.requestAnimationFrame(resetScroll);
    const afterContent = window.setTimeout(resetScroll, 150);

    setActiveStudyMode(null);

    return () => {
      window.cancelAnimationFrame(afterPaint);
      window.clearTimeout(afterContent);
    };
  }, [article.id]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!editor) return;
    if (!getGlossaryEnabled()) setGlossaryDecorations(editor, false);
  }, [editor]);

  const handleGlossaryToggle = (enabled: boolean) => {
    setGlossaryOn(enabled);
    persistGlossaryEnabled(enabled);
    if (editor) setGlossaryDecorations(editor, enabled);
  };

  const handleFitToPage = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const canvas = scroll.querySelector<HTMLElement>(".simple-editor-canvas");
    if (!canvas) return;

    const padding = 24;
    const available = scroll.clientWidth - padding;
    const baseWidth = canvas.getBoundingClientRect().width / (zoom / 100);
    if (baseWidth <= 0 || available <= 0) return;

    setZoom(clampZoom(Math.round((available / baseWidth) * 100), 40, ZOOM_MAX));
  }, [zoom]);

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
      case "mindmap":
        return <ArticleMindmapView article={article} />;
      default:
        return (
          <>
            <Tiptap.Content />
            <ArticleReaderFooter article={article} />
          </>
        );
    }
  }

  return (
    <Tiptap editor={editor}>
      <div
        className={`simple-editor-page${!isReadMode ? " simple-editor-page--study" : ""} is-colorful`}
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
              onFitToPage={handleFitToPage}
              glossaryEnabled={glossaryOn}
              onGlossaryToggle={handleGlossaryToggle}
            />
            {isReadMode ? (
              <button
                type="button"
                className="simple-editor-icon-btn"
                title="Search article (⌘K)"
                aria-label="Search article"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={18} strokeWidth={2} />
              </button>
            ) : null}
            <ThemeToggle />
            <ArticleHeaderNav
              activeStudyMode={activeStudyMode}
              onStudyModeChange={setActiveStudyMode}
            />
          </div>
        </header>

        {isReadMode ? <ReaderProgress /> : null}

        <div className="simple-editor-body">
          <div
            ref={scrollRef}
            className="simple-editor-scroll"
            data-study-mode={activeStudyMode ?? "read"}
          >
            {isReadMode ? (
              <ArticleSectionToggles
                containerSelector=".simple-editor-scroll"
                contentKey={sectionToggleKey}
              />
            ) : null}
            <div
              className="simple-editor-canvas"
              style={{
                transform: `scale(${zoom / 100})`,
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
          <SectionDeepLink containerSelector=".simple-editor-scroll" />
        ) : null}
        {isReadMode ? (
          <ImageLightbox containerSelector=".simple-editor-scroll" />
        ) : null}
        {isReadMode ? (
          <HighlightsPanel
            editor={editor}
            articleTitle={article.title}
            containerSelector=".simple-editor-scroll"
          />
        ) : null}
        {isReadMode ? (
          <FloatingToc containerSelector=".simple-editor-scroll" />
        ) : null}
        {isReadMode && searchOpen ? (
          <ArticleSearchModal
            article={article}
            onClose={() => setSearchOpen(false)}
          />
        ) : null}
      </div>
    </Tiptap>
  );
}
