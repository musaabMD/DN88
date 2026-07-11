"use client";

import { usePathname, useRouter } from "next/navigation";
import LibraryArticle from "@/components/content/LibraryArticle";
import { LibraryBrowseShell } from "@/components/library/LibraryBrowseShell";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import {
  ComingSoonPanel,
  LibraryCtaButton,
} from "@/components/library/LibraryUi";
import {
  ENTITY_PLACEHOLDER_SLUG,
  getEntity,
  resolveLibraryArticle,
} from "@/lib/entities";
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
  const pathname = usePathname();
  const resolvedArticleId =
    articleId === ENTITY_PLACEHOLDER_SLUG
      ? (pathname.match(/^\/library\/articles\/([^/]+)/)?.[1] ?? "")
      : articleId;
  const article = resolveLibraryArticle(resolvedArticleId);
  const created = !article ? getCreatedPageById(resolvedArticleId) : undefined;
  const resolved = article ?? (created ? createdPageToArticle(created) : undefined);
  const backToLibrary = () => router.push(LIBRARY_PATH);

  if (!resolved) {
    const entity =
      getEntity("conditions", resolvedArticleId) ??
      getEntity("medications", resolvedArticleId) ??
      getEntity("assessments", resolvedArticleId) ??
      getEntity("overviews", resolvedArticleId);

    const displayTitle =
      entity?.title ??
      resolvedArticleId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      <LibraryBrowseShell showBack onBack={backToLibrary}>
        <LibraryPageHeader
          seed={displayTitle}
          title={displayTitle}
          meta="Updating soon"
        />
        <ComingSoonPanel
          title="Content updating soon"
          description="Full clinical notes, summaries, questions, and flashcards for this topic are being published. Check back soon."
        >
          <LibraryCtaButton href={LIBRARY_PATH}>Back to Library</LibraryCtaButton>
        </ComingSoonPanel>
      </LibraryBrowseShell>
    );
  }

  return <LibraryArticle article={resolved} onBack={backToLibrary} />;
}
