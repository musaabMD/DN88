"use client";

import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
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
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={HOME_PATH} className="flex min-w-0 items-center">
            <DrNoteLogo showWordmark forceWordmark />
          </Link>
          <UserAuthControls compact />
        </div>
      </header>
      <div className="h-[4.5rem] shrink-0" aria-hidden />
    </>
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
      <div className="pt-4">
        <LibraryBackLink />
      </div>

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
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
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
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50">
      <Link
        href={topicPath(topic.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <LibraryThumb seed={topic.specialty} />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-base font-extrabold leading-snug tracking-tight text-slate-700">
            {topic.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-400">
            <Clock3 size={14} strokeWidth={2.5} className="shrink-0" />
            <span>5 min read · {topic.specialty}</span>
          </p>
        </div>
        <ChevronRight
          size={20}
          strokeWidth={3}
          className="shrink-0 text-slate-300 opacity-0 transition-all duration-150 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-[#334155]"
        />
      </Link>
      <BookmarkButton
        bookmarked={bookmarked}
        onToggle={toggleBookmark}
        label={bookmarked ? "Remove topic bookmark" : "Bookmark topic"}
        showOnHover
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
      <div className="flex flex-wrap items-center gap-3 pt-4">
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
