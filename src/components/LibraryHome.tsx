"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronRight, Search } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { LibraryThumb } from "@/components/library/LibraryThumb";
import {
  BookmarkButton,
  useBookmark,
} from "@/components/library/LibraryUi";
import { SuggestArticleModal } from "@/components/SuggestArticleModal";
import { UserAuthControls } from "@/components/UserAuthControls";
import {
  getArticleBookmarks,
  isArticleBookmarked,
  toggleArticleBookmark,
} from "@/lib/article-bookmarks";
import {
  getSpecialtyBookmarks,
  getTopicBookmarks,
  isSpecialtyBookmarked,
  isTopicBookmarked,
  toggleSpecialtyBookmark,
  toggleTopicBookmark,
} from "@/lib/library-bookmarks";
import { filterLibraryArticles, LIBRARY_ARTICLES } from "@/lib/mock-data";
import {
  DASHBOARD_PATH,
  HOME_PATH,
  UPGRADE_PATH,
  articlePath,
  specialtyPath,
  topicPath,
} from "@/lib/routes";
import {
  ALL_SPECIALTY_TOPICS,
  MEDICAL_SPECIALTIES,
  SPECIALTY_TOPIC_GROUPS,
  filterSpecialtyTopics,
  specialtySlug,
  type MedicalSpecialty,
  type SpecialtyTopic,
} from "@/lib/specialties";

type LibraryTab = "specialty" | "topic" | "bookmarks";

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
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
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
        </div>
      </header>
      <div className="h-[4.5rem] shrink-0" aria-hidden />
    </>
  );
}

function LibraryHero({ onSuggestArticle }: { onSuggestArticle: () => void }) {
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
        <button
          type="button"
          onClick={onSuggestArticle}
          className="mt-5 rounded-full border-2 border-slate-200 bg-white px-5 py-2 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50"
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
  onBookmarkChange,
}: {
  specialty: MedicalSpecialty;
  meta: string;
  query: string;
  onBookmarkChange?: () => void;
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
          className="shrink-0 text-slate-300 opacity-0 transition-all duration-150 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-[#334155]"
        />
      </Link>
      <BookmarkButton
        bookmarked={bookmarked}
        onToggle={() => {
          toggleBookmark();
          onBookmarkChange?.();
        }}
        label={bookmarked ? "Remove specialty bookmark" : "Bookmark specialty"}
        showOnHover
      />
    </div>
  );
}

function TopicCard({
  topic,
  query,
  onBookmarkChange,
}: {
  topic: SpecialtyTopic;
  query: string;
  onBookmarkChange?: () => void;
}) {
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isTopicBookmarked(topic.id),
    () => toggleTopicBookmark(topic.id),
    [topic.id]
  );

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50">
      <Link
        href={topicPath(topic.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <LibraryThumb seed={topic.specialty} />
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-base font-extrabold leading-snug tracking-tight text-slate-700">
            <HighlightText text={topic.title} query={query} />
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
        onToggle={() => {
          toggleBookmark();
          onBookmarkChange?.();
        }}
        label={bookmarked ? "Remove topic bookmark" : "Bookmark topic"}
        showOnHover
      />
    </div>
  );
}

function ArticleCard({
  article,
  query,
  onBookmarkChange,
}: {
  article: {
    id: string;
    title: string;
    subject: string;
    readMinutes: number;
  };
  query: string;
  onBookmarkChange?: () => void;
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
          <p className="mt-1 text-left text-sm font-bold text-slate-400">
            <HighlightText text={article.subject} query={query} />
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
        onToggle={() => {
          toggleBookmark();
          onBookmarkChange?.();
        }}
        label={bookmarked ? "Remove bookmark" : "Bookmark article"}
        showOnHover
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

function SpecialtyTab({
  query,
  bookmarksOnly,
  bookmarkedIds,
  onBookmarkChange,
}: {
  query: string;
  bookmarksOnly: boolean;
  bookmarkedIds: string[];
  onBookmarkChange: () => void;
}) {
  let specialties = filterSpecialties(query);
  if (bookmarksOnly) {
    specialties = specialties.filter((s) => bookmarkedIds.includes(s));
  }

  if (specialties.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
        <p className="text-lg font-extrabold text-slate-700">
          {bookmarksOnly ? "No bookmarked specialties" : "No specialties found"}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-400">
          {bookmarksOnly
            ? "Tap the bookmark icon on a specialty to save it here"
            : "Try a different search term"}
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
            onBookmarkChange={onBookmarkChange}
          />
        );
      })}
    </div>
  );
}

