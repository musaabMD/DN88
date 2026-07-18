"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SessionReportView } from "@/components/SessionReportView";
import { useLiveSet } from "@/hooks/useLiveSet";
import { useLiveSetStats } from "@/hooks/useLiveSetStats";
import { useStudyStreak } from "@/hooks/useStudyStreak";
import { getSetById, getSessionReportData } from "@/lib/mock-data";
import { fetchAnalytics } from "@/lib/medgenius/api";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import { isLiveSetId } from "@/lib/qbank/live-data";
import {
  loadSessionReport,
  storedReportToSessionReportData,
} from "@/lib/qbank/session-report";
import { examTabPath, quizPath, setPath, type ContentTab } from "@/lib/routes";

export function SetResultsPage({
  examId,
  tab,
  setId,
}: {
  examId: string;
  tab: ContentTab;
  setId: string;
}) {
  const router = useRouter();
  const clerkEnabled = useClerkEnabled();
  const { set: liveSet } = useLiveSet(examId, tab, setId);
  const { stats } = useLiveSetStats(setId);
  const streak = useStudyStreak();
  const mockSet = getSetById(tab, setId);
  const set = liveSet ?? mockSet;

  const stored = useMemo(() => loadSessionReport(setId), [setId]);
  const [analyticsReport, setAnalyticsReport] = useState<ReturnType<
    typeof storedReportToSessionReportData
  > | null>(null);

  useEffect(() => {
    if (!clerkEnabled || !isClerkSignedIn() || !isLiveSetId(setId)) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        if (!token) return;
        const stats = await fetchAnalytics(token);
        if (cancelled) return;
        setAnalyticsReport({
          durationSec: stats.totalStudySec,
          subjects: stats.weakTopics.map((t) => ({
            subject: t.topic,
            correct: t.correct,
            total: t.correct + t.incorrect,
          })),
          missedCards: [],
          streakBest: streak.streakDays,
          readinessPct: stats.accuracy,
          correctCount: stats.totalCorrect,
          answeredCount: stats.totalAnswered,
          totalCount: stats.totalAnswered,
        });
      } catch {
        /* fallback below */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clerkEnabled, setId, streak.streakDays]);

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

  const mockReport = getSessionReportData(set, tab);
  const liveReport = stored
    ? storedReportToSessionReportData(stored)
    : analyticsReport;

  const report = liveReport ?? mockReport;
  const readinessPct =
    stored?.readinessPct ?? stats?.readinessPct ?? liveReport?.readinessPct ?? mockReport.subjects.length > 0
      ? Math.round(
          (mockReport.subjects.reduce((s, x) => s + x.correct, 0) /
            Math.max(
              mockReport.subjects.reduce((s, x) => s + x.total, 0),
              1
            )) *
            100
        )
      : 0;

  const missedCount = report.subjects.reduce(
    (sum, s) => sum + (s.total - s.correct),
    0
  );

  const backToSet = () => router.push(setPath(examId, tab, setId));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader showBack onBack={backToSet} title={set.title} />
      {readinessPct > 0 && (
        <div className="mx-auto w-full max-w-lg px-4 pt-4">
          <div className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
              Exam readiness
            </p>
            <p className="text-3xl font-black text-slate-800">{readinessPct}%</p>
          </div>
        </div>
      )}
      <SessionReportView
        title={set.title}
        durationSec={report.durationSec}
        subjects={report.subjects}
        missedCards={report.missedCards}
        streakBest={report.streakBest ?? streak.streakDays}
        onClose={backToSet}
        onBackToSets={backToSet}
        onRetryMissed={
          missedCount > 0
            ? () =>
                router.push(
                  quizPath(examId, tab, setId, {
                    mode: "incorrect",
                    count: missedCount,
                  })
                )
            : undefined
        }
      />
    </div>
  );
}
