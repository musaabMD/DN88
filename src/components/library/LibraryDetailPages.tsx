"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { LibraryThumb, LibraryThumbHero } from "@/components/library/LibraryThumb";
import {
  BookmarkButton,
  ComingSoonPanel,
  LibraryBackLink,
  useBookmark,
} from "@/components/library/LibraryUi";
import { UserAuthControls } from "@/components/UserAuthControls";
import {
  isSpecialtyBookmarked,
  isTopicBookmarked,
  toggleSpecialtyBookmark,
  toggleTopicBookmark,
} from "@/lib/library-bookmarks";
import { HOME_PATH, specialtyPath, topicPath } from "@/lib/routes";
import {
  getTopicsForSpecialty,
  specialtySlug,
  type MedicalSpecialty,
  type SpecialtyTopic,
} from "@/lib/specialties";

function PageHeader() {
  return (
    <header className="flex items-center justify-between py-4">
      <Link href={HOME_PATH} className="flex min-w-0 items-center">
        <DrNoteLogo showWordmark forceWordmark />
      </Link>
      <UserAuthControls compact />
    </header>
  );
}

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
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <PageHeader />
      <LibraryBackLink />

      <div className="mt-4 flex items-start gap-4">
        <LibraryThumbHero seed={specialty} />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Specialty
          </p>
          <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {specialty}
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {topics.length > 0
              ? `${topics.length} topic${topics.length === 1 ? "" : "s"}`
              : "Content coming soon"}
          </p>
        </div>
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={toggleBookmark}
          label={bookmarked ? "Remove specialty bookmark" : "Bookmark specialty"}
        />
      </div>

      {topics.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <SpecialtyTopicRow key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <ComingSoonPanel
          title="No topics yet"
          description="We're building guides for this specialty. Bookmark it to get notified when new topics land."
        />
      )}
    </main>
  );
}

function SpecialtyTopicRow({ topic }: { topic: SpecialtyTopic }) {
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isTopicBookmarked(topic.id),
    () => toggleTopicBookmark(topic.id),
    [topic.id]
  );

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50">
      <Link
        href={topicPath(topic.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <LibraryThumb seed={topic.title} size="sm" />
        <p className="min-w-0 flex-1 text-left text-sm font-extrabold leading-snug text-slate-700">
          {topic.title}
        </p>
        <ChevronRight
          size={18}
          strokeWidth={3}
          className="shrink-0 text-slate-300 group-hover:translate-x-1 group-hover:text-[#334155]"
        />
      </Link>
      <BookmarkButton
        bookmarked={bookmarked}
        onToggle={toggleBookmark}
        label={bookmarked ? "Remove topic bookmark" : "Bookmark topic"}
        size="sm"
      />
    </div>
  );
}

export function TopicPageClient({ topic }: { topic: SpecialtyTopic }) {
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isTopicBookmarked(topic.id),
    () => toggleTopicBookmark(topic.id),
    [topic.id]
  );

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <PageHeader />
      <div className="flex flex-wrap items-center gap-3">
        <LibraryBackLink />
        <span className="text-slate-300">/</span>
        <Link
          href={specialtyPath(specialtySlug(topic.specialty))}
          className="text-sm font-extrabold text-slate-500 transition-colors hover:text-slate-800"
        >
          {topic.specialty}
        </Link>
      </div>

      <div className="mt-4 flex items-start gap-4">
        <LibraryThumbHero seed={topic.title} />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Topic
          </p>
          <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {topic.title}
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {topic.specialty}
          </p>
        </div>
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={toggleBookmark}
          label={bookmarked ? "Remove topic bookmark" : "Bookmark topic"}
        />
      </div>

      <ComingSoonPanel
        title="Article coming soon"
        description="This topic page is ready — full clinical notes, summary, questions, and flashcards will appear here as content is published."
      >
        <Link
          href={specialtyPath(specialtySlug(topic.specialty))}
          className="mt-5 inline-flex rounded-xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Browse {topic.specialty}
        </Link>
      </ComingSoonPanel>
    </main>
  );
}
