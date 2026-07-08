import { notFound } from "next/navigation";
import { ExamFiltersClient } from "@/components/ExamFiltersClient";
import { getAllExamStaticParams, isValidExamId } from "@/lib/exams";

export function generateStaticParams() {
  return getAllExamStaticParams();
}

export default async function ExamFiltersPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  if (!isValidExamId(examId)) notFound();
  return <ExamFiltersClient examId={examId} />;
}
