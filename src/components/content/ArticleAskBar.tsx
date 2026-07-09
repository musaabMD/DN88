"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  AudioLines,
  Bot,
  Check,
  ChevronDown,
  Mic,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  STUDY_MODE_OPTIONS,
  type StudyModeFilter,
} from "@/components/content/ArticleStudyModes";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { cn } from "@/lib/utils";
import type { LibraryArticle } from "@/lib/set-content";

type ComposerMode = "ask" | "search";

export type AskMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const CHAT_STORAGE_PREFIX = "drnote-article-ask:";

function loadChat(articleId: string): AskMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${articleId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AskMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChat(articleId: string, messages: AskMessage[]) {
  try {
    localStorage.setItem(
      `${CHAT_STORAGE_PREFIX}${articleId}`,
      JSON.stringify(messages)
    );
  } catch {
    /* ignore quota */
  }
}

function mockArticleReply(article: LibraryArticle, question: string): string {
  const overview =
    article.sections.find((s) => s.id === "overview")?.body ??
    article.summary ??
    article.title;
  const snippet = overview.slice(0, 180).trim();
  return `Based on ${article.title}: ${snippet}${overview.length > 180 ? "…" : ""}\n\nYou asked: “${question.trim()}”. Name a section (e.g. Pathophysiology) if you want a tighter walkthrough.`;
}

function activeModeLabel(activeModes: Set<StudyModeFilter>): string {
  const active = STUDY_MODE_OPTIONS.filter((m) => activeModes.has(m.id));
  if (active.length === 0) return "Study";
  if (active.length === 1) return active[0]!.shortLabel;
  return `${active.length} modes`;
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
  const [commandOpen, setCommandOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(loadChat(article.id));
  }, [article.id]);

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

  const setMessagesPersisted = (next: AskMessage[]) => {
    setMessages(next);
    saveChat(article.id, next);
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;

    if (composerMode === "search") {
      setSearchOpen(true);
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
    setMessagesPersisted([...messages, userMessage, assistantMessage]);
    setChatOpen(true);
    setDraft("");
  };

  const contentModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "content");
  const filterModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "filter");
  const presentModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "present");

  return (
    <>
      {/* Side bubble chat */}
      {chatOpen ? (
        <div className="fixed inset-x-3 bottom-[5.5rem] z-50 flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[min(100vw-2rem,24rem)]">
          <div className="flex h-[min(70vh,32rem)] w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <DrNoteLogo size="sm" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-800">
                    Ask AI
                  </p>
                  <p className="truncate text-[11px] font-bold text-slate-400">
                    {article.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </header>

            <MessageScrollerProvider
              autoScroll
              defaultScrollPosition="last-anchor"
              scrollPreviousItemPeek={48}
            >
              <MessageScroller className="min-h-0 flex-1">
                <MessageScrollerViewport>
                  <MessageScrollerContent className="px-3 py-4">
                    {messages.length === 0 ? (
                      <MessageScrollerItem messageId="empty">
                        <p className="px-2 py-8 text-center text-sm font-bold text-slate-400">
                          Ask anything about {article.title}
                        </p>
                      </MessageScrollerItem>
                    ) : null}
                    {messages.map((message) => {
                      const isUser = message.role === "user";
                      return (
                        <MessageScrollerItem
                          key={message.id}
                          messageId={message.id}
                          scrollAnchor={isUser}
                        >
                          <Message align={isUser ? "end" : "start"}>
                            {!isUser ? (
                              <MessageAvatar className="size-7 bg-slate-100 text-slate-700">
                                <Bot size={14} strokeWidth={2.5} />
                              </MessageAvatar>
                            ) : null}
                            <MessageContent>
                              {!isUser ? (
                                <MessageHeader>Drnote AI</MessageHeader>
                              ) : null}
                              <Bubble
                                variant={isUser ? "default" : "muted"}
                                className={cn(
                                  isUser &&
                                    "*:data-[slot=bubble-content]:border-transparent *:data-[slot=bubble-content]:bg-slate-800 *:data-[slot=bubble-content]:text-white"
                                )}
                              >
                                <BubbleContent className="whitespace-pre-wrap text-[13px] leading-relaxed">
                                  {message.content}
                                </BubbleContent>
                              </Bubble>
                              {!isUser ? (
                                <MessageFooter>Saved on this article</MessageFooter>
                              ) : null}
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      );
                    })}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          </div>
        </div>
      ) : null}

      {/* Search results popover above bar */}
      {searchOpen && composerMode === "search" ? (
        <div className="fixed inset-x-3 bottom-[5.5rem] z-50 mx-auto max-w-xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-xl sm:-translate-x-1/2">
          <div className="max-h-64 overflow-y-auto rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-md">
            <div className="mb-1 flex items-center justify-between px-2 py-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                In this article
              </p>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                aria-label="Close search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
            {draft.trim() && searchResults.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm font-bold text-slate-400">
                No matches
              </p>
            ) : null}
            {searchResults.map((result, i) => (
              <a
                key={`${result.id}-${i}`}
                href={`#${result.id}`}
                onClick={() => setSearchOpen(false)}
                className="block rounded-2xl px-3 py-2.5 hover:bg-slate-50"
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
        </div>
      ) : null}

      {/* Floating pill composer */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
        <form
          onSubmit={submit}
          className="pointer-events-auto flex w-full max-w-xl items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 py-1.5 pl-2 pr-1.5 shadow-[0_10px_40px_rgba(15,23,42,0.12)] backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100",
              chatOpen && "bg-slate-100 text-slate-800"
            )}
            aria-label={chatOpen ? "Hide chat" : "Open chat history"}
            title="Chat"
          >
            <Plus size={18} strokeWidth={2.25} />
          </button>

          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (composerMode === "search") {
                setSearchOpen(Boolean(e.target.value.trim()));
              }
            }}
            onFocus={() => {
              if (composerMode === "ask" && messages.length > 0) {
                setChatOpen(true);
              }
            }}
            placeholder={
              composerMode === "search" ? "Search this article…" : "Ask anything"
            }
            className="min-w-0 flex-1 bg-transparent px-1 text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
          />

          <Popover open={commandOpen} onOpenChange={setCommandOpen}>
            <PopoverTrigger
              type="button"
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-extrabold text-slate-600 transition-colors hover:bg-slate-100",
                activeModes.size > 0 && "bg-slate-100 text-slate-900"
              )}
              aria-label="Study modes"
            >
              <span className="max-w-[4.5rem] truncate sm:max-w-none">
                {activeModeLabel(activeModes)}
              </span>
              <ChevronDown size={12} strokeWidth={2.5} />
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-72 border-slate-200 p-0 shadow-xl"
            >
              <Command>
                <CommandInput placeholder="Filter modes…" />
                <CommandList>
                  <CommandEmpty>No mode found.</CommandEmpty>
                  <CommandGroup heading="Content">
                    {contentModes.map((mode) => {
                      const Icon = mode.icon;
                      const active = activeModes.has(mode.id);
                      return (
                        <CommandItem
                          key={mode.id}
                          value={mode.shortLabel}
                          onSelect={() => onToggleMode(mode.id)}
                        >
                          <Icon size={14} strokeWidth={2.5} />
                          {mode.shortLabel}
                          {active ? (
                            <Check
                              size={14}
                              strokeWidth={2.5}
                              className="ml-auto text-slate-700"
                            />
                          ) : null}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Focus">
                    {filterModes.map((mode) => {
                      const Icon = mode.icon;
                      const active = activeModes.has(mode.id);
                      return (
                        <CommandItem
                          key={mode.id}
                          value={mode.shortLabel}
                          onSelect={() => onToggleMode(mode.id)}
                        >
                          <Icon size={14} strokeWidth={2.5} />
                          {mode.shortLabel}
                          {active ? (
                            <Check
                              size={14}
                              strokeWidth={2.5}
                              className="ml-auto text-slate-700"
                            />
                          ) : null}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Present">
                    {presentModes.map((mode) => {
                      const Icon = mode.icon;
                      const active = activeModes.has(mode.id);
                      return (
                        <CommandItem
                          key={mode.id}
                          value={mode.shortLabel}
                          onSelect={() => {
                            onToggleMode(mode.id);
                            setCommandOpen(false);
                          }}
                        >
                          <Icon size={14} strokeWidth={2.5} />
                          {mode.shortLabel}
                          {active ? (
                            <Check
                              size={14}
                              strokeWidth={2.5}
                              className="ml-auto text-slate-700"
                            />
                          ) : null}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <button
            type="button"
            onClick={() => {
              setComposerMode((m) => (m === "ask" ? "search" : "ask"));
              setSearchOpen(false);
              inputRef.current?.focus();
            }}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100",
              composerMode === "search" && "bg-slate-100 text-slate-800"
            )}
            aria-label={
              composerMode === "search" ? "Switch to Ask AI" : "Switch to Search"
            }
            title={composerMode === "search" ? "Ask AI" : "Search"}
          >
            {composerMode === "search" ? (
              <Search size={15} strokeWidth={2.5} />
            ) : (
              <Sparkles size={15} strokeWidth={2.5} />
            )}
          </button>

          <button
            type="button"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 sm:flex"
            aria-label="Voice input"
            title="Coming soon"
          >
            <Mic size={15} strokeWidth={2.5} />
          </button>

          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-opacity disabled:opacity-35 hover:bg-slate-800"
            aria-label={composerMode === "search" ? "Search" : "Send"}
          >
            {draft.trim() ? (
              <ArrowUp size={16} strokeWidth={2.5} />
            ) : (
              <AudioLines size={16} strokeWidth={2.5} />
            )}
          </button>
        </form>
      </div>
    </>
  );
}
