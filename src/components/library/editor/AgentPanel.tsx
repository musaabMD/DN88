"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const AGENT_SUGGESTIONS = [
  "Highlight key terms in yellow",
  "Make headings larger and indigo",
  "Emphasize definitions with bold + green highlight",
];

function buildAgentReply(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("yellow") || lower.includes("highlight")) {
    return "Select the text you want to emphasize, then use the Highlight menu in the toolbar and pick yellow. Article text stays intact — only the appearance changes.";
  }
  if (lower.includes("heading") || lower.includes("indigo")) {
    return "Click into a heading, open the style dropdown, choose Heading 2, then set Text color to Indigo from the palette button.";
  }
  if (lower.includes("bold") || lower.includes("definition")) {
    return "Select the definition phrase, press Bold, then add a green highlight from the toolbar. You can also bump font size to 18px for extra emphasis.";
  }
  return "Select the passage you want to change, then use the toolbar — bold, colors, highlights, and font size all work without editing the underlying article text.";
}

export function AgentPanel({ articleTitle }: { articleTitle: string }) {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `I'm here to help you style "${articleTitle}". Select text and ask me how to format it — I can't change or remove article content, only appearance.`,
    },
  ]);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: AgentMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    const reply: AgentMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: buildAgentReply(trimmed),
    };

    setMessages((prev) => [...prev, userMsg, reply]);
    setInput("");
  }, []);

  return (
    <aside className="sticky top-24 flex max-h-[calc(100vh-8rem)] flex-col rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white">
      <div className="flex items-center gap-2 border-b border-indigo-100 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Bot size={16} />
        </span>
        <div>
          <p className="text-sm font-extrabold text-slate-800">Agent editor</p>
          <p className="text-xs font-medium text-slate-500">
            Style suggestions only
          </p>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-white text-slate-700 ring-1 ring-slate-100"
                : "ml-6 bg-indigo-600 font-medium text-white"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-indigo-100 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {AGENT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-50"
            >
              <Sparkles size={10} className="mr-1 inline" />
              {suggestion}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask how to style selected text…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none ring-indigo-200 focus:ring-2"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
}
