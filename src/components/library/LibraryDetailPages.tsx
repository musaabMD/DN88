"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { LibraryThumb, LibraryThumbHero } from "@/components/library/LibraryThumb";
import {
  BookmarkButton,
  ComingSoonPanel,
  LibraryBackLink,
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

function PostPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white font-sans">
      <AppHeader
        showBack
        onBack={() => router.push(LIBRARY_PATH)}
        title={title}
        showLibrary
      />
      <main className="mx-auto w-full max-w-4xl px-4 pb-14 sm:px-6">{children}</main>
    </div>
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
    <PostPageShell title={specialty}>
      <div className="pt-4">
        <LibraryBackLink />
      </div>

      <div className="group mt-4 flex items-start gap-4">
        <LibraryThumbHero seed={specialty} />
        <div className="min-w-0 flex-1 text-left">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {specialty}
          </h1>
          <p className="mt-1.5 text-sm font-bold text-slate-400">
            {topics.length > 0
              ? `${topics.length} topic${topics.length === 1 ? "" : "s"}`
              : "Content coming soon"}
          </p>
        </div>
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={toggleBookmark}
          label={bookmarked ? "Remove specialty bookmark" : "Bookmark specialty"}
          showOnHover
        />
      </div>

      {topics.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
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
    </PostPageShell>
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
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <LibraryThumb seed={topic.specialty} />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-base font-extrabold leading-snug tracking-tight text-slate-700">
            {topic.title}
          </h3>
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
      <PostPageShell title={topic.title}>
        <p className="pt-10 text-center text-sm font-bold text-slate-400">
          Opening article…
        </p>
      </PostPageShell>
    );
  }

  return (
    <PostPageShell title={topic.title}>
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

      <div className="group mt-4 flex items-start gap-4">
        <LibraryThumbHero seed={topic.title} />
        <div className="min-w-0 flex-1 text-left">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {topic.title}
          </h1>
        </div>
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={toggleBookmark}
          label={bookmarked ? "Remove topic bookmark" : "Bookmark topic"}
          showOnHover
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
    </PostPageShell>
  );
}
