"use client";

import { LibraryTiptapSection } from "@/components/library/editor/LibraryTiptapSection";
import type { LibraryEditorMode } from "@/components/library/editor/types";
import type { LibraryArticle, LibraryArticleSection } from "@/lib/set-content";

export function LibraryArticleEditor({
  article,
  section,
  mode,
  paraBookmarked,
  zoom = 100,
}: {
  article: LibraryArticle;
  section: LibraryArticleSection;
  mode: LibraryEditorMode;
  paraBookmarked: boolean;
  zoom?: number;
}) {
  return (
    <div className="library-article-editor mt-3">
      {paraBookmarked ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          Bookmarked section
        </p>
      ) : null}

      <LibraryTiptapSection
        articleId={article.id}
        section={section}
        mode={mode}
        zoom={zoom}
      />

      {section.citations && section.citations.length > 0 ? (
        <p className="mt-3 text-xs font-medium text-slate-400">
          {section.citations.length} citation
          {section.citations.length === 1 ? "" : "s"} attached
        </p>
      ) : null}
    </div>
  );
}
