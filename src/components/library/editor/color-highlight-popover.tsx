"use client";

import { useEffect, useState } from "react";
import { Highlighter } from "lucide-react";
import { useTiptap, useTiptapState } from "@tiptap/react";
import {
  getHighlightColors,
  HIGHLIGHT_COLORS,
} from "@/components/library/editor/highlight-colors";
import { readThemeFromDom } from "@/lib/theme";

export { HIGHLIGHT_COLORS };

/** Color highlight popover — https://tiptap.dev/docs/ui-components/components/color-highlight-popover */
export function ColorHighlightPopover() {
  const { editor } = useTiptap();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(readThemeFromDom);

  useEffect(() => {
    setTheme(readThemeFromDom());
    const observer = new MutationObserver(() => setTheme(readThemeFromDom()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const swatches = getHighlightColors(theme);

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
            {swatches.map((color) => (
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
