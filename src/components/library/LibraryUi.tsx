"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";

export function BookmarkButton({
  bookmarked,
  onToggle,
  label,
  size = "md",
  showOnHover = false,
}: {
  bookmarked: boolean;
  onToggle: () => void;
  label: string;
  size?: "sm" | "md";
  /** Hide until card hover unless already bookmarked. */
  showOnHover?: boolean;
}) {
  const box = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const icon = size === "sm" ? 16 : 18;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={label}
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
        bookmarked
          ? "border-slate-700 bg-slate-700 text-white"
          : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700"
      } ${
        showOnHover && !bookmarked
          ? "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
          : ""
      }`}
    >
      <Bookmark
        size={icon}
        strokeWidth={2.5}
        fill={bookmarked ? "currentColor" : "none"}
      />
    </button>
  );
}

export function useBookmark(
  isBookmarked: () => boolean,
  toggle: () => boolean,
  deps: unknown[]
) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    bookmarked,
    toggleBookmark: () => setBookmarked(toggle()),
  };
}

export function ComingSoonPanel({
  title,
  description,
  children,
  className = "mt-8",
}: {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center ${className}`}
    >
      <p className="text-lg font-extrabold text-slate-700">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-relaxed text-slate-400">
        {description}
      </p>
      {children}
    </div>
  );
}

export function LibraryCtaButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-5 inline-flex rounded-xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

export function LibraryEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <ComingSoonPanel title={title} description={description} className="mt-2" />
  );
}

export function LibraryBackLink({ href = "/library/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
    >
      Library
    </Link>
  );
}
