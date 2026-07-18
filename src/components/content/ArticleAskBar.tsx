"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  MessageCircle,
  RotateCcw,
  Search,
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
import { useAuth } from "@clerk/clerk-react";
import { askMedGeniusAi } from "@/lib/medgenius/chat";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

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

function StudyModePicker({
  activeMode,
  onSelectMode,
}: {
  activeMode: StudyModeFilter | null;
  onSelectMode: (mode: StudyModeFilter | null) => void;
}) {
  const [commandOpen, setCommandOpen] = useState(false);
  const contentModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "content");
  const filterModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "filter");
  const presentModes = STUDY_MODE_OPTIONS.filter((m) => m.group === "present");

  return (
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
  );
}

function ChatTranscript({
  messages,
  streamingId,
}: {
  messages: AskMessage[];
  streamingId: string | null;
}) {
  return (
    <MessageScrollerProvider
      autoScroll
      defaultScrollPosition="last-anchor"
      scrollPreviousItemPeek={48}
    >
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent
            aria-busy={streamingId !== null}
            className="px-3 py-4"
          >
            {messages.length === 0 ? (
              <MessageScrollerItem messageId="welcome">
                <div className="px-2 py-6 text-center">
                  <p className="text-sm font-extrabold text-slate-800">
                    Ask about this article
                  </p>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">
                    Questions anchor near the top; replies stream below.
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
        <MessageScrollerButton className="bottom-3" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

export function ArticleAskBar({
  article,
  activeMode,
  onSelectMode,
}: {
  article: LibraryArticle;
  activeMode: StudyModeFilter | null;
  onSelectMode: (mode: StudyModeFilter | null) => void;
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const streamTimerRef = useRef<number | null>(null);
  const { getToken } = useAuth();
  const clerkEnabled = useClerkEnabled();

  useEffect(() => {
    setMessages(loadChat(article.id));
  }, [article.id]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current !== null) {
        window.clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (chatOpen) {
      window.requestAnimationFrame(() => chatInputRef.current?.focus());
    }
  }, [chatOpen]);

  const searchResults = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();
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
  }, [article.sections, searchDraft]);

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

    streamTimerRef.current = window.setInterval(() => {
      index = Math.min(index + 3, fullText.length);
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

  const submitSearch = (e?: FormEvent) => {
    e?.preventDefault();
    if (!searchDraft.trim()) return;
    setSearchOpen(true);
  };

  const submitChat = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;

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
    setChatDraft("");
    setChatOpen(true);

    const token = clerkEnabled ? await getToken() : null;
    const articleContext = article.sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n");
    const result = await askMedGeniusAi(
      token,
      {
        message: text,
        conversationId,
        contextType: "document",
        contextId: article.id,
        questionText: articleContext.slice(0, 8000),
        mode: "explain",
      },
      () => mockArticleReply(article, text)
    );

    setConversationId(result.conversationId || conversationId);
    streamAssistantReply(assistantId, result.reply, nextMessages);
  };

  const clearChat = () => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setStreamingId(null);
    setMessages([]);
    saveChat(article.id, []);
  };

  const hasHistory = messages.length > 0;

  return (
    <>
      {/* Intercom-style chat bubble — separate from search bar */}
      <div
        className="fixed z-50 flex flex-col items-end gap-3 pointer-events-none"
        style={{
          right: "max(1rem, env(safe-area-inset-right, 0px))",
          bottom:
            "calc(max(5.25rem, env(safe-area-inset-bottom, 0px)) + 0.25rem)",
        }}
      >
        {chatOpen ? (
          <div
            className="pointer-events-auto flex h-[min(32rem,calc(100dvh-7.5rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] animate-in fade-in-0 slide-in-from-bottom-4 duration-200"
            role="dialog"
            aria-label="Ask AI chat"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-800">
                  Ask AI
                </p>
                <p className="truncate text-[11px] font-bold text-slate-400">
                  {article.title}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                {hasHistory ? (
                  <button
                    type="button"
                    onClick={clearChat}
                    aria-label="New chat"
                    title="New chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <RotateCcw size={14} strokeWidth={2.5} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  aria-label="Minimize chat"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <ChatTranscript messages={messages} streamingId={streamingId} />

            <form
              onSubmit={submitChat}
              className="flex shrink-0 items-center gap-2 border-t border-slate-100 p-3"
            >
              <input
                ref={chatInputRef}
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Ask anything…"
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!chatDraft.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-opacity disabled:opacity-35 hover:bg-slate-800"
                aria-label="Send message"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setChatOpen((open) => !open)}
          aria-label={chatOpen ? "Close Ask AI" : "Open Ask AI"}
          aria-expanded={chatOpen}
          className={cn(
            "pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-b-4 shadow-[0_12px_40px_rgba(15,23,42,0.2)] transition-all active:translate-y-0.5 active:border-b-2",
            chatOpen
              ? "border-slate-700 bg-slate-800 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          {chatOpen ? (
            <X size={22} strokeWidth={2.5} />
          ) : (
            <MessageCircle size={22} strokeWidth={2.25} />
          )}
          {!chatOpen && hasHistory ? (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#1DB954] ring-2 ring-white" />
          ) : null}
        </button>
      </div>

      {/* Bottom search + study bar — no Ask AI popup */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-xl">
          {searchOpen ? (
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
              {searchDraft.trim() && searchResults.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm font-bold text-slate-400">
                  No matches
                </p>
              ) : null}
              {!searchDraft.trim() ? (
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

          <form
            onSubmit={submitSearch}
            className="flex w-full items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 py-1.5 pl-3 pr-1.5 shadow-[0_10px_40px_rgba(15,23,42,0.12)] backdrop-blur-md"
          >
            <Search
              size={16}
              strokeWidth={2.5}
              className="shrink-0 text-slate-400"
            />
            <input
              ref={searchInputRef}
              value={searchDraft}
              onChange={(e) => {
                setSearchDraft(e.target.value);
                if (e.target.value.trim()) setSearchOpen(true);
              }}
              placeholder="Search this article…"
              className="min-w-0 flex-1 bg-transparent px-1 text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
            />

            <StudyModePicker
              activeMode={activeMode}
              onSelectMode={onSelectMode}
            />

            <button
              type="submit"
              disabled={!searchDraft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-opacity disabled:opacity-35 hover:bg-slate-800"
              aria-label="Search"
            >
              <Search size={16} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
