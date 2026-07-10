"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import {
  EDITOR_BG_THEMES,
  type EditorBgTheme,
} from "@/lib/editor-bg-colors";

export function EditorBgColorPicker({
  theme,
  onChange,
}: {
  theme: EditorBgTheme;
  onChange: (theme: EditorBgTheme) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="simple-editor-action-btn"
        aria-expanded={open}
        aria-label="Background color"
        title="Background"
        onClick={() => setOpen((v) => !v)}
      >
        <Palette size={16} strokeWidth={2} />
      </button>
      {open ? (
        <div className="simple-editor-bg-menu">
          <p className="tiptap-popover-label">Background</p>
          <div className="simple-editor-bg-swatches">
            {EDITOR_BG_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.label}
                aria-label={t.label}
                className={`simple-editor-bg-swatch ${theme === t.id ? "is-active" : ""}`}
                style={{ background: t.page }}
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
              >
                <span style={{ color: t.prose }}>{t.label[0]}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
