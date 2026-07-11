"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { LibraryThumb } from "@/components/library/LibraryThumb";

/** Shared list row used across library home and specialty pages. */
export function LibraryListCard({
  href,
  seed,
  title,
  meta,
  trailing,
}: {
  href: string;
  seed: string;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <LibraryThumb seed={seed} />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-base font-extrabold leading-snug tracking-tight text-slate-700">
            {title}
          </h3>
          {meta ? (
            <p className="mt-0.5 text-sm font-bold text-slate-400">{meta}</p>
          ) : null}
        </div>
        <ChevronRight
          size={20}
          strokeWidth={3}
          className="shrink-0 text-slate-300 opacity-0 transition-all duration-150 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-[#334155]"
        />
      </Link>
      {trailing}
    </div>
  );
}

export function LibraryGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  );
}
