"use client";

import { useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Bot, Send, X } from "lucide-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { cn } from "@/lib/utils";
import { askMedGeniusAi } from "@/lib/medgenius/chat";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function mockAssistantReply(question: string, userText: string): string {
  return `For this question (${question.slice(0, 80)}…): ${userText.trim()} — Metformin primarily lowers hepatic glucose production. Think first-pass effect on gluconeogenesis, not insulin secretion. Would you like a mnemonic or a comparison with sulfonylureas?`;
}

export function createInitialChat(questionText: string): ChatMessage[] {
  return [
    {
      id: "welcome",
      role: "assistant",
      content: `I can help you break down this question step by step. What part would you like to explore?\n\n"${questionText.slice(0, 160)}${questionText.length > 160 ? "…" : ""}"`,
    },
  ];
}

export function QuestionChatPanel({
  open,
  onClose,
  questionText,
  messages,
  onMessagesChange,
}: {
  open: boolean;
  onClose: () => void;
  questionText: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const { getToken } = useAuth();
  const clerkEnabled = useClerkEnabled();

  if (!open) return null;

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const pending = [...messages, userMessage];
    onMessagesChange(pending);
    setDraft("");
    setSending(true);

    try {
      const token = clerkEnabled ? await getToken() : null;
      const result = await askMedGeniusAi(
        token,
        {
          message: text,
          conversationId,
          contextType: "question",
          questionText,
          mode: "explain",
        },
        () => mockAssistantReply(questionText, text)
      );

      setConversationId(result.conversationId || conversationId);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        content: result.reply,
      };

      onMessagesChange([...pending, assistantMessage]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-3">
          <DrNoteLogo size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-foreground">
              AI tutor
            </p>
            <p className="truncate text-[11px] font-bold text-muted-foreground">
              Ask about this question
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted"
        >
          <X size={15} strokeWidth={2.5} className="text-muted-foreground" />
        </button>
      </header>

      <MessageScrollerProvider
        autoScroll
        defaultScrollPosition="last-anchor"
        scrollPreviousItemPeek={64}
      >
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto w-full max-w-2xl px-4 py-6">
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={isUser}
                  >
                    <Message align={isUser ? "end" : "start"}>
                      {!isUser && (
                        <MessageAvatar className="size-8 bg-violet-100 text-violet-700">
                          <Bot size={16} strokeWidth={2.5} />
                        </MessageAvatar>
                      )}
                      <MessageContent>
                        {!isUser && (
                          <MessageHeader>Drnote AI</MessageHeader>
                        )}
                        <Bubble
                          variant={isUser ? "default" : "muted"}
                          className={cn(
                            isUser &&
                              "*:data-[slot=bubble-content]:border-transparent *:data-[slot=bubble-content]:bg-slate-700 *:data-[slot=bubble-content]:text-white",
                          )}
                        >
                          <BubbleContent className="whitespace-pre-wrap">
                            {message.content}
                          </BubbleContent>
                        </Bubble>
                        {!isUser && (
                          <MessageFooter>Saved for this question</MessageFooter>
                        )}
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

      <footer className="shrink-0 border-t border-border p-3">
        <form
          className="mx-auto flex w-full max-w-2xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this question..."
            className="h-11 rounded-2xl"
          />
          <Button
            type="submit"
            size="icon-lg"
            className="shrink-0 rounded-2xl bg-slate-800 text-white hover:bg-slate-700"
            disabled={!draft.trim()}
          >
            <Send size={16} strokeWidth={2.5} />
          </Button>
        </form>
      </footer>
    </div>
  );
}
