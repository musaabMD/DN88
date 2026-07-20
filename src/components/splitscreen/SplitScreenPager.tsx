"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SS } from "@/components/splitscreen/splitscreen-theme";

export function SplitScreenPager({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div
      className="relative z-10 flex shrink-0 items-center justify-center gap-3 border-t bg-white px-3 py-2 text-sm font-bold shadow-[0_-4px_12px_rgba(15,23,42,0.04)]"
      style={{ borderColor: SS.panelBorder, color: SS.sub }}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40"
        style={{ borderColor: SS.panelBorder }}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40"
        style={{ borderColor: SS.panelBorder }}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
