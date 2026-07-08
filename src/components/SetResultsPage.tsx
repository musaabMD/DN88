"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SessionReportView } from "@/components/SessionReportView";
import { getSessionReportData, getSetById } from "@/lib/mock-data";
import { quizPath, setPath, tabPath, type ContentTab } from "@/lib/routes";

export function SetResultsPage({
  tab,
  setId,
}: {
  tab: ContentTab;
  setId: string;
}) {
  const router = useRouter();
  const set = getSetById(tab, setId);

  if (!set) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-bold text-slate-800 mb-2">Set not found</p>
          <button
            onClick={() => router.push(tabPath(tab))}
            className="text-sm font-semibold text-indigo-600"
          >
            Back to sets
          </button>
        </div>
      </div>
    );
  }

  const report = getSessionReportData(set, tab);
  const missedCount = report.subjects.reduce(
    (sum, s) => sum + (s.total - s.correct),
    0
  );

  const backToSet = () => router.push(setPath(tab, setId));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader showBack onBack={backToSet} title={set.title} />
      <SessionReportView
        title={set.title}
        durationSec={report.durationSec}
        subjects={report.subjects}
        missedCards={report.missedCards}
        streakBest={report.streakBest}
        onClose={backToSet}
        onBackToSets={backToSet}
        onRetryMissed={
          missedCount > 0
            ? () =>
                router.push(
                  quizPath(tab, setId, {
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
