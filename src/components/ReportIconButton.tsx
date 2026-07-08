"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { ReportSheet } from "@/components/ReportSheet";
import { CONTENT_REPORT_OPTIONS } from "@/lib/report-options";
import { cn } from "@/lib/utils";

export function ReportIconButton({
  className,
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report issue"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500",
          className
        )}
      >
        <Flag size={size} strokeWidth={2.5} />
      </button>
      <ReportSheet
        open={open}
        onClose={() => setOpen(false)}
        options={CONTENT_REPORT_OPTIONS}
      />
    </>
  );
}
