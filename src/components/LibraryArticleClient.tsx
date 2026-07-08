"use client";

import { useRouter } from "next/navigation";
import { LibraryArticleView } from "@/components/content/LibraryArticleView";
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
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="mb-2 font-bold text-slate-800">Article not found</p>
          <button
            onClick={() => router.push(examTabPath(examId, "library"))}
            className="text-sm font-semibold text-indigo-600"
          >
            Back to library
          </button>
        </div>
      </div>
    );
  }

  return (
    <LibraryArticleView
      article={article}
      onClose={() => router.push(examTabPath(examId, "library"))}
      onBack={() => router.push(examTabPath(examId, "library"))}
    />
  );
}
