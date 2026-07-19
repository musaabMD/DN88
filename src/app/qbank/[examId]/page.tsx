import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DrNoteHome } from "@/components/home/DrNoteHome";
import { getAllExamStaticParams, getExamById, isValidExamId } from "@/lib/exams";
import { examPath } from "@/lib/routes";

export function generateStaticParams() {
  return getAllExamStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string }>;
}): Promise<Metadata> {
  const { examId } = await params;
  const exam = getExamById(examId);
  if (!exam) return {};

  const title = `${exam.code} Qbank — DrNote`;
  const description = exam.description;

  return {
    title,
    description,
    alternates: {
      canonical: examPath(exam.id),
    },
    openGraph: {
      title,
      description,
      url: examPath(exam.id),
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function ExamBrowsePage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  if (!isValidExamId(examId)) notFound();
  return <DrNoteHome initialExamId={examId} />;
}
