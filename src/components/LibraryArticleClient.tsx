"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LibraryArticle from "@/components/content/LibraryArticle";
import { LibraryBrowseShell } from "@/components/library/LibraryBrowseShell";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { CatalogStateBanner } from "@/components/library/CatalogStateBanner";
import {
  ComingSoonPanel,
  LibraryCtaButton,
} from "@/components/library/LibraryUi";
import {
  catalogArticleToLibraryArticle,
  fetchPublicArticle,
  isCatalogApiEnabled,
} from "@/lib/catalog/api";
import {
  ENTITY_PLACEHOLDER_SLUG,
  getEntity,
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
  const browserPathname =
    typeof window === "undefined" ? pathname : window.location.pathname;
  const resolvedArticleId =
    articleId === ENTITY_PLACEHOLDER_SLUG
      ? (browserPathname.match(/^\/library\/articles\/([^/]+)/)?.[1] ?? "")
      : articleId;

  const created = getCreatedPageById(resolvedArticleId);

  const [apiArticle, setApiArticle] = useState<LibraryArticleType | null>(null);
  const [loading, setLoading] = useState(isCatalogApiEnabled());

  useEffect(() => {
    if (!isCatalogApiEnabled()) return;
    let cancelled = false;
    void fetchPublicArticle(resolvedArticleId).then((detail) => {
      if (cancelled) return;
      setApiArticle(detail ? catalogArticleToLibraryArticle(detail) : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedArticleId]);

  const resolved = apiArticle ?? (created ? createdPageToArticle(created) : undefined);

  const backToLibrary = () => router.push(LIBRARY_PATH);

  if (loading) {
    return (
      <LibraryBrowseShell>
        <CatalogStateBanner />
        <p className="text-muted-foreground">Loading article…</p>
      </LibraryBrowseShell>
    );
  }

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
      <LibraryBrowseShell>
        <CatalogStateBanner />
        <LibraryPageHeader
          seed={displayTitle}
          title={displayTitle}
          meta={isCatalogApiEnabled() ? "Not yet published" : "Updating soon"}
        />
        <ComingSoonPanel
          title={
            isCatalogApiEnabled()
              ? "Not yet published"
              : "Content updating soon"
          }
          description={
            isCatalogApiEnabled()
              ? "This article has not been approved for public publication yet."
              : "Full clinical notes, summaries, questions, and flashcards for this topic are being published. Check back soon."
          }
        >
          <LibraryCtaButton href={LIBRARY_PATH}>Back to Library</LibraryCtaButton>
        </ComingSoonPanel>
      </LibraryBrowseShell>
    );
  }

  return (
    <>
      <CatalogStateBanner />
      <LibraryArticle article={resolved} onBack={backToLibrary} />
    </>
  );
}
