"use client";

import { SlidersHorizontal } from "lucide-react";

export function FilterFab({
  onClick,
  hidden,
}: {
  onClick: () => void;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Filters"
      className="fixed bottom-24 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full border-2 border-b-4 border-[#1e293b] bg-[#334155] text-white shadow-lg transition-transform hover:scale-105 active:translate-y-0.5 active:border-b-2 md:bottom-6 md:flex"
    >
      <SlidersHorizontal size={22} strokeWidth={2.5} />
    </button>
  );
}
