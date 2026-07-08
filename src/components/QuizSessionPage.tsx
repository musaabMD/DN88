"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { SetSessionView } from "@/components/SetSessionView";
import { getSetById } from "@/lib/mock-data";
import {
  parseQuizSearchParams,
  examTabPath,
  resultsPath,
  setPath,
  type ContentTab,
} from "@/lib/routes";

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
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-bold text-slate-800 mb-2">Set not found</p>
          <button
            onClick={() => router.push(examTabPath(examId, tab))}
            className="text-sm font-semibold text-indigo-600"
          >
            Back to sets
          </button>
        </div>
      </div>
    );
  }

  return (
    <SetSessionView
      set={set}
      tab={tab}
      quizParams={quizParams}
      onClose={() => router.push(setPath(examId, tab, setId))}
      onComplete={() => router.push(resultsPath(examId, tab, setId))}
    />
  );
}
