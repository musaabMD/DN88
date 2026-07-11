"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { FEATURES_PATH, HOME_PATH, LIBRARY_PATH } from "@/lib/routes";

type AppHeaderProps = {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  showLibrary?: boolean;
  /** Logo, back, and auth only — no nav links or centered title. */
  minimal?: boolean;
  onSearchClick?: () => void;
  hidden?: boolean;
  /** Match library browse content width. */
  contentMaxWidth?: "4xl" | "6xl";
  /** Replaces default auth controls (e.g. ProductSiteNav on library home). */
  headerEnd?: ReactNode;
};

export function AppHeader({
  showBack,
  onBack,
  title,
  showLibrary,
  minimal,
  onSearchClick,
  hidden,
  contentMaxWidth = "6xl",
  headerEnd,
}: AppHeaderProps) {
  const router = useRouter();
  const maxWidthClass =
    contentMaxWidth === "4xl" ? "max-w-4xl" : "max-w-6xl";

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  if (hidden) return null;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className={`mx-auto grid h-14 ${maxWidthClass} grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:gap-3 sm:px-6`}>
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            ) : null}
            <Link href={HOME_PATH} className="shrink-0">
              <DrNoteLogo size="sm" showWordmark forceWordmark />
            </Link>
            {showLibrary && !minimal ? (
              <Link
                href={LIBRARY_PATH}
                className="hidden rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 sm:inline"
              >
                Library
              </Link>
            ) : null}
            {!minimal ? (
              <Link
                href={FEATURES_PATH}
                className="hidden rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 sm:inline"
              >
                Features
              </Link>
            ) : null}
          </div>

          {title && !minimal ? (
            <p
              className="min-w-0 truncate text-center text-sm font-extrabold tracking-tight text-slate-900 sm:text-base"
              style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
            >
              {title}
            </p>
          ) : (
            <span />
          )}

          <div className="flex shrink-0 items-center justify-end gap-1">
            {onSearchClick ? (
              <button
                type="button"
                onClick={onSearchClick}
                aria-label="Search article"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <Search className="h-5 w-5" strokeWidth={2.5} />
              </button>
            ) : null}
            {headerEnd ?? <UserAuthControls compact />}
          </div>
        </div>
      </header>
      <div className="h-14 shrink-0" aria-hidden />
    </>
  );
}
