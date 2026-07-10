"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import type { Editor } from "@tiptap/react";

type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const AGENT_SUGGESTIONS = [
  "Highlight key terms in yellow",
  "Make section headings indigo",
  "Bold the first sentence of each paragraph",
];

const HIGHLIGHT_BY_PROMPT: Array<{ match: RegExp; color: string }> = [
  { match: /yellow|highlight/i, color: "#fef08a" },
  { match: /green/i, color: "#bbf7d0" },
  { match: /blue/i, color: "#bae6fd" },
  { match: /pink/i, color: "#fbcfe8" },
];

function buildAgentReply(prompt: string, hasSelection: boolean): string {
  if (!hasSelection) {
    return "Select text in the document first, then ask me how to style it. I can apply highlights, colors, bold, and font size without changing the article content.";
  }
  const lower = prompt.toLowerCase();
  if (lower.includes("yellow") || lower.includes("highlight")) {
    return "Applied yellow highlight to your selection. Pick another color from the toolbar anytime.";
  }
  if (lower.includes("heading") || lower.includes("indigo")) {
    return "For headings, click into the heading text and use Text color → Indigo in the toolbar.";
  }
  if (lower.includes("bold")) {
    return "Applied bold to your selection.";
  }
  return "Updated styling on your selection. Use the toolbar for fine-tuning.";
}

function applyPromptToSelection(editor: Editor, prompt: string): boolean {
  const { from, to, empty } = editor.state.selection;
  if (empty) return false;

  const lower = prompt.toLowerCase();

  if (lower.includes("bold")) {
    editor.chain().focus().setTextSelection({ from, to }).toggleBold().run();
    return true;
  }

  if (lower.includes("indigo") || lower.includes("color")) {
    editor.chain().focus().setTextSelection({ from, to }).setColor("#4f46e5").run();
    return true;
  }

  for (const rule of HIGHLIGHT_BY_PROMPT) {
    if (rule.match.test(prompt)) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .toggleHighlight({ color: rule.color })
        .run();
      return true;
    }
  }

  if (lower.includes("highlight")) {
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .toggleHighlight({ color: "#fef08a" })
      .run();
    return true;
  }

  return false;
}

/** Agent sidebar — Tiptap AI agent chatbot layout (open-source styling assistant). */
export function TiptapAgentSidebar({
  editor,
  articleTitle,
}: {
  editor: Editor;
  articleTitle: string;
}) {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Agent editor for "${articleTitle}". Select text, then ask me to highlight, color, or emphasize it — content stays intact.`,
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

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const hasSelection = !editor.state.selection.empty;
      applyPromptToSelection(editor, trimmed);

      const userMsg: AgentMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      const reply: AgentMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: buildAgentReply(trimmed, hasSelection),
      };

      setMessages((prev) => [...prev, userMsg, reply]);
      setInput("");
    },
    [editor]
  );

  return (
    <aside className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-indigo-50 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Bot size={16} />
        </span>
        <div>
          <p className="text-sm font-extrabold text-slate-800">Agent</p>
          <p className="text-[11px] font-medium text-slate-500">
            Tiptap-style assistant
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
                ? "bg-slate-50 text-slate-700 ring-1 ring-slate-100"
                : "ml-4 bg-indigo-600 font-medium text-white"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-indigo-50 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {AGENT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
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
            placeholder="Select text, then ask to style it…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200"
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
