"use client";

import { useState } from "react";
import { Highlighter } from "lucide-react";
import { useTiptap, useTiptapState } from "@tiptap/react";

export const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bae6fd" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
] as const;

/** Color highlight popover — https://tiptap.dev/docs/ui-components/components/color-highlight-popover */
export function ColorHighlightPopover() {
  const { editor } = useTiptap();
  const [open, setOpen] = useState(false);

  const activeColor = useTiptapState(({ editor: ed }) => {
    const attrs = ed.getAttributes("highlight");
    return (attrs.color as string | undefined) ?? null;
  });

  if (!editor) return null;

  const apply = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
    setOpen(false);
  };

  const remove = () => {
    editor.chain().focus().unsetHighlight().run();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={`tiptap-toolbar-btn ${activeColor ? "is-active" : ""}`}
        title="Highlight color"
        aria-label="Highlight color"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Highlighter size={16} strokeWidth={2} />
      </button>
      {open ? (
        <div className="tiptap-highlight-popover">
          <p className="tiptap-popover-label">Highlight</p>
          <div className="tiptap-highlight-swatches">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={color.label}
                aria-label={color.label}
                className={activeColor === color.value ? "is-active" : undefined}
                style={{ backgroundColor: color.value }}
                onClick={() => apply(color.value)}
              />
            ))}
          </div>
          <button type="button" className="tiptap-highlight-remove" onClick={remove}>
            Remove highlight
          </button>
        </div>
      ) : null}
    </div>
  );
}
