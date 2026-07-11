"use client";

import { LibraryBrowseShell } from "@/components/library/LibraryBrowseShell";
import { LibraryGrid, LibraryListCard } from "@/components/library/LibraryListCard";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import {
  BookmarkButton,
  ComingSoonPanel,
  useBookmark,
} from "@/components/library/LibraryUi";
import {
  isSpecialtyBookmarked,
  isTopicBookmarked,
  toggleSpecialtyBookmark,
  toggleTopicBookmark,
} from "@/lib/library-bookmarks";
import {
  entityPathForTopic,
} from "@/lib/entities";
import {
  specialtyPath,
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
  const topics = getTopicsForSpecialty(specialty);
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isSpecialtyBookmarked(specialty),
    () => toggleSpecialtyBookmark(specialty),
    [specialty]
  );

  return (
    <LibraryBrowseShell>
      <LibraryPageHeader
        seed={specialty}
        title={specialty}
        meta={
          topics.length > 0
            ? `${topics.length} topic${topics.length === 1 ? "" : "s"}`
            : "Updating soon"
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
  const href = entityPathForTopic(topic);

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
