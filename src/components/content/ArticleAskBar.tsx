"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  AudioLines,
  Bot,
  Check,
  ChevronDown,
  MessageSquare,
  Mic,
  Plus,
  RotateCcw,
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
    article.sections.find((s) => s.id === "summary" || s.id === "overview")
      ?.body ??
    article.summary ??
    article.title;
  const snippet = overview.slice(0, 220).trim();
  return `Based on ${article.title}: ${snippet}${overview.length > 220 ? "…" : ""}\n\nYou asked: “${question.trim()}”. Name a section if you want a tighter walkthrough.`;
}

function activeModeLabel(activeMode: StudyModeFilter | null): string {
  if (!activeMode) return "Study";
  return (
    STUDY_MODE_OPTIONS.find((m) => m.id === activeMode)?.shortLabel ?? "Study"
  );
}

function AskTranscript({
  article,
  messages,
  streamingId,
}: {
  article: LibraryArticle;
  messages: AskMessage[];
  streamingId: string | null;
}) {
  return (
    <MessageScrollerProvider
      autoScroll
      defaultScrollPosition="last-anchor"
      scrollPreviousItemPeek={64}
    >
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent
            aria-busy={streamingId !== null}
            className="px-4 py-6"
          >
            {messages.length === 0 ? (
              <MessageScrollerItem messageId="welcome">
                <div className="flex flex-col items-center px-4 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                    <MessageSquare size={22} strokeWidth={2} />
                  </div>
                  <p className="mt-5 text-base font-extrabold text-slate-800">
                    Ask about {article.title}
                  </p>
                  <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-slate-500">
                    Send a message to start. Your question anchors near the top
                    and the reply streams below.
                  </p>
                </div>
              </MessageScrollerItem>
            ) : null}
            {messages.map((message) => {
              const isUser = message.role === "user";
              const isStreaming =
                !isUser && streamingId !== null && message.id === streamingId;

              return (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={isUser}
                >
                  <Message align={isUser ? "end" : "start"}>
                    {!isUser ? (
                      <MessageAvatar className="size-8 bg-slate-100 text-slate-700">
                        <Bot size={16} strokeWidth={2.5} />
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
                        <BubbleContent className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                          {isStreaming ? (
                            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
                          ) : null}
                        </BubbleContent>
                      </Bubble>
                      {!isUser && !isStreaming ? (
                        <MessageFooter>Saved on this article</MessageFooter>
                      ) : null}
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              );
            })}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton className="bottom-6" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

function ComposerForm({
  draft,
  setDraft,
  composerMode,
  setComposerMode,
  activeMode,
  onSelectMode,
  onSubmit,
  inputRef,
  compact = false,
}: {
  draft: string;
  setDraft: (value: string) => void;
  composerMode: ComposerMode;
  setComposerMode: (mode: ComposerMode) => void;
  activeMode: StudyModeFilter | null;
  onSelectMode: (mode: StudyModeFilter | null) => void;
  onSubmit: (e?: FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  compact?: boolean;
}) {
  const [commandOpen, setCommandOpen] = useState(false);
  const contentModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "content");
  const filterModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "filter");
  const presentModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "present");

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full items-center gap-1 rounded-full border border-slate-200/90 bg-white py-1.5 pl-2 pr-1.5 shadow-sm",
        compact &&
          "border-slate-200/90 bg-white/95 shadow-[0_10px_40px_rgba(15,23,42,0.12)] backdrop-blur-md"
      )}
    >
      <button
        type="button"
        onClick={() => setComposerMode("ask")}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100",
          composerMode === "ask" && "bg-slate-100 text-slate-800"
        )}
        aria-label="Ask AI"
        title="Ask AI"
      >
        <Plus size={18} strokeWidth={2.25} />
      </button>

      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
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
            activeMode && "bg-slate-100 text-slate-900"
          )}
          aria-label="Study mode"
        >
          <span className="max-w-[5rem] truncate sm:max-w-none">
            {activeModeLabel(activeMode)}
          </span>
          <ChevronDown size={12} strokeWidth={2.5} />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-72 border-slate-200 p-0 shadow-xl"
        >
          <Command>
            <CommandInput placeholder="Choose one mode…" />
            <CommandList>
              <CommandEmpty>No mode found.</CommandEmpty>
              <CommandGroup heading="Content">
                {contentModes.map((mode) => {
                  const Icon = mode.icon;
                  const active = activeMode === mode.id;
                  return (
                    <CommandItem
                      key={mode.id}
                      value={mode.shortLabel}
                      onSelect={() => {
                        onSelectMode(active ? null : mode.id);
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
              <CommandSeparator />
              <CommandGroup heading="Focus">
                {filterModes.map((mode) => {
                  const Icon = mode.icon;
                  const active = activeMode === mode.id;
                  return (
                    <CommandItem
                      key={mode.id}
                      value={mode.shortLabel}
                      onSelect={() => {
                        onSelectMode(active ? null : mode.id);
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
              <CommandSeparator />
              <CommandGroup heading="Present">
                {presentModes.map((mode) => {
                  const Icon = mode.icon;
                  const active = activeMode === mode.id;
                  return (
                    <CommandItem
                      key={mode.id}
                      value={mode.shortLabel}
                      onSelect={() => {
                        onSelectMode(active ? null : mode.id);
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
          setComposerMode(composerMode === "search" ? "ask" : "search");
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
  );
}

export function ArticleAskBar({
  article,
  activeMode,
  onSelectMode,
  onPanelOpenChange,
}: {
  article: LibraryArticle;
  activeMode: StudyModeFilter | null;
  onSelectMode: (mode: StudyModeFilter | null) => void;
  onPanelOpenChange?: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState("");
  const [composerMode, setComposerMode] = useState<ComposerMode>("ask");
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelInputRef = useRef<HTMLInputElement>(null);
  const streamTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMessages(loadChat(article.id));
  }, [article.id]);

  useEffect(() => {
    onPanelOpenChange?.(panelOpen);
  }, [panelOpen, onPanelOpenChange]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current !== null) {
        window.clearInterval(streamTimerRef.current);
      }
    };
  }, []);

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

  const streamAssistantReply = (
    assistantId: string,
    fullText: string,
    baseMessages: AskMessage[]
  ) => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
    }

    setStreamingId(assistantId);
    let index = 0;
    const chunkSize = 3;

    streamTimerRef.current = window.setInterval(() => {
      index = Math.min(index + chunkSize, fullText.length);
      const partial = fullText.slice(0, index);
      const nextMessages = baseMessages.map((message) =>
        message.id === assistantId
          ? { ...message, content: partial }
          : message
      );
      setMessages(nextMessages);

      if (index >= fullText.length) {
        if (streamTimerRef.current !== null) {
          window.clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
        setStreamingId(null);
        saveChat(article.id, nextMessages);
      }
    }, 16);
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
    const assistantId = `a-${Date.now() + 1}`;
    const assistantMessage: AskMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const nextMessages = [...messages, userMessage, assistantMessage];

    setMessages(nextMessages);
    setPanelOpen(true);
    setDraft("");
    streamAssistantReply(
      assistantId,
      mockArticleReply(article, text),
      nextMessages
    );

    window.requestAnimationFrame(() => panelInputRef.current?.focus());
  };

  const clearChat = () => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setStreamingId(null);
    setMessagesPersisted([]);
  };

  const openPanel = () => {
    setComposerMode("ask");
    setPanelOpen(true);
    window.requestAnimationFrame(() => panelInputRef.current?.focus());
  };

  return (
    <>
      {panelOpen ? (
        <>
          <button
            type="button"
            aria-label="Close chat panel"
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px] lg:hidden"
            onClick={() => setPanelOpen(false)}
          />
          <aside
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-2xl",
              "animate-in slide-in-from-right duration-300"
            )}
            aria-label="Ask AI chat"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-800">
                  Ask AI
                </p>
                <p className="truncate text-[11px] font-bold text-slate-400">
                  {article.title}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearChat}
                    aria-label="New chat"
                    title="New chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <RotateCcw size={15} strokeWidth={2.5} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close chat"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </header>

            <AskTranscript
              article={article}
              messages={messages}
              streamingId={streamingId}
            />

            <footer className="shrink-0 border-t border-slate-100 p-3">
              <ComposerForm
                draft={draft}
                setDraft={setDraft}
                composerMode={composerMode}
                setComposerMode={setComposerMode}
                activeMode={activeMode}
                onSelectMode={onSelectMode}
                onSubmit={submit}
                inputRef={panelInputRef}
              />
            </footer>
          </aside>
        </>
      ) : null}

      {!panelOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
          <div className="pointer-events-auto relative w-full max-w-xl">
            {searchOpen && composerMode === "search" ? (
              <div className="mb-2 max-h-64 overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_16px_50px_rgba(15,23,42,0.14)]">
                <div className="flex items-center justify-between px-2 pb-1">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Search article
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Close search"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
                {draft.trim() && searchResults.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm font-bold text-slate-400">
                    No matches
                  </p>
                ) : null}
                {!draft.trim() ? (
                  <p className="px-3 py-6 text-center text-sm font-bold text-slate-400">
                    Type to search this article
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
            ) : null}

            <div className="flex items-center gap-2">
              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={openPanel}
                  aria-label="Open chat"
                  title="Open chat"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_10px_40px_rgba(15,23,42,0.12)]"
                >
                  <MessageSquare size={18} strokeWidth={2.25} />
                </button>
              ) : null}
              <ComposerForm
                draft={draft}
                setDraft={setDraft}
                composerMode={composerMode}
                setComposerMode={setComposerMode}
                activeMode={activeMode}
                onSelectMode={onSelectMode}
                onSubmit={submit}
                inputRef={inputRef}
                compact
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
