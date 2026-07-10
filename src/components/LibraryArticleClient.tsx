"use client";

import { useRouter } from "next/navigation";
import LibraryArticle from "@/components/content/LibraryArticle";
import { getLibraryArticleById } from "@/lib/mock-data";
import { getCreatedPageById } from "@/lib/pages/create-page-store";
import type { LibraryArticle as LibraryArticleType } from "@/lib/set-content";
import { LIBRARY_PATH } from "@/lib/routes";

function createdPageToArticle(page: {
  id: string;
  title: string;
  subject?: string;
}): LibraryArticleType {
  return {
    id: page.id,
    subject: page.subject ?? "User-created page",
    title: page.title,
    readMinutes: 3,
    updated: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    sections: [
      {
        id: "overview",
        heading: "Overview",
        body: `This page was created from a wiki link. You can edit it like any library article.`,
      },
    ],
    highYield: "Wiki links now resolve to this page by stable page id.",
  };
}

export function LibraryArticleClient({ articleId }: { articleId: string }) {
  const router = useRouter();
  const article = getLibraryArticleById(articleId);
  const created = !article ? getCreatedPageById(articleId) : undefined;
  const resolved = article ?? (created ? createdPageToArticle(created) : undefined);
  const backToLibrary = () => router.push(LIBRARY_PATH);

  if (!resolved) {
    return (
      <div className="simple-editor-page flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <p className="mb-2 font-semibold text-slate-800">Article not found</p>
          <p className="mb-4 text-sm text-slate-500">
            Click a red wiki link in any article to create this page.
          </p>
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

  return <LibraryArticle article={resolved} onBack={backToLibrary} />;
}
