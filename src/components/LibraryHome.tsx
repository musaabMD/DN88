"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock3, Search } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { LibraryThumb } from "@/components/library/LibraryThumb";
import {
  BookmarkButton,
  useBookmark,
} from "@/components/library/LibraryUi";
import { SuggestArticleModal } from "@/components/SuggestArticleModal";
import { UserAuthControls } from "@/components/UserAuthControls";
import {
  isArticleBookmarked,
  toggleArticleBookmark,
} from "@/lib/article-bookmarks";
import {
  isSpecialtyBookmarked,
  isTopicBookmarked,
  toggleSpecialtyBookmark,
  toggleTopicBookmark,
} from "@/lib/library-bookmarks";
import { filterLibraryArticles } from "@/lib/mock-data";
import {
  DASHBOARD_PATH,
  HOME_PATH,
  UPGRADE_PATH,
  articlePath,
  specialtyPath,
  topicPath,
} from "@/lib/routes";
import {
  MEDICAL_SPECIALTIES,
  SPECIALTY_TOPIC_GROUPS,
  filterSpecialtyTopics,
  specialtySlug,
  type MedicalSpecialty,
  type SpecialtyTopic,
} from "@/lib/specialties";

type LibraryTab = "specialty" | "topic";

function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let start = 0;
  let index = lowerText.indexOf(lowerQuery);

  while (index !== -1) {
    if (index > start) parts.push(text.slice(start, index));
    parts.push(
      <mark
        key={`${index}-${q}`}
        className="rounded-sm bg-amber-200 px-0.5 text-inherit"
      >
        {text.slice(index, index + q.length)}
      </mark>
    );
    start = index + q.length;
    index = lowerText.indexOf(lowerQuery, start);
  }

  if (start < text.length) parts.push(text.slice(start));
  return <>{parts}</>;
}

function LibraryHomeHeader() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between py-4">
      <Link href={HOME_PATH} className="flex min-w-0 items-center">
        <DrNoteLogo showWordmark forceWordmark />
      </Link>

      <nav className="flex items-center gap-2 sm:gap-4">
        <Link
          href={DASHBOARD_PATH}
          className="hidden text-sm font-bold text-slate-600 hover:text-[#334155] sm:inline"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => router.push(UPGRADE_PATH)}
          className="rounded-xl border-b-4 border-[#1e293b] bg-[#334155] px-3 py-2 text-sm font-extrabold text-white transition-colors hover:bg-[#475569] active:translate-y-0.5 active:border-b-2 sm:px-4"
        >
          Get Pro
        </button>
        <UserAuthControls compact />
      </nav>
    </header>
  );
}

function LibraryHero({
  query,
  onQuery,
  onSuggestArticle,
}: {
  query: string;
  onQuery: (value: string) => void;
  onSuggestArticle: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-slate-50 px-6 py-8 sm:px-10 sm:py-10">
      <span
        aria-hidden="true"
        className="absolute -top-6 right-8 select-none text-8xl font-black text-slate-200"
      >
        A
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-10 right-32 hidden select-none text-9xl font-black text-slate-200 sm:block"
      >
        B
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-8 -left-4 select-none text-8xl font-black text-slate-200"
      >
        ?
      </span>

      <div className="relative mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
          Library
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-bold text-slate-500 sm:text-base">
          Browse articles and study guides
        </p>

        <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-3">
          <Search size={20} strokeWidth={2.5} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search specialties and topics"
            className="w-full bg-transparent text-base font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="button"
          onClick={onSuggestArticle}
          className="mt-4 rounded-full border-2 border-slate-200 bg-white px-5 py-2 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Suggest Article
        </button>
      </div>
    </div>
  );
}

function SpecialtyCard({
  specialty,
  meta,
  query,
}: {
  specialty: MedicalSpecialty;
  meta: string;
  query: string;
}) {
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isSpecialtyBookmarked(specialty),
    () => toggleSpecialtyBookmark(specialty),
    [specialty]
  );

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50">
      <Link
        href={specialtyPath(specialtySlug(specialty))}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <LibraryThumb seed={specialty} />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-base font-extrabold leading-snug tracking-tight text-slate-700">
            <HighlightText text={specialty} query={query} />
          </h3>
          <p className="mt-1 text-left text-sm font-bold text-slate-400">
            {meta}
          </p>
        </div>
        <ChevronRight
          size={20}
          strokeWidth={3}
          className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
        />
      </Link>
      <BookmarkButton
        bookmarked={bookmarked}
        onToggle={toggleBookmark}
        label={bookmarked ? "Remove specialty bookmark" : "Bookmark specialty"}
      />
    </div>
  );
}

