"use client";

import { useRouter } from "next/navigation";
import { SessionReportView } from "@/components/SessionReportView";
import { getSetById } from "@/lib/mock-data";
import { setPath, tabPath, type ContentTab } from "@/lib/routes";

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

  const overallScore = set.score ?? 0;
  const correct = Math.round((overallScore / 100) * set.total);

  return (
    <div className="min-h-screen bg-white">
      <SessionReportView
        setTitle={set.title}
        elapsedSeconds={720}
        overallScore={overallScore}
        subjectScores={{
          [set.subject]: { correct, total: set.total },
        }}
        onClose={() => router.push(setPath(tab, setId))}
      />
    </div>
  );
}
