"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

export function LibraryBrowseShell({
  children,
  headerEnd,
  footer,
}: {
  children: ReactNode;
  /** e.g. ProductSiteNav on the library home page */
  headerEnd?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <AppHeader
        minimal
        showLibrary
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
