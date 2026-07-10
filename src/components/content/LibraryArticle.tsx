"use client";

import type { LibraryArticle } from "@/lib/set-content";
import { LibraryTiptapEditor } from "@/components/library/editor/LibraryTiptapEditor";

export default function LibraryArticle({
  article,
  onBack,
}: {
  article: LibraryArticle;
  onBack: () => void;
}) {
  return <LibraryTiptapEditor article={article} onBack={onBack} />;
}
