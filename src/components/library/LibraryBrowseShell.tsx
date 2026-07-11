"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

export function LibraryBrowseShell({
  children,
  showBack = false,
  onBack,
  headerEnd,
  footer,
}: {
  children: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  /** e.g. ProductSiteNav on the library home page */
  headerEnd?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <AppHeader
        showBack={showBack}
        onBack={onBack ?? (() => undefined)}
        minimal
        showLibrary={!showBack}
        contentMaxWidth="4xl"
        headerEnd={headerEnd}
      />
      <main
        className={`mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6 ${
          footer ? "pb-28" : "pb-14"
        }`}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
