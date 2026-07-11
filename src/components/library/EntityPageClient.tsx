"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LibraryArticle from "@/components/content/LibraryArticle";
import { LibraryBrowseShell } from "@/components/library/LibraryBrowseShell";
import { LibraryGrid, LibraryListCard } from "@/components/library/LibraryListCard";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { CatalogStateBanner } from "@/components/library/CatalogStateBanner";
import {
  BookmarkButton,
  ComingSoonPanel,
  LibraryCtaButton,
  useBookmark,
} from "@/components/library/LibraryUi";
import {
  catalogArticleToLibraryArticle,
  fetchPublicArticle,
  isCatalogApiEnabled,
} from "@/lib/catalog/api";
import {
  classifyEntityKind,
  ENTITY_PLACEHOLDER_SLUG,
  entityKindLabel,
  entitySlugFromPathname,
  entitySlugFromTopicTitle,
  getEntity,
  resolveLibraryArticle,
  type EntityKind,
} from "@/lib/entities";
import { isTopicBookmarked, toggleTopicBookmark } from "@/lib/library-bookmarks";
import { LIBRARY_PATH, specialtyPath } from "@/lib/routes";
import { getTopicById, specialtySlug } from "@/lib/specialties";
import type { LibraryArticle as LibraryArticleType } from "@/lib/set-content";

type EntityPageClientProps = {
  kind: EntityKind;
  slug: string;
};

export function EntityPageClient({ kind, slug }: EntityPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedSlug =
    slug === ENTITY_PLACEHOLDER_SLUG
      ? entitySlugFromPathname(pathname, kind)
      : slug;
  const entity = getEntity(kind, resolvedSlug);

  const [apiArticle, setApiArticle] = useState<LibraryArticleType | null>(null);
  const [apiLoading, setApiLoading] = useState(isCatalogApiEnabled());
  const [apiChecked, setApiChecked] = useState(!isCatalogApiEnabled());

  useEffect(() => {
    if (!isCatalogApiEnabled()) return;
    let cancelled = false;
    setApiLoading(true);
    void fetchPublicArticle(resolvedSlug).then((detail) => {
      if (cancelled) return;
      setApiArticle(detail ? catalogArticleToLibraryArticle(detail) : null);
      setApiLoading(false);
      setApiChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedSlug]);

  const bundledArticle =
    resolveLibraryArticle(resolvedSlug) ??
    (entity?.articleId ? resolveLibraryArticle(entity.articleId) : undefined);

  const article = isCatalogApiEnabled() ? apiArticle ?? undefined : bundledArticle;

  const displayTitle =
    article?.title ??
    entity?.title ??
    resolvedSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const bookmarkKey = `${kind}-${resolvedSlug}`;

  const { bookmarked, toggleBookmark } = useBookmark(
    () => isTopicBookmarked(bookmarkKey),
    () => toggleTopicBookmark(bookmarkKey),
    [bookmarkKey]
  );

  if (apiLoading && isCatalogApiEnabled()) {
    return (
      <LibraryBrowseShell showBack onBack={() => router.push(LIBRARY_PATH)}>
        <CatalogStateBanner />
        <p className="text-muted-foreground">Loading article…</p>
      </LibraryBrowseShell>
    );
  }

  if (article) {
    return (
      <>
        <CatalogStateBanner />
        <LibraryArticle
          article={article}
          onBack={() => router.push(LIBRARY_PATH)}
        />
      </>
    );
  }

  const relatedSpecialties = entity?.specialties ?? [];
  const unavailableMessage = isCatalogApiEnabled() && apiChecked
    ? "This topic is not yet published."
    : undefined;

  return (
    <LibraryBrowseShell showBack onBack={() => router.push(LIBRARY_PATH)}>
      <CatalogStateBanner />
      <LibraryPageHeader
        seed={displayTitle}
        title={displayTitle}
        meta={unavailableMessage ?? "Updating soon"}
        breadcrumb={{
          label: entityKindLabel(kind),
          href: LIBRARY_PATH,
        }}
        bookmark={
          <BookmarkButton
            bookmarked={bookmarked}
            onToggle={toggleBookmark}
            label={bookmarked ? "Remove bookmark" : "Bookmark topic"}
            showOnHover
          />
        }
      />
      <ComingSoonPanel
        title={unavailableMessage ? "Not yet published" : "Content updating soon"}
        description={
          unavailableMessage ??
          "Full clinical notes, summaries, questions, and flashcards for this topic are being published. Check back soon."
        }
      >
        {relatedSpecialties.length > 0 ? (
          <div className="mt-8 text-left">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
              Covered in
            </p>
            <div className="mx-auto max-w-xl">
              <LibraryGrid>
                {relatedSpecialties.slice(0, 6).map((specialty) => (
                  <LibraryListCard
                    key={specialty}
                    href={specialtyPath(specialtySlug(specialty))}
                    seed={specialty}
                    title={specialty}
                  />
                ))}
              </LibraryGrid>
            </div>
            {relatedSpecialties.length > 6 ? (
              <LibraryCtaButton href={LIBRARY_PATH}>
                Browse all specialties
              </LibraryCtaButton>
            ) : null}
          </div>
        ) : (
          <LibraryCtaButton href={LIBRARY_PATH}>Back to Library</LibraryCtaButton>
        )}
      </ComingSoonPanel>
    </LibraryBrowseShell>
  );
}

/** Shared page shell for legacy topic URLs (redirect target or direct view). */
export function TopicEntityPageClient({
  topicId,
}: {
  topicId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedTopicId =
    topicId === ENTITY_PLACEHOLDER_SLUG
      ? (pathname.match(/^\/library\/topics\/([^/]+)/)?.[1] ?? "")
      : topicId;
  const topic = getTopicById(resolvedTopicId);

  if (!topic) {
    return (
      <LibraryBrowseShell showBack onBack={() => router.push(LIBRARY_PATH)}>
        <LibraryPageHeader seed={resolvedTopicId} title="Topic not found" meta="" />
        <ComingSoonPanel
          title="Topic not found"
          description="This topic is not in our catalog yet."
        >
          <LibraryCtaButton href={LIBRARY_PATH}>Back to Library</LibraryCtaButton>
        </ComingSoonPanel>
      </LibraryBrowseShell>
    );
  }

  return (
    <EntityPageClient
      kind={classifyEntityKind(topic.title)}
      slug={entitySlugFromTopicTitle(topic.title)}
    />
  );
}
