"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  isSpecialtyBookmarked,
  isTopicBookmarked,
  toggleSpecialtyBookmark,
  toggleTopicBookmark,
} from "@/lib/library-bookmarks";
import { getLibraryArticleById } from "@/lib/mock-data";
import {
  LIBRARY_PATH,
  articlePath,
  specialtyPath,
  topicPath,
} from "@/lib/routes";
import {
  getTopicsForSpecialty,
  specialtySlug,
  type MedicalSpecialty,
  type SpecialtyTopic,
} from "@/lib/specialties";

export function SpecialtyPageClient({
  specialty,
}: {
  specialty: MedicalSpecialty;
}) {
  const router = useRouter();
  const topics = getTopicsForSpecialty(specialty);
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isSpecialtyBookmarked(specialty),
    () => toggleSpecialtyBookmark(specialty),
    [specialty]
  );

  return (
    <LibraryBrowseShell
      showBack
      onBack={() => router.push(LIBRARY_PATH)}
    >
      <LibraryPageHeader
        seed={specialty}
        title={specialty}
        meta={
          topics.length > 0
            ? `${topics.length} topic${topics.length === 1 ? "" : "s"}`
            : "Content coming soon"
        }
        bookmark={
          <BookmarkButton
            bookmarked={bookmarked}
            onToggle={toggleBookmark}
            label={
              bookmarked ? "Remove specialty bookmark" : "Bookmark specialty"
            }
            showOnHover
          />
        }
      />

      {topics.length > 0 ? (
        <LibraryGrid>
          {topics.map((topic) => (
            <SpecialtyTopicRow key={topic.id} topic={topic} />
          ))}
        </LibraryGrid>
      ) : (
        <ComingSoonPanel
          title="No topics yet"
          description="We're building guides for this specialty. Bookmark it to get notified when new topics land."
        />
      )}
    </LibraryBrowseShell>
  );
}

function SpecialtyTopicRow({ topic }: { topic: SpecialtyTopic }) {
  const article = getLibraryArticleById(topic.id);
  const href = article ? articlePath(article.id) : topicPath(topic.id);

  const { bookmarked, toggleBookmark } = useBookmark(
    () => isTopicBookmarked(topic.id),
    () => toggleTopicBookmark(topic.id),
    [topic.id]
  );

  return (
    <LibraryListCard
      href={href}
      seed={topic.specialty}
      title={topic.title}
      trailing={
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={toggleBookmark}
          label={bookmarked ? "Remove topic bookmark" : "Bookmark topic"}
          showOnHover
        />
      }
    />
  );
}

export function TopicPageClient({ topic }: { topic: SpecialtyTopic }) {
  const router = useRouter();
  const article = getLibraryArticleById(topic.id);
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isTopicBookmarked(topic.id),
    () => toggleTopicBookmark(topic.id),
    [topic.id]
  );

  useEffect(() => {
    if (article) router.replace(articlePath(article.id));
  }, [article, router]);

  if (article) {
    return (
      <LibraryBrowseShell
        showBack
        onBack={() => router.push(LIBRARY_PATH)}
      >
        <p className="pt-6 text-center text-sm font-bold text-slate-400">
          Opening article…
        </p>
      </LibraryBrowseShell>
    );
  }

  return (
    <LibraryBrowseShell
      showBack
      onBack={() => router.push(LIBRARY_PATH)}
    >
      <LibraryPageHeader
        seed={topic.specialty}
        title={topic.title}
        meta="Article coming soon"
        breadcrumb={{
          label: topic.specialty,
          href: specialtyPath(specialtySlug(topic.specialty)),
        }}
        bookmark={
          <BookmarkButton
            bookmarked={bookmarked}
            onToggle={toggleBookmark}
            label={bookmarked ? "Remove topic bookmark" : "Bookmark topic"}
            showOnHover
          />
        }
      />

      <ComingSoonPanel
        title="Article coming soon"
        description="Full clinical notes, summary, questions, and flashcards will appear here as content is published."
      >
        <LibraryCtaButton href={specialtyPath(specialtySlug(topic.specialty))}>
          Browse {topic.specialty}
        </LibraryCtaButton>
      </ComingSoonPanel>
    </LibraryBrowseShell>
  );
}
