"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  ChevronDown,
  Highlighter,
  Italic,
  Palette,
  Underline,
} from "lucide-react";
import { useCallback, useState } from "react";

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bae6fd" },
  { label: "Pink", value: "#fbcfe8" },
];

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Emerald", value: "#059669" },
  { label: "Rose", value: "#e11d48" },
];

const FONT_SIZES = ["14", "16", "18", "20", "24"] as const;

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 transition-colors ${
        active
          ? "bg-indigo-100 text-indigo-900"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

/** Compact styling toolbar for the single-page Agent editor. */
export function AgentEditorToolbar({ editor }: { editor: Editor }) {
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      editor.view.focus();
    },
    [editor]
  );

  return (
    <div className="library-agent-toolbar sticky top-0 z-20 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
      <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-indigo-700">
        Agent editor
      </span>
      <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />

      <select
        value={
          ((editor.getAttributes("textStyle").fontSize as string) ?? "16px").replace(
            "px",
            ""
          ) || "16"
        }
        onChange={(e) =>
          run(() => {
            const val = e.target.value;
            if (val)
              editor.chain().focus().setMark("textStyle", { fontSize: `${val}px` }).run();
            else editor.chain().focus().unsetMark("textStyle").run();
          })
        }
        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      >
        <Bold size={15} strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
      >
        <Italic size={15} strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
      >
        <Underline size={15} strokeWidth={2.5} />
      </ToolbarButton>

      <div className="relative">
        <ToolbarButton
          title="Highlight"
          active={editor.isActive("highlight")}
          onClick={() => setShowHighlightMenu((v) => !v)}
        >
          <Highlighter size={15} strokeWidth={2.5} />
          <ChevronDown size={12} className="ml-0.5 opacity-60" />
        </ToolbarButton>
        {showHighlightMenu ? (
          <div className="absolute left-0 top-full z-30 mt-1 flex gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={color.label}
                className="h-6 w-6 rounded-md ring-1 ring-slate-200"
                style={{ backgroundColor: color.value }}
                onClick={() => {
                  run(() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHighlight({ color: color.value })
                      .run()
                  );
                  setShowHighlightMenu(false);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <ToolbarButton
          title="Text color"
          onClick={() => setShowColorMenu((v) => !v)}
        >
          <Palette size={15} strokeWidth={2.5} />
          <ChevronDown size={12} className="ml-0.5 opacity-60" />
        </ToolbarButton>
        {showColorMenu ? (
          <div className="absolute left-0 top-full z-30 mt-1 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.label}
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  run(() => {
                    if (color.value)
                      editor.chain().focus().setColor(color.value).run();
                    else editor.chain().focus().unsetColor().run();
                  });
                  setShowColorMenu(false);
                }}
              >
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-slate-200"
                  style={{ backgroundColor: color.value || "#334155" }}
                />
                {color.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
