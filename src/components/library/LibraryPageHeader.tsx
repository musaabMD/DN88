"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LibraryThumbHero } from "@/components/library/LibraryThumb";
import { LibraryBackLink } from "@/components/library/LibraryUi";

export function LibraryPageHeader({
  seed,
  title,
  meta,
  bookmark,
  breadcrumb,
}: {
  seed: string;
  title: string;
  meta?: string;
  bookmark?: ReactNode;
  breadcrumb?: { label: string; href: string };
}) {
  return (
    <header className="mb-8">
      <nav
        aria-label="Library breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-sm font-extrabold text-slate-500"
      >
        <LibraryBackLink />
        {breadcrumb ? (
          <>
            <span aria-hidden className="text-slate-300">
              /
            </span>
            <Link
              href={breadcrumb.href}
              className="transition-colors hover:text-slate-800"
            >
              {breadcrumb.label}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="group flex items-start gap-4">
        <LibraryThumbHero seed={seed} />
        <div className="min-w-0 flex-1 text-left">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {meta ? (
            <p className="mt-1.5 text-sm font-bold text-slate-400">{meta}</p>
          ) : null}
        </div>
        {bookmark}
      </div>
    </header>
  );
}
