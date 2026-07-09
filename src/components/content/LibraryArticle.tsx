"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Monitor,
  Pencil,
  Underline,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { CitationList } from "@/components/tool-ui/citation";
import { SuggestEditModal } from "@/components/SuggestEditModal";
import { ArticleAskBar } from "@/components/content/ArticleAskBar";
import {
  getInlineContentMode,
  INLINE_CONTENT_MODES,
  shouldShowSection,
  summarizeSectionText,
  type StudyModeFilter,
} from "@/components/content/ArticleStudyModes";
import {
  ArticleTableOfContents,
  sectionSlug,
} from "@/components/content/ArticleTableOfContents";
import {
  addTextHighlight,
  getArticleHighlights,
  getParagraphBookmarks,
  HIGHLIGHT_CLASSES,
  toggleParagraphBookmark,
  type HighlightColor,
  type TextHighlight,
} from "@/lib/article-annotations";
import {
  isArticleBookmarked,
  toggleArticleBookmark,
} from "@/lib/article-bookmarks";
import type { LibraryArticle, LibraryArticleSection } from "@/lib/set-content";

function applyHighlights(
  text: string,
  highlights: TextHighlight[],
  sectionId: string
): React.ReactNode[] {
  const sectionHighlights = highlights.filter((h) => h.sectionId === sectionId);
  if (sectionHighlights.length === 0) return [text];

  const parts: React.ReactNode[] = [];
  let remaining = text;

  for (const highlight of sectionHighlights) {
    const idx = remaining.indexOf(highlight.text);
    if (idx === -1) continue;
    if (idx > 0) parts.push(remaining.slice(0, idx));
    parts.push(
      <mark
        key={highlight.id}
        className={`rounded-sm px-0.5 ${HIGHLIGHT_CLASSES[highlight.style]}`}
      >
        {highlight.text}
      </mark>
    );
    remaining = remaining.slice(idx + highlight.text.length);
  }

  if (remaining) parts.push(remaining);
  return parts.length > 0 ? parts : [text];
}

function SelectionToolbar({
  rect,
  onCopy,
  onSuggestEdit,
  onHighlight,
  onUnderline,
  onBookmarkParagraph,
}: {
  rect: DOMRect;
  onCopy: () => void;
  onSuggestEdit: () => void;
  onHighlight: (color: HighlightColor) => void;
  onUnderline: () => void;
  onBookmarkParagraph: () => void;
}) {
  return (
    <div
      className="fixed z-50 flex flex-wrap items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-1 py-1 shadow-lg"
      style={{
        top: Math.max(8, rect.top - 52),
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 320)),
      }}
    >
      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
      >
        <Copy size={13} strokeWidth={2.5} />
        Copy
      </button>
      <button
        type="button"
        onClick={() => onHighlight("yellow")}
        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-amber-50"
        aria-label="Highlight yellow"
      >
        <span className="h-3.5 w-3.5 rounded-sm bg-amber-200" />
      </button>
      <button
        type="button"
        onClick={() => onHighlight("green")}
        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-emerald-50"
        aria-label="Highlight green"
      >
        <span className="h-3.5 w-3.5 rounded-sm bg-emerald-200" />
      </button>
      <button
        type="button"
        onClick={() => onHighlight("blue")}
        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50"
        aria-label="Highlight blue"
      >
        <span className="h-3.5 w-3.5 rounded-sm bg-sky-200" />
      </button>
      <button
        type="button"
        onClick={onUnderline}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50"
        aria-label="Underline"
      >
        <Underline size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={onSuggestEdit}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
      >
        <Pencil size={13} strokeWidth={2.5} />
        Edit
      </button>
      <button
        type="button"
        onClick={onBookmarkParagraph}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50"
        aria-label="Bookmark paragraph"
      >
        <Bookmark size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function sectionQuestions(
  article: LibraryArticle,
  section: LibraryArticleSection
) {
  const questions = article.questions ?? [];
  if (questions.length === 0) return [];
  const heading = section.heading.toLowerCase();
  const keyed = questions.filter(
    (q) =>
      q.text.toLowerCase().includes(heading.split(" ")[0] ?? "") ||
      q.explanation?.toLowerCase().includes(section.id)
  );
  if (keyed.length > 0) return keyed;
  // Distribute article questions across sections so each section has something.
  const idx = article.sections.findIndex((s) => s.id === section.id);
  return [questions[idx % questions.length]!].filter(Boolean);
}

