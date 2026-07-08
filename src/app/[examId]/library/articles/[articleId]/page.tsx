import { notFound } from "next/navigation";
import { LibraryArticleClient } from "@/components/LibraryArticleClient";
import { getAllArticleStaticParams, getLibraryArticleById } from "@/lib/mock-data";
import { isValidExamId } from "@/lib/exams";

export function generateStaticParams() {
  return getAllArticleStaticParams();
}

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ examId: string; articleId: string }>;
}) {
  const { examId, articleId } = await params;
  if (!isValidExamId(examId) || !getLibraryArticleById(articleId)) {
    notFound();
  }
  return <LibraryArticleClient examId={examId} articleId={articleId} />;
}
