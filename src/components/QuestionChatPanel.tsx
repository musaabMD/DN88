"use client";

import { useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
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

  if (!open) return null;

  const send = () => {
    const text = draft.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      content: mockAssistantReply(questionText, text),
    };

    onMessagesChange([...messages, userMessage, assistantMessage]);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      <div
        className="flex items-center justify-between px-4 h-14 flex-shrink-0 border-b border-slate-200"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={16} className="text-violet-600 shrink-0" strokeWidth={2.5} />
          <span className="font-black text-slate-900 text-sm truncate">
            AI tutor
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 shrink-0"
        >
          <X size={15} strokeWidth={2.5} className="text-slate-500" />
        </button>
      </div>

      <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
        <MessageScroller className="flex-1 min-h-0">
          <MessageScrollerViewport>
            <MessageScrollerContent className="px-4 py-4">
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <Message align={message.role === "user" ? "end" : "start"}>
                    {message.role === "assistant" && (
                      <MessageAvatar className="size-8 bg-violet-100 text-violet-700">
                        <Bot size={16} strokeWidth={2.5} />
                      </MessageAvatar>
                    )}
                    <MessageContent>
                      <MessageHeader>
                        {message.role === "assistant" ? "Drnote AI" : "You"}
                      </MessageHeader>
                      <div
                        className="rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                        style={
                          message.role === "user"
                            ? {
                                background: "#58CC02",
                                color: "#fff",
                              }
                            : {
                                background: "#f1f5f9",
                                color: "#334155",
                                border: "1px solid #e2e8f0",
                              }
                        }
                      >
                        {message.content}
                      </div>
                      <MessageFooter>
                        {message.role === "assistant" ? "Saved for this question" : ""}
                      </MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="flex-shrink-0 border-t border-slate-200 p-3">
        <form
          className="flex gap-2 max-w-3xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this question..."
            className="rounded-2xl h-11"
          />
          <Button
            type="submit"
            size="icon-lg"
            className="rounded-2xl shrink-0"
            style={{ background: "#58CC02", color: "#fff" }}
            disabled={!draft.trim()}
          >
            <Send size={16} strokeWidth={2.5} />
          </Button>
        </form>
      </div>
    </div>
  );
}
