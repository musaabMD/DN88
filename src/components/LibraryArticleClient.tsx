"use client";

import { useRouter } from "next/navigation";
import { DrNoteShell } from "@/components/DrNoteShell";
import LibraryArticle from "@/components/content/LibraryArticle";
import { getLibraryArticleById } from "@/lib/mock-data";
import { examTabPath } from "@/lib/routes";

export function LibraryArticleClient({
  examId,
  articleId,
}: {
  examId: string;
  articleId: string;
}) {
  const router = useRouter();
  const article = getLibraryArticleById(articleId);

  if (!article) {
    return (
      <DrNoteShell examId={examId} activeTab="library">
        <div className="py-16 text-center">
          <p className="mb-2 font-bold text-slate-800">Article not found</p>
          <button
            onClick={() => router.push(examTabPath(examId, "library"))}
            className="text-sm font-semibold text-indigo-600"
          >
            Back to library
          </button>
        </div>
      </DrNoteShell>
    );
  }

  return (
    <DrNoteShell examId={examId} activeTab="library">
      <LibraryArticle article={article} />
    </DrNoteShell>
  );
}
