"use client";

import type { LibraryArticle } from "@/lib/set-content";

export function ArticleReaderFooter({ article }: { article: LibraryArticle }) {
  return (
    <footer className="reader-footer">
      <p className="reader-updated">Last updated {article.updated}</p>
    </footer>
  );
}
