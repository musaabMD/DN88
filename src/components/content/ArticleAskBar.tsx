"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  ChevronDown,
  Filter,
  Mic,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  STUDY_MODE_OPTIONS,
  type StudyModeFilter,
} from "@/components/content/ArticleStudyModes";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";
import type { LibraryArticle } from "@/lib/set-content";

type ComposerMode = "ask" | "search";

type AskMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function mockArticleReply(article: LibraryArticle, question: string): string {
  const overview =
    article.sections.find((s) => s.id === "overview")?.body ??
    article.summary ??
    article.title;
  const snippet = overview.slice(0, 160).trim();
  return `Based on ${article.title}: ${snippet}${overview.length > 160 ? "…" : ""}\n\nYou asked: “${question.trim()}”. Focus on the high-yield points in this article — I can also walk through a specific section if you name it.`;
}

export function ArticleAskBar({
  article,
  activeModes,
  onToggleMode,
}: {
  article: LibraryArticle;
  activeModes: Set<StudyModeFilter>;
  onToggleMode: (mode: StudyModeFilter) => void;
}) {
  const [draft, setDraft] = useState("");
  const [composerMode, setComposerMode] = useState<ComposerMode>("ask");
  const [filterOpen, setFilterOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    if (composerMode !== "search") return [];
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return article.sections.flatMap((section) => {
      const matches: Array<{ heading: string; snippet: string; id: string }> =
        [];
      if (section.body.toLowerCase().includes(q)) {
        matches.push({
          heading: section.heading,
          snippet: section.body.slice(0, 140),
          id: sectionSlug(section.heading),
        });
      }
      for (const bullet of section.bullets ?? []) {
        if (bullet.toLowerCase().includes(q)) {
          matches.push({
            heading: section.heading,
            snippet: bullet,
            id: sectionSlug(section.heading),
          });
        }
      }
      return matches;
    });
  }, [article.sections, composerMode, draft]);

  useEffect(() => {
    if (!filterOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [filterOpen]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;

    if (composerMode === "search") {
      setPanelOpen(true);
      return;
    }

    const userMessage: AskMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const assistantMessage: AskMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      content: mockArticleReply(article, text),
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setPanelOpen(true);
    setDraft("");
  };

  const activeFilterCount = STUDY_MODE_OPTIONS.filter(
    (m) => m.group !== "present" && activeModes.has(m.id)
  ).length;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="mx-auto w-full max-w-2xl">
        {panelOpen ? (
          <div className="mb-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                {composerMode === "search" ? "In this article" : "Ask AI"}
              </p>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close panel"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {composerMode === "search" ? (
              <div className="space-y-1">
                {draft.trim() && searchResults.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm font-bold text-slate-400">
                    No matches
                  </p>
                ) : null}
                {searchResults.map((result, i) => (
                  <a
                    key={`${result.id}-${i}`}
                    href={`#${result.id}`}
                    onClick={() => setPanelOpen(false)}
                    className="block rounded-xl px-3 py-2 hover:bg-slate-50"
                  >
                    <p className="text-xs font-extrabold text-slate-700">
                      {result.heading}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500">
                      {result.snippet}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="px-2 py-3 text-center text-sm font-bold text-slate-400">
                    Ask anything about {article.title}
                  </p>
                ) : null}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl px-3 py-2 text-sm font-medium leading-relaxed ${
                      msg.role === "user"
                        ? "ml-8 bg-slate-800 text-white"
                        : "mr-4 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <form
          onSubmit={submit}
          className="rounded-3xl border border-slate-200 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md"
        >
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (composerMode === "search" && e.target.value.trim()) {
                setPanelOpen(true);
              }
            }}
            onFocus={() => {
              if (composerMode === "ask" && messages.length > 0) {
                setPanelOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={
              composerMode === "search"
                ? "Search this article…"
                : "Ask a follow-up"
            }
            className="max-h-28 w-full resize-none bg-transparent px-4 pb-2 pt-3.5 text-sm font-bold text-slate-800 outline-none placeholder:font-semibold placeholder:text-slate-400"
          />

          <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="More"
                title="Coming soon"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>

              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-extrabold transition-colors ${
                    activeFilterCount > 0 || filterOpen
                      ? "border-slate-700 bg-slate-700 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  aria-expanded={filterOpen}
                  aria-label="Study filters"
                >
                  <Filter size={13} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Filter</span>
                  {activeFilterCount > 0 ? (
                    <span className="rounded-full bg-white/20 px-1.5 text-[10px]">
                      {activeFilterCount}
                    </span>
                  ) : (
                    <ChevronDown size={12} strokeWidth={2.5} />
                  )}
                </button>

                {filterOpen ? (
                  <div className="absolute bottom-10 left-0 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                      Study modes
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STUDY_MODE_OPTIONS.map((mode) => {
                        const Icon = mode.icon;
                        const active = activeModes.has(mode.id);
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              onToggleMode(mode.id);
                              if (mode.id === "presentation") {
                                setFilterOpen(false);
                              }
                            }}
                            className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 text-left transition-colors ${
                              active
                                ? "border-slate-700 bg-slate-700 text-white"
                                : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                            }`}
                          >
                            <Icon size={13} strokeWidth={2.5} />
                            <span className="text-[11px] font-extrabold leading-tight">
                              {mode.shortLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  setComposerMode((m) => (m === "ask" ? "search" : "ask"));
                  setPanelOpen(false);
                  inputRef.current?.focus();
                }}
                className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-extrabold transition-colors ${
                  composerMode === "search"
                    ? "border-slate-700 bg-slate-700 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                aria-pressed={composerMode === "search"}
              >
                {composerMode === "search" ? (
                  <Search size={13} strokeWidth={2.5} />
                ) : (
                  <Sparkles size={13} strokeWidth={2.5} />
                )}
                <span className="hidden sm:inline">
                  {composerMode === "search" ? "Search" : "Ask AI"}
                </span>
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                aria-label="Voice input"
                title="Coming soon"
              >
                <Mic size={15} strokeWidth={2.5} />
              </button>
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-white transition-opacity disabled:opacity-30 hover:bg-slate-800"
                aria-label={composerMode === "search" ? "Search" : "Send"}
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
