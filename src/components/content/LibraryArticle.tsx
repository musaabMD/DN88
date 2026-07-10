"use client";

import { useEffect, useState } from "react";
import { Bookmark, Pencil } from "lucide-react";
import { SuggestEditModal } from "@/components/SuggestEditModal";
import {
  ArticleTableOfContents,
  sectionSlug,
} from "@/components/content/ArticleTableOfContents";
import {
  isArticleBookmarked,
  toggleArticleBookmark,
} from "@/lib/article-bookmarks";
import type { LibraryArticle } from "@/lib/set-content";
import { LibraryTiptapEditor } from "@/components/library/editor/LibraryTiptapEditor";

export default function LibraryArticle({ article }: { article: LibraryArticle }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    setBookmarked(isArticleBookmarked(article.id));
  }, [article.id]);

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl gap-10 pb-16">
        <aside className="hidden w-44 shrink-0 lg:block xl:w-52">
          <ArticleTableOfContents
            headings={article.sections.map((s) => s.heading)}
            activeId={
              article.sections[0]
                ? sectionSlug(article.sections[0].heading)
                : null
            }
          />
        </aside>

        <article className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              aria-label="Suggest edit"
              title="Suggest edit"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            >
              <Pencil size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => setBookmarked(toggleArticleBookmark(article.id))}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                bookmarked
                  ? "border-slate-700 bg-slate-700 text-white"
                  : "border-slate-200 bg-white text-slate-400 hover:text-slate-700"
              }`}
              aria-label={bookmarked ? "Remove bookmark" : "Save article"}
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark
                size={16}
                strokeWidth={2.5}
                fill={bookmarked ? "currentColor" : "none"}
              />
            </button>
          </div>

          <nav
            className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            aria-label="Contents"
          >
            {article.sections.map((s) => (
              <a
                key={s.id}
                href={`#${sectionSlug(s.heading)}`}
                className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
              >
                {s.heading}
              </a>
            ))}
          </nav>

          <LibraryTiptapEditor article={article} />
        </article>
      </div>

      {showEditModal ? (
        <SuggestEditModal onClose={() => setShowEditModal(false)} />
      ) : null}
    </>
  );
}
