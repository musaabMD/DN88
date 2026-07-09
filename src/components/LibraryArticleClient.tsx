"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentShell } from "@/components/ContentShell";
import LibraryArticle from "@/components/content/LibraryArticle";
import { getLibraryArticleById } from "@/lib/mock-data";
import { LIBRARY_PATH } from "@/lib/routes";

export function LibraryArticleClient({ articleId }: { articleId: string }) {
  const router = useRouter();
  const article = getLibraryArticleById(articleId);
  const [showSearch, setShowSearch] = useState(false);
  const backToLibrary = () => router.push(LIBRARY_PATH);

  if (!article) {
    return (
      <ContentShell title="Article not found" onBack={backToLibrary} showLibrary>
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
      title={article.title}
      onBack={backToLibrary}
      showLibrary
      onSearchClick={() => setShowSearch(true)}
    >
      <LibraryArticle
        article={article}
        showSearch={showSearch}
        onCloseSearch={() => setShowSearch(false)}
      />
    </ContentShell>
  );
}
