import { notFound } from "next/navigation";
import { QbankAccessGate } from "@/components/QbankAccessGate";
import { SetResultsPage } from "@/components/SetResultsPage";
import { getAllSetStaticParams, getSetById } from "@/lib/mock-data";
import { isValidExamId } from "@/lib/exams";
import { isValidTab } from "@/lib/routes";

export function generateStaticParams() {
  return getAllSetStaticParams();
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ examId: string; tab: string; setId: string }>;
}) {
  const { examId, tab, setId } = await params;
  if (
    !isValidExamId(examId) ||
    !isValidTab(tab) ||
    !getSetById(tab, setId)
  ) {
    notFound();
  }
  return (
    <QbankAccessGate>
      <SetResultsPage examId={examId} tab={tab} setId={setId} />
    </QbankAccessGate>
  );
}