function TopicTab({
  query,
  bookmarksOnly,
  bookmarkedTopicIds,
  bookmarkedArticleIds,
  onBookmarkChange,
}: {
  query: string;
  bookmarksOnly: boolean;
  bookmarkedTopicIds: string[];
  bookmarkedArticleIds: string[];
  onBookmarkChange: () => void;
}) {
  let topics = filterSpecialtyTopics(query);
  let articles = filterLibraryArticles(query);

  if (bookmarksOnly) {
    topics = topics.filter((t) => bookmarkedTopicIds.includes(t.id));
    articles = articles.filter((a) => bookmarkedArticleIds.includes(a.id));
  }

  if (articles.length === 0 && topics.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
        <p className="text-lg font-extrabold text-slate-700">
          {bookmarksOnly ? "No bookmarked topics" : "No topics found"}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-400">
          {bookmarksOnly
            ? "Tap the bookmark icon on a topic to save it here"
            : "Try a different search term"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              query={query}
              onBookmarkChange={onBookmarkChange}
            />
          ))}
        </div>
      ) : null}

      {topics.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              query={query}
              onBookmarkChange={onBookmarkChange}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BookmarksTab({
  query,
  specialtyIds,
  topicIds,
  articleIds,
  onBookmarkChange,
}: {
  query: string;
  specialtyIds: string[];
  topicIds: string[];
  articleIds: string[];
  onBookmarkChange: () => void;
}) {
  const q = query.trim().toLowerCase();

  const specialties = useMemo(
    () =>
      MEDICAL_SPECIALTIES.filter(
        (s) =>
          specialtyIds.includes(s) &&
          (!q || s.toLowerCase().includes(q))
      ),
    [specialtyIds, q]
  );

  const topics = useMemo(
    () =>
      ALL_SPECIALTY_TOPICS.filter(
        (t) =>
          topicIds.includes(t.id) &&
          (!q ||
            t.title.toLowerCase().includes(q) ||
            t.specialty.toLowerCase().includes(q))
      ),
    [topicIds, q]
  );

  const articles = useMemo(
    () =>
      LIBRARY_ARTICLES.filter(
        (a) =>
          articleIds.includes(a.id) &&
          (!q ||
            a.title.toLowerCase().includes(q) ||
            a.subject.toLowerCase().includes(q))
      ),
    [articleIds, q]
  );

  if (specialties.length === 0 && topics.length === 0 && articles.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
        <p className="text-lg font-extrabold text-slate-700">No bookmarks yet</p>
        <p className="mt-1 text-sm font-bold text-slate-400">
          Save specialties, topics, or articles to find them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {specialties.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Specialties
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {specialties.map((specialty) => (
              <SpecialtyCard
                key={specialty}
                specialty={specialty}
                meta={`${topicCountForSpecialty(specialty)} topics`}
                query={query}
                onBookmarkChange={onBookmarkChange}
              />
            ))}
          </div>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Articles
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                query={query}
                onBookmarkChange={onBookmarkChange}
              />
            ))}
          </div>
        </section>
      ) : null}

      {topics.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Topics
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                query={query}
                onBookmarkChange={onBookmarkChange}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StickyLibrarySearch({
  query,
  onQuery,
  bookmarksOnly,
  onToggleBookmarks,
  bookmarkCount,
}: {
  query: string;
  onQuery: (value: string) => void;
  bookmarksOnly: boolean;
  onToggleBookmarks: () => void;
  bookmarkCount: number;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-3 py-2.5">
          <Search size={18} strokeWidth={2.5} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search specialties and topics"
            className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          type="button"
          onClick={onToggleBookmarks}
          aria-pressed={bookmarksOnly}
          aria-label={
            bookmarksOnly ? "Show all results" : "Filter to my bookmarks"
          }
          className={`flex h-11 shrink-0 items-center gap-1.5 rounded-xl border-2 border-b-4 px-3 text-xs font-extrabold transition-colors active:translate-y-0.5 active:border-b-2 ${
            bookmarksOnly
              ? "border-slate-700 bg-slate-700 text-white"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700"
          }`}
        >
          <Bookmark
            size={16}
            strokeWidth={2.5}
            fill={bookmarksOnly ? "currentColor" : "none"}
          />
          <span className="hidden sm:inline">Bookmarks</span>
          {bookmarkCount > 0 ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                bookmarksOnly
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {bookmarkCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}

export default function LibraryHome() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LibraryTab>("specialty");
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([]);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [articleIds, setArticleIds] = useState<string[]>([]);

  const refreshBookmarks = () => {
    setSpecialtyIds(getSpecialtyBookmarks());
    setTopicIds(getTopicBookmarks());
    setArticleIds(getArticleBookmarks());
  };

  useEffect(() => {
    refreshBookmarks();
  }, []);

  const bookmarkCount =
    specialtyIds.length + topicIds.length + articleIds.length;

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-28 sm:px-6">
      <LibraryHomeHeader />

      <LibraryHero onSuggestArticle={() => setShowSuggestModal(true)} />

      <div className="mt-6 flex justify-center gap-2">
        {(
          [
            { id: "specialty" as const, label: "Specialty" },
            { id: "topic" as const, label: "Topic" },
            { id: "bookmarks" as const, label: "My Bookmarks" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "bookmarks") setBookmarksOnly(false);
            }}
            className={`rounded-xl border-2 border-b-4 px-3 py-2 text-sm font-extrabold transition-colors active:translate-y-0.5 active:border-b-2 sm:px-4 ${
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
          <SpecialtyTab
            query={query}
            bookmarksOnly={bookmarksOnly}
            bookmarkedIds={specialtyIds}
            onBookmarkChange={refreshBookmarks}
          />
        ) : activeTab === "topic" ? (
          <TopicTab
            query={query}
            bookmarksOnly={bookmarksOnly}
            bookmarkedTopicIds={topicIds}
            bookmarkedArticleIds={articleIds}
            onBookmarkChange={refreshBookmarks}
          />
        ) : (
          <BookmarksTab
            query={query}
            specialtyIds={specialtyIds}
            topicIds={topicIds}
            articleIds={articleIds}
            onBookmarkChange={refreshBookmarks}
          />
        )}
      </div>

      <StickyLibrarySearch
        query={query}
        onQuery={setQuery}
        bookmarksOnly={bookmarksOnly || activeTab === "bookmarks"}
        onToggleBookmarks={() => {
          if (activeTab === "bookmarks") {
            setActiveTab("specialty");
            setBookmarksOnly(false);
            return;
          }
          if (bookmarksOnly) {
            setBookmarksOnly(false);
            return;
          }
          setActiveTab("bookmarks");
          setBookmarksOnly(false);
        }}
        bookmarkCount={bookmarkCount}
      />

      {showSuggestModal ? (
        <SuggestArticleModal onClose={() => setShowSuggestModal(false)} />
      ) : null}
    </main>
  );
}
