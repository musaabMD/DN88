import { notFound } from "next/navigation";
import DrNoteApp from "@/components/DrNoteApp";
import { getAllExamStaticParams, isValidExamId } from "@/lib/exams";
import { DEFAULT_TAB } from "@/lib/routes";

export function generateStaticParams() {
  return getAllExamStaticParams();
}

export default async function ExamBrowsePage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  if (!isValidExamId(examId)) notFound();
  return <DrNoteApp examId={examId} tab={DEFAULT_TAB} />;
}
