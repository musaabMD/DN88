"use client";

import Link from "next/link";
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
    <div className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <LibraryThumb seed={seed} />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-sm font-bold leading-snug tracking-tight text-slate-700 sm:text-base">
            {title}
          </h3>
          {meta ? (
            <p className="mt-0.5 text-xs font-semibold text-slate-400 sm:text-sm">
              {meta}
            </p>
          ) : null}
        </div>
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
