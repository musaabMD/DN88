import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DrNoteApp from "@/components/DrNoteApp";
import { getAllExamStaticParams, getExamById, isValidExamId } from "@/lib/exams";
import { DEFAULT_TAB, examTabPath, isValidTab, VALID_TABS, type ContentTab } from "@/lib/routes";

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

const TAB_LABELS: Record<ContentTab, string> = {
  questions: "Questions",
  summary: "Summaries",
  images: "Images",
  flashcards: "Flashcards",
  library: "Library",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string; tab: string }>;
}): Promise<Metadata> {
  const { examId, tab } = await params;
  const exam = getExamById(examId);
  if (!exam || !isValidTab(tab)) return {};

  const typedTab = tab as ContentTab;
  const label = TAB_LABELS[typedTab];
  const title = `${exam.code} ${label} — DrNote`;
  const description = `${label} for ${exam.name}. ${exam.description}`;
  const canonical = examTabPath(exam.id, typedTab);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
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
