"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Clock3,
  Copy,
  Maximize2,
  Minimize2,
  Pencil,
  Underline,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { CitationList } from "@/components/tool-ui/citation";
import { SuggestEditModal } from "@/components/SuggestEditModal";
import { ArticleSearchModal } from "@/components/content/ArticleSearchModal";
import {
  ArticleStudyModes,
  getPrimaryViewMode,
  PRIMARY_VIEW_MODES,
  shouldShowSection,
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
import type { LibraryArticle } from "@/lib/set-content";

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
        <Underline size={13} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={onBookmarkParagraph}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50"
        aria-label="Bookmark paragraph"
      >
        <Bookmark size={13} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={onSuggestEdit}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
      >
        <Pencil size={13} strokeWidth={2.5} />
        Edit
      </button>
    </div>
  );
}

export default function LibraryArticle({
  article,
  examId,
  fullPage,
  onToggleFullPage,
  showSearch,
  onCloseSearch,
  presentationMode,
}: {
  article: LibraryArticle;
  examId: string;
  fullPage?: boolean;
  onToggleFullPage?: () => void;
  showSearch?: boolean;
  onCloseSearch?: () => void;
  presentationMode?: boolean;
}) {
  const sectionHeadings = article.sections.map((s) => s.heading);
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
      if (PRIMARY_VIEW_MODES.includes(mode)) {
        for (const primary of PRIMARY_VIEW_MODES) next.delete(primary);
      }
      next.add(mode);
      return next;
    });
  };

  const primaryView = getPrimaryViewMode(studyModes);
  const presentation = presentationMode || primaryView === "presentation";
  const showArticleBody =
    !primaryView || primaryView === "presentation";

  const visibleSections = article.sections.filter((section) =>
    shouldShowSection(section.id, studyModes)
  );

  const articleSummary =
    article.summary ??
    article.sections
      .filter((s) => s.id === "overview")
      .map((s) => s.body)
      .join(" ");

  const renderStudyView = () => {
    if (primaryView === "summary") {
      return (
        <div className="mt-6 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Summary
          </p>
          <p className="mt-3 text-base font-medium leading-relaxed text-slate-700 sm:text-lg">
            {articleSummary}
          </p>
          {article.highYield ? (
            <aside className="mt-5 rounded-xl border-2 border-slate-700 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-600">
                <Zap size={14} strokeWidth={3} /> High yield
              </p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">
                {article.highYield}
              </p>
            </aside>
          ) : null}
        </div>
      );
    }

    if (primaryView === "questions" && article.questions?.length) {
      return (
        <div className="mt-6 space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Questions from this article
          </p>
          {article.questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-2xl border-2 border-slate-200 bg-white p-4 sm:p-5"
            >
              <p className="text-xs font-bold text-slate-400">
                Question {idx + 1} · {q.subject}
              </p>
              <p className="mt-2 text-base font-extrabold leading-snug text-slate-800">
                {q.text}
              </p>
              <ul className="mt-3 space-y-2">
                {q.options.map((opt, optIdx) => (
                  <li
                    key={opt}
                    className={`rounded-xl border-2 px-3 py-2 text-sm font-bold ${
                      optIdx === q.answer
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}. {opt}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                {q.explanation}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (primaryView === "flashcards" && article.flashcards?.length) {
      return (
        <div className="mt-6 space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Flashcards from this article
          </p>
          {article.flashcards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 sm:p-5"
            >
              <p className="text-xs font-bold text-slate-400">{card.deck}</p>
              <p className="mt-2 text-base font-extrabold text-slate-800">
                {card.front}
              </p>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm font-medium leading-relaxed text-slate-600">
                {card.back}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const content = (
    <div
      className={`mx-auto flex w-full gap-8 ${presentation ? "max-w-3xl" : "max-w-5xl"}`}
    >
      {!fullPage && showArticleBody && primaryView !== "presentation" ? (
        <aside className="hidden w-48 shrink-0 lg:block xl:w-56">
          <ArticleTableOfContents
            headings={sectionHeadings}
            activeId={sectionHeadings[0] ? sectionSlug(sectionHeadings[0]) : null}
          />
        </aside>
      ) : null}

      <article className="min-w-0 flex-1">
        {!fullPage ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleReadAloud}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition-colors ${
                  isReading
                    ? "border-slate-700 bg-slate-700 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {isReading ? (
                  <VolumeX size={14} strokeWidth={2.5} />
                ) : (
                  <Volume2 size={14} strokeWidth={2.5} />
                )}
                {isReading ? "Stop" : "Read article"}
              </button>
              <button
                type="button"
                onClick={onToggleFullPage}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Maximize2 size={14} strokeWidth={2.5} />
                Full page
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openSuggestEdit()}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Suggest Edit
              </button>
              <button
                type="button"
                onClick={() => setBookmarked(toggleArticleBookmark(article.id))}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  bookmarked
                    ? "border-slate-700 bg-slate-700 text-white"
                    : "border-slate-200 bg-white text-slate-400 hover:text-slate-700"
                }`}
                aria-label={bookmarked ? "Remove bookmark" : "Save article"}
              >
                <Bookmark
                  size={15}
                  strokeWidth={2.5}
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onToggleFullPage}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
            >
              <Minimize2 size={14} strokeWidth={2.5} />
              Exit full page
            </button>
          </div>
        )}

        <header className="mt-4">
          {presentation ? (
            <div className="mb-4 flex items-center justify-between gap-4">
              <DrNoteLogo showWordmark forceWordmark />
              <span className="rounded-full bg-slate-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
                {article.subject}
              </span>
            </div>
          ) : (
            <span className="rounded-full bg-slate-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
              {article.subject}
            </span>
          )}
          <h1
            className={`mt-2 font-black leading-tight tracking-tight text-slate-800 ${
              presentation ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
            }`}
          >
            {article.title}
          </h1>
          <p className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1">
              <Clock3 size={13} strokeWidth={2.5} /> {article.readMinutes} min
              read
            </span>
            <span>Updated {article.updated}</span>
          </p>
        </header>

        {showArticleBody && primaryView !== "presentation" ? (
          <nav
            className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            aria-label="Contents"
          >
            {sectionHeadings.map((s, index) => (
              <a
                key={s}
                href={`#${sectionSlug(s)}`}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:border-[#1DB954]/40 hover:bg-[#E8F8EE]"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-md bg-[#1DB954] text-[9px] font-black text-[#191414]">
                  {index + 1}
                </span>
                {s}
              </a>
            ))}
          </nav>
        ) : null}

        {primaryView && primaryView !== "presentation" ? renderStudyView() : null}

        {showArticleBody ? (
        <div className={`mt-6 space-y-6 ${presentation ? "space-y-8" : ""}`}>
          {visibleSections.map((section) => {
            const slug = sectionSlug(section.heading);
            const paraBookmarked = paragraphBookmarks.has(section.id);
            return (
              <section
                key={section.id}
                id={slug}
                data-section-id={section.id}
              >
                <div className="flex items-center gap-2">
                  <h2
                    className={`font-black tracking-tight text-slate-800 ${
                      presentation ? "text-2xl" : "text-xl"
                    }`}
                  >
                    {section.heading}
                  </h2>
                  {paraBookmarked ? (
                    <Bookmark
                      size={14}
                      className="text-slate-500"
                      fill="currentColor"
                    />
                  ) : null}
                </div>
                {section.body ? (
                  <p
                    className={`mt-2 font-medium leading-relaxed text-slate-600 ${
                      presentation ? "text-lg sm:text-xl" : "text-base"
                    }`}
                  >
                    {applyHighlights(section.body, highlights, section.id)}
                  </p>
                ) : null}
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-2.5 font-medium leading-relaxed text-slate-600 ${
                          presentation ? "text-lg" : "text-base"
                        }`}
                      >
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                        {applyHighlights(item, highlights, section.id)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.citations && section.citations.length > 0 ? (
                  <div className="mt-2">
                    <CitationList
                      id={`citation-list-${section.id}`}
                      citations={section.citations}
                      variant="stacked"
                      size="compact"
                    />
                  </div>
                ) : null}
              </section>
            );
          })}

          {article.highYield && (!studyModes.has("hy") || studyModes.size === 0 || studyModes.has("hy")) ? (
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
        ) : null}
      </article>
    </div>
  );

  return (
    <>
      {fullPage ? (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-white px-6 py-8">
          {content}
        </div>
      ) : (
        content
      )}

      {!fullPage ? (
        <ArticleStudyModes
          activeModes={studyModes}
          onToggleMode={toggleStudyMode}
        />
      ) : null}

      {selectionRect ? (
        <SelectionToolbar
          rect={selectionRect}
          onCopy={handleCopy}
          onSuggestEdit={() => openSuggestEdit()}
          onHighlight={handleHighlight}
          onUnderline={handleUnderline}
          onBookmarkParagraph={handleBookmarkParagraph}
        />
      ) : null}

      {showSearch ? (
        <ArticleSearchModal article={article} onClose={() => onCloseSearch?.()} />
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
