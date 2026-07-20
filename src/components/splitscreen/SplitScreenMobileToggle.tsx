"use client";

import { BookOpen, Brain } from "lucide-react";
import { SS } from "@/components/splitscreen/splitscreen-theme";

export type SplitScreenMobilePane = "pdf" | "study";

export function SplitScreenMobileToggle({
  pane,
  onPaneChange,
}: {
  pane: SplitScreenMobilePane;
  onPaneChange: (pane: SplitScreenMobilePane) => void;
}) {
  const items: { id: SplitScreenMobilePane; label: string; icon: typeof BookOpen }[] = [
    { id: "pdf", label: "PDF", icon: BookOpen },
    { id: "study", label: "Study", icon: Brain },
  ];

  return (
    <div
      className="flex shrink-0 gap-1 rounded-xl border bg-white p-1 shadow-sm"
      style={{ borderColor: SS.panelBorder }}
      role="tablist"
      aria-label="Choose panel"
    >
      {items.map(({ id, label, icon: Icon }) => {
        const active = pane === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onPaneChange(id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-extrabold transition"
            style={{
              color: active ? SS.ink : SS.sub,
              background: active ? SS.pageBg : "transparent",
              boxShadow: active ? "inset 0 -2px 0 " + SS.blue : "none",
            }}
          >
            <Icon size={16} strokeWidth={2.4} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
