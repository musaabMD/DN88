"use client";

import { useState } from "react";
import { QuizSetScreen } from "@/components/QuizSetScreen";
import { ReportSheet } from "@/components/ReportSheet";
import { getSetById, toQuizSetScreenData } from "@/lib/mock-data";
import type { ContentTab } from "@/lib/routes";

export function SetDetailClient({
  examId,
  tab,
  setId,
}: {
  examId: string;
  tab: ContentTab;
  setId: string;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const set = getSetById(tab, setId)!;

  return (
    <>
      <QuizSetScreen
        examId={examId}
        tab={tab}
        setId={setId}
        data={toQuizSetScreenData(set, tab)}
        onReport={() => setReportOpen(true)}
      />
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}
