"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuizSetScreen } from "@/components/QuizSetScreen";
import { ReportSheet } from "@/components/ReportSheet";
import { SetSessionView } from "@/components/SetSessionView";
import { getSetById, toQuizSetScreenData } from "@/lib/mock-data";
import { examTabPath, type ContentTab } from "@/lib/routes";
import { resolveSessionTab } from "@/lib/set-content";

export function SetDetailClient({
  examId,
  tab,
  setId,
}: {
  examId: string;
  tab: ContentTab;
  setId: string;
}) {
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const set = getSetById(tab, setId)!;
  const contentTab = resolveSessionTab(tab, set);

  const goBack = () => router.push(examTabPath(examId, tab));

  // Notes, images, flashcards, library bookmarks — open content directly, no quiz hub
  if (contentTab !== "questions") {
    return (
      <SetSessionView
        set={set}
        tab={tab}
        quizParams={{ mode: "resume" }}
        onClose={goBack}
        onComplete={goBack}
      />
    );
  }

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
