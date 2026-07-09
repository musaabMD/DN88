"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bookmark,
  Clock3,
  Copy,
  ListTree,
  Pencil,
  Zap,
} from "lucide-react";
import { CitationList } from "@/components/tool-ui/citation";
import { SuggestEditModal } from "@/components/SuggestEditModal";
import {
  isArticleBookmarked,
  toggleArticleBookmark,
} from "@/lib/article-bookmarks";
import type { LibraryArticle } from "@/lib/set-content";

function SelectionToolbar({
  rect,
  onCopy,
  onSuggestEdit,
}: {
  rect: DOMRect;
  onCopy: () => void;
  onSuggestEdit: () => void;
}) {
  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-1 py-1 shadow-lg"
      style={{
        top: rect.top - 48,
        left: Math.max(8, rect.left + rect.width / 2 - 120),
      }}
    >
      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
      >
        <Copy size={14} strokeWidth={2.5} />
        Copy
      </button>
      <button
        type="button"
        onClick={onSuggestEdit}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
      >
        <Pencil size={14} strokeWidth={2.5} />
        Suggest edit
      </button>
    </div>
  );
}

export default function LibraryArticle({
  article,
}: {
  article: LibraryArticle;
}) {
  const sectionHeadings = article.sections.map((s) => s.heading);
  const [bookmarked, setBookmarked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedText, setSelectedText] = useState<string | undefined>();
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setBookmarked(isArticleBookmarked(article.id));
  }, [article.id]);

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
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  const handleCopy = () => {
    if (selectedText) {
      void navigator.clipboard.writeText(selectedText);
    }
    setSelectionRect(null);
    window.getSelection()?.removeAllRanges();
  };

  const openSuggestEdit = (text?: string) => {
    setSelectedText(text ?? selectedText);
    setShowEditModal(true);
    setSelectionRect(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <>
      <article className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openSuggestEdit()}
            className="rounded-full border-2 border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Suggest Edit
          </button>
          <button
            type="button"
            onClick={() => setBookmarked(toggleArticleBookmark(article.id))}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-b-4 transition-colors active:translate-y-0.5 active:border-b-2 ${
              bookmarked
                ? "border-slate-700 bg-slate-700 text-white"
                : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            }`}
            aria-label={bookmarked ? "Remove bookmark" : "Save article"}
          >
            <Bookmark
              size={16}
              strokeWidth={2.5}
              fill={bookmarked ? "currentColor" : "none"}
            />
          </button>
        </div>

        <header className="mt-6">
          <span className="rounded-full bg-slate-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
            {article.subject}
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-800 sm:text-4xl">
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

        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Contents">
          <span className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            <ListTree size={14} strokeWidth={2.5} /> Jump to
          </span>
          {sectionHeadings.map((s, i) => (
            <a
              key={s}
              href={`#${s.toLowerCase().replace(/ /g, "-")}`}
              className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors ${
                i === 0
                  ? "border-slate-700 bg-slate-700 text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
              }`}
            >
              {s}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-6">
          {article.sections.map((section) => (
            <section
              key={section.id}
              id={section.heading.toLowerCase().replace(/ /g, "-")}
            >
              <h2 className="text-xl font-black tracking-tight text-slate-800">
                {section.heading}
              </h2>
              {section.body ? (
                <p className="mt-2 text-base font-medium leading-relaxed text-slate-600">
                  {section.body}
                </p>
              ) : null}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-base font-medium leading-relaxed text-slate-600"
                    >
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                      {item}
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
                  />
                </div>
              ) : null}
            </section>
          ))}

          {article.highYield ? (
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

      {selectionRect ? (
        <SelectionToolbar
          rect={selectionRect}
          onCopy={handleCopy}
          onSuggestEdit={() => openSuggestEdit()}
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
