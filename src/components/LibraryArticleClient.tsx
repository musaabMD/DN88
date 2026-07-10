"use client";

import { useRouter } from "next/navigation";
import LibraryArticle from "@/components/content/LibraryArticle";
import { getLibraryArticleById } from "@/lib/mock-data";
import { LIBRARY_PATH } from "@/lib/routes";

export function LibraryArticleClient({ articleId }: { articleId: string }) {
  const router = useRouter();
  const article = getLibraryArticleById(articleId);
  const backToLibrary = () => router.push(LIBRARY_PATH);

  if (!article) {
    return (
      <div className="simple-editor-page flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <p className="mb-2 font-semibold text-slate-800">Article not found</p>
          <button
            type="button"
            onClick={backToLibrary}
            className="text-sm font-medium text-slate-600 underline"
          >
            Back to library
          </button>
        </div>
      </div>
    );
  }

  return <LibraryArticle article={article} onBack={backToLibrary} />;
}
