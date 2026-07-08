"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DrNoteShell } from "@/components/DrNoteShell";
import { SetSessionView } from "@/components/SetSessionView";
import { getSetById } from "@/lib/mock-data";
import {
  parseQuizSearchParams,
  examTabPath,
  setPath,
  type ContentTab,
} from "@/lib/routes";
import { resolveSessionTab } from "@/lib/set-content";

export function QuizSessionPage({
  examId,
  tab,
  setId,
  searchParams,
}: {
  examId: string;
  tab: ContentTab;
  setId: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const set = getSetById(tab, setId);
  const quizParams = useMemo(
    () => parseQuizSearchParams(searchParams),
    [searchParams]
  );

  if (!set) {
    return (
      <DrNoteShell examId={examId} activeTab={tab}>
        <div className="py-16 text-center">
          <p className="mb-2 font-bold text-slate-800">Set not found</p>
          <button
            onClick={() => router.push(examTabPath(examId, tab))}
            className="text-sm font-semibold text-indigo-600"
          >
            Back to sets
          </button>
        </div>
      </DrNoteShell>
    );
  }

  const contentTab = resolveSessionTab(tab, set);
  const immersiveTab =
    contentTab === "summary" ||
    contentTab === "images" ||
    contentTab === "flashcards";

  return (
    <DrNoteShell examId={examId} activeTab={tab}>
      <SetSessionView
        set={set}
        tab={tab}
        quizParams={quizParams}
        onClose={() =>
          router.push(
            immersiveTab ? examTabPath(examId, tab) : setPath(examId, tab, setId)
          )
        }
        onComplete={() => router.push(examTabPath(examId, tab))}
      />
    </DrNoteShell>
  );
}
