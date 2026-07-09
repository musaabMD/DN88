import { notFound } from "next/navigation";
import DrNoteApp from "@/components/DrNoteApp";
import { getAllExamStaticParams, isValidExamId } from "@/lib/exams";
import { DEFAULT_TAB, isValidTab, VALID_TABS } from "@/lib/routes";

export function generateStaticParams() {
  return getAllExamStaticParams().flatMap(({ examId }) =>
    VALID_TABS.filter((tab) => tab !== DEFAULT_TAB && tab !== "library").map(
      (tab) => ({
        examId,
        tab,
      })
    )
  );
}

export default async function ExamTabBrowsePage({
  params,
}: {
  params: Promise<{ examId: string; tab: string }>;
}) {
  const { examId, tab } = await params;
  if (!isValidExamId(examId) || !isValidTab(tab)) notFound();
  return <DrNoteApp examId={examId} tab={tab} />;
}