function TopicCard({
  topic,
  query,
}: {
  topic: SpecialtyTopic;
  query: string;
}) {
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isTopicBookmarked(topic.id),
    () => toggleTopicBookmark(topic.id),
    [topic.id]
  );

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-3 text-left transition-colors duration-150 hover:bg-slate-50">
      <Link
        href={topicPath(topic.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <LibraryThumb seed={topic.title} size="sm" />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-extrabold leading-snug text-slate-700">
            <HighlightText text={topic.title} query={query} />
          </p>
          <p className="mt-0.5 text-left text-xs font-bold text-slate-400">
            <HighlightText text={topic.specialty} query={query} />
          </p>
        </div>
        <ChevronRight
          size={18}
          strokeWidth={3}
          className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
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

function ArticleCard({
  article,
  query,
}: {
  article: {
    id: string;
    title: string;
    subject: string;
    readMinutes: number;
  };
  query: string;
}) {
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isArticleBookmarked(article.id),
    () => toggleArticleBookmark(article.id),
    [article.id]
  );

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50">
      <Link
        href={articlePath(article.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <LibraryThumb seed={article.subject} />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-base font-extrabold leading-snug tracking-tight text-slate-700">
            <HighlightText text={article.title} query={query} />
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-left text-sm font-bold text-slate-400">
            <Clock3 size={14} strokeWidth={2.5} className="shrink-0" />
            <span>
              {article.readMinutes} min read ·{" "}
              <HighlightText text={article.subject} query={query} />
            </span>
          </p>
        </div>
        <ChevronRight
          size={20}
          strokeWidth={3}
          className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
        />
      </Link>
      <BookmarkButton
        bookmarked={bookmarked}
        onToggle={toggleBookmark}
        label={bookmarked ? "Remove bookmark" : "Bookmark article"}
      />
    </div>
  );
}

function filterSpecialties(query: string): MedicalSpecialty[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...MEDICAL_SPECIALTIES];
  return MEDICAL_SPECIALTIES.filter((s) => s.toLowerCase().includes(q));
}

function topicCountForSpecialty(specialty: MedicalSpecialty): number {
  const group = SPECIALTY_TOPIC_GROUPS.find((g) => g.specialty === specialty);
  return group?.topics.length ?? 0;
}

function SpecialtyTab({ query }: { query: string }) {
  const specialties = filterSpecialties(query);

  if (specialties.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
        <p className="text-lg font-extrabold text-slate-700">No specialties found</p>
        <p className="mt-1 text-sm font-bold text-slate-400">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {specialties.map((specialty) => {
        const count = topicCountForSpecialty(specialty);
        const meta =
          count > 0
            ? `${count} topic${count === 1 ? "" : "s"}`
            : "Coming soon";
        return (
          <SpecialtyCard
            key={specialty}
            specialty={specialty}
            meta={meta}
            query={query}
          />
        );
      })}
    </div>
  );
}

function TopicTab({ query }: { query: string }) {
  const topics = filterSpecialtyTopics(query);
  const articles = filterLibraryArticles(query);

  if (articles.length === 0 && topics.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
        <p className="text-lg font-extrabold text-slate-700">No topics found</p>
        <p className="mt-1 text-sm font-bold text-slate-400">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} query={query} />
          ))}
        </div>
      ) : null}

      {topics.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} query={query} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function LibraryHome() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LibraryTab>("specialty");
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <LibraryHomeHeader />

      <LibraryHero
        query={query}
        onQuery={setQuery}
        onSuggestArticle={() => setShowSuggestModal(true)}
      />

      <div className="mt-6 flex justify-center gap-2">
        {(
          [
            { id: "specialty" as const, label: "Specialty" },
            { id: "topic" as const, label: "Topic" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl border-2 border-b-4 px-4 py-2 text-sm font-extrabold transition-colors active:translate-y-0.5 active:border-b-2 ${
              activeTab === tab.id
                ? "border-slate-700 bg-slate-700 text-white"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "specialty" ? (
          <SpecialtyTab query={query} />
        ) : (
          <TopicTab query={query} />
        )}
      </div>

      {showSuggestModal ? (
        <SuggestArticleModal onClose={() => setShowSuggestModal(false)} />
      ) : null}
    </main>
  );
}
