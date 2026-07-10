"use client";

import type { LibraryEditorMode } from "@/components/library/editor/types";
import { LIBRARY_EDITOR_MODES } from "@/components/library/editor/types";

export function LibraryEditorModeSwitcher({
  mode,
  onChange,
}: {
  mode: LibraryEditorMode;
  onChange: (mode: LibraryEditorMode) => void;
}) {
  return (
    <div
      className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1"
      role="tablist"
      aria-label="Editor mode"
    >
      {LIBRARY_EDITOR_MODES.map((item) => {
        const active = item.id === mode;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={item.description}
            onClick={() => onChange(item.id)}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition-colors sm:px-4 sm:text-sm ${
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
