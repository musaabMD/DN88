"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentShell } from "@/components/ContentShell";
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
  const [fullPage, setFullPage] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const backToLibrary = () => router.push(examTabPath(examId, "library"));

  if (!article) {
    return (
      <ContentShell
        examId={examId}
        title="Article not found"
        onBack={backToLibrary}
        showLibrary
      >
        <div className="py-16 text-center">
          <p className="mb-2 font-bold text-slate-800">Article not found</p>
          <button
            onClick={backToLibrary}
            className="text-sm font-semibold text-indigo-600"
          >
            Back to library
          </button>
        </div>
      </ContentShell>
    );
  }

  return (
    <ContentShell
      examId={examId}
      title={article.title}
      onBack={backToLibrary}
      showLibrary
      onSearchClick={() => setShowSearch(true)}
      headerHidden={fullPage}
    >
      <LibraryArticle
        article={article}
        examId={examId}
        fullPage={fullPage}
        onToggleFullPage={() => setFullPage((v) => !v)}
        showSearch={showSearch}
        onCloseSearch={() => setShowSearch(false)}
      />
    </ContentShell>
  );
}