function sectionFlashcards(
  article: LibraryArticle,
  section: LibraryArticleSection
) {
  const cards = article.flashcards ?? [];
  if (cards.length === 0) return [];
  const heading = section.heading.toLowerCase();
  const keyed = cards.filter(
    (c) =>
      c.front.toLowerCase().includes(heading.split(" ")[0] ?? "") ||
      c.back.toLowerCase().includes(heading.split(" ")[0] ?? "")
  );
  if (keyed.length > 0) return keyed;
  const idx = article.sections.findIndex((s) => s.id === section.id);
  return [cards[idx % cards.length]!].filter(Boolean);
}

function SectionBody({
  article,
  section,
  contentMode,
  highlights,
  paraBookmarked,
}: {
  article: LibraryArticle;
  section: LibraryArticleSection;
  contentMode: StudyModeFilter | null;
  highlights: TextHighlight[];
  paraBookmarked: boolean;
}) {
  if (contentMode === "summary") {
    const summary = summarizeSectionText(section.body, section.bullets);
    return (
      <p className="mt-3 text-base font-medium leading-relaxed text-slate-700">
        {summary}
      </p>
    );
  }

  if (contentMode === "questions") {
    const qs = sectionQuestions(article, section);
    if (qs.length === 0) {
      return (
        <p className="mt-3 text-sm font-bold text-slate-400">
          No questions for this section yet.
        </p>
      );
    }
    return (
      <div className="mt-4 space-y-5">
        {qs.map((q, idx) => (
          <div key={`${section.id}-q-${q.id}`} className="space-y-3">
            <p className="text-base font-extrabold leading-snug text-slate-800">
              <span className="mr-2 text-slate-400">{idx + 1}.</span>
              {q.text}
            </p>
            <ul className="space-y-2">
              {q.options.map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const correct = optIdx === q.answer;
                return (
                  <li
                    key={opt}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${
                      correct
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        correct
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-400 ring-1 ring-slate-200"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </li>
                );
              })}
            </ul>
            {q.explanation ? (
              <p className="text-sm font-medium leading-relaxed text-slate-500">
                {q.explanation}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (contentMode === "flashcards") {
    const cards = sectionFlashcards(article, section);
    if (cards.length === 0) {
      return (
        <p className="mt-3 text-sm font-bold text-slate-400">
          No cards for this section yet.
        </p>
      );
    }
    return (
      <div className="mt-4 space-y-3">
        {cards.map((card) => (
          <div
            key={`${section.id}-fc-${card.id}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-sm font-extrabold text-slate-800">{card.front}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              {card.back}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {paraBookmarked ? (
          <Bookmark
            size={14}
            className="text-slate-500"
            fill="currentColor"
          />
        ) : null}
      </div>
      {section.body ? (
        <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
          {applyHighlights(section.body, highlights, section.id)}
        </p>
      ) : null}
      {section.bullets && section.bullets.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {section.bullets.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-base font-medium leading-relaxed text-slate-600"
            >
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
              {applyHighlights(item, highlights, section.id)}
            </li>
          ))}
        </ul>
      ) : null}
      {section.citations && section.citations.length > 0 ? (
        <div className="mt-3">
          <CitationList
            id={`citation-list-${section.id}`}
            citations={section.citations}
            variant="stacked"
            size="compact"
          />
        </div>
      ) : null}
    </>
  );
}

export default function LibraryArticle({
  article,
  presentationMode,
}: {
  article: LibraryArticle;
  presentationMode?: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedText, setSelectedText] = useState<string | undefined>();
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [paragraphBookmarks, setParagraphBookmarks] = useState<Set<string>>(
    new Set()
  );
  const [studyModes, setStudyModes] = useState<Set<StudyModeFilter>>(new Set());
  const [isReading, setIsReading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const loadAnnotations = useCallback(() => {
    setHighlights(getArticleHighlights(article.id));
    const bookmarks = getParagraphBookmarks(article.id);
    setParagraphBookmarks(new Set(bookmarks.map((b) => b.sectionId)));
  }, [article.id]);

  useEffect(() => {
    setBookmarked(isArticleBookmarked(article.id));
    loadAnnotations();
  }, [article.id, loadAnnotations]);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionRect(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0) {
      setSelectionRect(rect);
      setSelectedText(selection.toString().trim());

      let node: Node | null = range.startContainer;
      while (node) {
        if (node instanceof HTMLElement && node.dataset.sectionId) {
          setActiveSectionId(node.dataset.sectionId);
          break;
        }
        node = node.parentElement;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  const clearSelection = () => {
    setSelectionRect(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleCopy = () => {
    if (selectedText) void navigator.clipboard.writeText(selectedText);
    clearSelection();
  };

  const openSuggestEdit = (text?: string) => {
    setSelectedText(text ?? selectedText);
    setShowEditModal(true);
    clearSelection();
  };

  const handleHighlight = (color: HighlightColor) => {
    if (!selectedText || !activeSectionId) return;
    addTextHighlight(article.id, activeSectionId, selectedText, color);
    loadAnnotations();
    clearSelection();
  };

  const handleUnderline = () => handleHighlight("underline");

  const handleBookmarkParagraph = () => {
    if (!activeSectionId) return;
    toggleParagraphBookmark(article.id, activeSectionId);
    loadAnnotations();
    clearSelection();
  };

  const articleText = useMemo(
    () =>
      article.sections
        .map((s) => `${s.heading}. ${s.body} ${(s.bullets ?? []).join(". ")}`)
        .join(" "),
    [article.sections]
  );

  const toggleReadAloud = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(articleText);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const toggleStudyMode = (mode: StudyModeFilter) => {
    setStudyModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) {
        next.delete(mode);
        return next;
      }
      if (INLINE_CONTENT_MODES.includes(mode)) {
        for (const inline of INLINE_CONTENT_MODES) next.delete(inline);
      }
      if (mode === "presentation") {
        // Present is exclusive fullscreen.
        next.clear();
      } else {
        next.delete("presentation");
      }
      next.add(mode);
      return next;
    });
  };

  const contentMode = getInlineContentMode(studyModes);
  const presentation = presentationMode || studyModes.has("presentation");

  const visibleSections = article.sections.filter((section) =>
    shouldShowSection(section.id, studyModes)
  );

  const slides = useMemo(() => {
    const items: Array<{ title: string; body?: string; bullets?: string[] }> = [
      {
        title: article.title,
        body: `${article.subject} · ${article.readMinutes} min read`,
      },
      ...article.sections.map((s) => ({
        title: s.heading,
        body: s.body || undefined,
        bullets: s.bullets,
      })),
    ];
    if (article.highYield) {
      items.push({ title: "High yield", body: article.highYield });
    }
    return items;
  }, [article]);

  useEffect(() => {
    if (!presentation) return;
    setSlideIndex(0);
  }, [presentation, article.id]);

  useEffect(() => {
    if (!presentation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlideIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Escape") {
        setStudyModes((prev) => {
          const next = new Set(prev);
          next.delete("presentation");
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentation, slides.length]);

  const content = (
    <div className="mx-auto flex w-full max-w-5xl gap-10 pb-36">
      <aside className="hidden w-44 shrink-0 lg:block xl:w-52">
        <ArticleTableOfContents
          headings={visibleSections.map((s) => s.heading)}
          activeId={
            visibleSections[0]
              ? sectionSlug(visibleSections[0].heading)
              : null
          }
        />
      </aside>

      <article className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleReadAloud}
              aria-label={isReading ? "Stop reading" : "Read aloud"}
              title={isReading ? "Stop" : "Read aloud"}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-colors ${
                isReading
                  ? "border-slate-700 bg-slate-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {isReading ? (
                <VolumeX size={16} strokeWidth={2.5} />
              ) : (
                <Volume2 size={16} strokeWidth={2.5} />
              )}
            </button>
            <button
              type="button"
              onClick={() => toggleStudyMode("presentation")}
              aria-label="Present slides"
              title="Present"
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Monitor size={16} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openSuggestEdit()}
              aria-label="Suggest edit"
              title="Suggest edit"
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Pencil size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => setBookmarked(toggleArticleBookmark(article.id))}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-colors ${
                bookmarked
                  ? "border-slate-700 bg-slate-700 text-white"
                  : "border-slate-200 bg-white text-slate-400 hover:text-slate-700"
              }`}
              aria-label={bookmarked ? "Remove bookmark" : "Save article"}
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark
                size={16}
                strokeWidth={2.5}
                fill={bookmarked ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>

        <header className="mt-2">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-800 sm:text-4xl">
            {article.title}
          </h1>
          {contentMode ? (
            <p className="mt-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
              {contentMode === "summary"
                ? "Summary view"
                : contentMode === "questions"
                  ? "Questions view"
                  : "Cards view"}
            </p>
          ) : null}
        </header>

        <nav
          className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
          aria-label="Contents"
        >
          {visibleSections.map((s) => (
            <a
              key={s.id}
              href={`#${sectionSlug(s.heading)}`}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-extrabold text-slate-500"
            >
              {s.heading}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-12">
          {visibleSections.map((section) => {
            const slug = sectionSlug(section.heading);
            const paraBookmarked = paragraphBookmarks.has(section.id);
            return (
              <section
                key={section.id}
                id={slug}
                data-section-id={section.id}
                className="scroll-mt-24"
              >
                <h2 className="text-xl font-black tracking-tight text-slate-800">
                  {section.heading}
                </h2>
                <SectionBody
                  article={article}
                  section={section}
                  contentMode={contentMode}
                  highlights={highlights}
                  paraBookmarked={paraBookmarked}
                />
              </section>
            );
          })}

          {article.highYield &&
          (!studyModes.has("hy") ||
            studyModes.size === 0 ||
            studyModes.has("hy") ||
            contentMode) ? (
            <aside className="rounded-2xl border-2 border-b-4 border-slate-700 bg-slate-50 p-4 sm:p-5">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-600">
                <Zap size={14} strokeWidth={3} /> High yield
              </p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">
                {article.highYield}
              </p>
            </aside>
          ) : null}
        </div>
      </article>
    </div>
  );

  const currentSlide = slides[slideIndex];

  const presentationDeck = presentation ? (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between px-5 py-4">
        <DrNoteLogo showWordmark forceWordmark />
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white/80">
            {article.subject}
          </span>
          <button
            type="button"
            onClick={() =>
              setStudyModes((prev) => {
                const next = new Set(prev);
                next.delete("presentation");
                return next;
              })
            }
            aria-label="Exit presentation"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 sm:px-16">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-white/40">
          {slideIndex + 1} / {slides.length}
        </p>
        <h2 className="max-w-4xl text-center text-3xl font-black leading-tight tracking-tight sm:text-5xl">
          {currentSlide?.title}
        </h2>
        {currentSlide?.body ? (
          <p className="mt-6 max-w-3xl text-center text-lg font-medium leading-relaxed text-white/80 sm:text-2xl">
            {currentSlide.body}
          </p>
        ) : null}
        {currentSlide?.bullets && currentSlide.bullets.length > 0 ? (
          <ul className="mt-8 max-w-2xl space-y-3 text-left">
            {currentSlide.bullets.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-base font-medium text-white/85 sm:text-xl"
              >
                <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#1DB954]" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-4 px-5 py-5">
        <button
          type="button"
          onClick={() => setSlideIndex((i) => Math.max(i - 1, 0))}
          disabled={slideIndex === 0}
          aria-label="Previous slide"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() =>
            setSlideIndex((i) => Math.min(i + 1, slides.length - 1))
          }
          disabled={slideIndex >= slides.length - 1}
          aria-label="Next slide"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {presentationDeck}

      {!presentation ? content : null}

      {!presentation ? (
        <ArticleAskBar
          article={article}
          activeModes={studyModes}
          onToggleMode={toggleStudyMode}
        />
      ) : null}

      {selectionRect && !presentation ? (
        <SelectionToolbar
          rect={selectionRect}
          onCopy={handleCopy}
          onSuggestEdit={() => openSuggestEdit()}
          onHighlight={handleHighlight}
          onUnderline={handleUnderline}
          onBookmarkParagraph={handleBookmarkParagraph}
        />
      ) : null}

      {showEditModal ? (
        <SuggestEditModal
          selectedText={selectedText}
          onClose={() => setShowEditModal(false)}
        />
      ) : null}
    </>
  );
}
