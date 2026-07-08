"use client";

import { useEffect, type ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { saveCurrentExamId } from "@/lib/current-exam";

export const CONTENT_SHELL_MAIN =
  "w-full px-4 py-4 md:px-8 lg:px-12 xl:px-16";

export function ContentShell({
  examId,
  title,
  onBack,
  children,
}: {
  examId: string;
  title: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    saveCurrentExamId(examId);
  }, [examId]);

  return (
    <div className="min-h-screen bg-white font-sans">
      <AppHeader showBack onBack={onBack} title={title} />
      <main className={CONTENT_SHELL_MAIN}>{children}</main>
    </div>
  );
}
