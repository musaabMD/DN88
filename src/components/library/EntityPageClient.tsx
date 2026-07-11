"use client";

import { useRouter } from "next/navigation";
import LibraryArticle from "@/components/content/LibraryArticle";
import { LibraryBrowseShell } from "@/components/library/LibraryBrowseShell";
import { LibraryGrid, LibraryListCard } from "@/components/library/LibraryListCard";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import {
  BookmarkButton,
  ComingSoonPanel,
  LibraryCtaButton,
  useBookmark,
} from "@/components/library/LibraryUi";
import {
  classifyEntityKind,
  entityKindLabel,
  entitySlugFromTopicTitle,
  getEntity,
  resolveLibraryArticle,
  type EntityKind,
} from "@/lib/entities";
import { isTopicBookmarked, toggleTopicBookmark } from "@/lib/library-bookmarks";
import { LIBRARY_PATH, specialtyPath } from "@/lib/routes";
import { getTopicById, specialtySlug } from "@/lib/specialties";

type EntityPageClientProps = {
  kind: EntityKind;
  slug: string;
};

export function EntityPageClient({ kind, slug }: EntityPageClientProps) {
  const router = useRouter();
  const entity = getEntity(kind, slug);
  const article = resolveLibraryArticle(slug) ?? (entity?.articleId ? resolveLibraryArticle(entity.articleId) : undefined);

  const displayTitle =
    article?.title ??
    entity?.title ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const bookmarkKey = `${kind}-${slug}`;

  const { bookmarked, toggleBookmark } = useBookmark(
    () => isTopicBookmarked(bookmarkKey),
    () => toggleTopicBookmark(bookmarkKey),
    [bookmarkKey]
  );

  if (article) {
    return (
      <LibraryArticle
        article={article}
        onBack={() => router.push(LIBRARY_PATH)}
      />
    );
  }

  const relatedSpecialties = entity?.specialties ?? [];

  return (
    <LibraryBrowseShell showBack onBack={() => router.push(LIBRARY_PATH)}>
      <LibraryPageHeader
        seed={displayTitle}
        title={displayTitle}
        meta="Updating soon"
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
        title="Content updating soon"
        description="Full clinical notes, summaries, questions, and flashcards for this topic are being published. Check back soon."
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
  const topic = getTopicById(topicId);

  if (!topic) {
    return (
      <LibraryBrowseShell showBack onBack={() => router.push(LIBRARY_PATH)}>
        <LibraryPageHeader seed={topicId} title="Topic not found" meta="" />
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
