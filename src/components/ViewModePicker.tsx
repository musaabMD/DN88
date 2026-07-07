"use client";

import type { ViewMode } from "@/lib/types";

interface ViewModePickerProps {
  mode: ViewMode | null;
  onSelect: (mode: ViewMode) => void;
}

export default function ViewModePicker({ mode, onSelect }: ViewModePickerProps) {
  return (
    <div className="card-shadow rounded-3xl bg-card p-5">
      <p className="mb-4 text-center text-sm font-bold text-foreground">
        Show one per page or all?
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => onSelect("one")}
          className={`flex-1 rounded-2xl py-3.5 text-sm font-extrabold transition ${
            mode === "one"
              ? "bg-primary text-white"
              : "bg-primary-light text-primary"
          }`}
        >
          One per page
        </button>
        <button
          onClick={() => onSelect("all")}
          className={`flex-1 rounded-2xl py-3.5 text-sm font-extrabold transition ${
            mode === "all"
              ? "bg-primary text-white"
              : "bg-primary-light text-primary"
          }`}
        >
          Show all
        </button>
      </div>
    </div>
  );
}
