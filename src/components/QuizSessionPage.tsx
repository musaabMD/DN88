"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ContentShell } from "@/components/ContentShell";
import { SetSessionView } from "@/components/SetSessionView";
import { useLiveSet } from "@/hooks/useLiveSet";
import {
  parseQuizSearchParams,
  examTabPath,
  resultsPath,
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
  const { set, loading } = useLiveSet(examId, tab, setId);
  const quizParams = useMemo(
    () => parseQuizSearchParams(searchParams),
    [searchParams]
  );

  if (loading) {
    return (
      <ContentShell examId={examId} title="Loading…" onBack={() => router.push(examTabPath(examId, tab))}>
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading session…</div>
      </ContentShell>
    );
  }

  if (!set) {
    return (
      <ContentShell
        examId={examId}
        title="Set not found"
        onBack={() => router.push(examTabPath(examId, tab))}
      >
        <div className="py-16 text-center">
          <p className="mb-2 font-bold text-slate-800">Set not found</p>
          <button
            onClick={() => router.push(examTabPath(examId, tab))}
            className="text-sm font-semibold text-indigo-600"
          >
            Back to sets
          </button>
        </div>
      </ContentShell>
    );
  }

  const contentTab = resolveSessionTab(tab, set);
  const immersiveTab =
    contentTab === "summary" ||
    contentTab === "images" ||
    contentTab === "flashcards";

  return (
    <ContentShell
      examId={examId}
      title={set.title}
      headerHidden={!immersiveTab}
      onBack={() =>
        router.push(
          immersiveTab ? examTabPath(examId, tab) : setPath(examId, tab, setId)
        )
      }
    >
      <SetSessionView
        set={set}
        tab={tab}
        quizParams={quizParams}
        onClose={() =>
          router.push(
            immersiveTab ? examTabPath(examId, tab) : setPath(examId, tab, setId)
          )
        }
        onComplete={() => router.push(resultsPath(examId, tab, setId))}
        examId={examId}
      />
    </ContentShell>
  );
}
