"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Search } from "lucide-react";
import { LibraryBrowseShell } from "@/components/library/LibraryBrowseShell";
import { LibraryGrid, LibraryListCard } from "@/components/library/LibraryListCard";
import {
  BookmarkButton,
  LibraryEmptyState,
  useBookmark,
} from "@/components/library/LibraryUi";
import { SuggestArticleModal } from "@/components/SuggestArticleModal";
import { ProductSiteNav } from "@/components/ProductSiteNav";
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
  entityPathForArticle,
  entityPathForTopic,
} from "@/lib/entities";
import {
  LIBRARY_PATH,
  specialtyPath,
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

type LibraryTab = "browse" | "bookmarks";

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
        className="rounded-sm bg-slate-200 px-0.5 text-inherit"
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
    <LibraryListCard
      href={specialtyPath(specialtySlug(specialty))}
      seed={specialty}
      title={<HighlightText text={specialty} query={query} />}
      meta={meta}
      trailing={
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={() => {
            toggleBookmark();
            onBookmarkChange?.();
          }}
          label={
            bookmarked ? "Remove specialty bookmark" : "Bookmark specialty"
          }
          showOnHover
        />
      }
    />
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
      title={<HighlightText text={topic.title} query={query} />}
      trailing={
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={() => {
            toggleBookmark();
            onBookmarkChange?.();
          }}
          label={bookmarked ? "Remove topic bookmark" : "Bookmark topic"}
          showOnHover
        />
      }
    />
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
    <LibraryListCard
      href={entityPathForArticle(article)}
      seed={article.subject}
      title={<HighlightText text={article.title} query={query} />}
      meta={<HighlightText text={article.subject} query={query} />}
      trailing={
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={() => {
            toggleBookmark();
            onBookmarkChange?.();
          }}
          label={bookmarked ? "Remove bookmark" : "Bookmark article"}
          showOnHover
        />
      }
    />
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
      <LibraryEmptyState
        title={
          bookmarksOnly ? "No bookmarked specialties" : "No specialties found"
        }
        description={
          bookmarksOnly
            ? "Tap the bookmark icon on a specialty to save it here"
            : "Try a different search term"
        }
      />
    );
  }

  return (
    <LibraryGrid>
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
    </LibraryGrid>
  );
}

function SearchAllResults({
  query,
  bookmarksOnly,
  specialtyIds,
  topicIds,
  articleIds,
  onBookmarkChange,
}: {
  query: string;
  bookmarksOnly: boolean;
  specialtyIds: string[];
  topicIds: string[];
  articleIds: string[];
  onBookmarkChange: () => void;
}) {
  let specialties = filterSpecialties(query);
  let topics = filterSpecialtyTopics(query);
  let articles = filterLibraryArticles(query);

  if (bookmarksOnly) {
    specialties = specialties.filter((s) => specialtyIds.includes(s));
    topics = topics.filter((t) => topicIds.includes(t.id));
    articles = articles.filter((a) => articleIds.includes(a.id));
  }

  if (specialties.length === 0 && topics.length === 0 && articles.length === 0) {
    return (
      <LibraryEmptyState
        title={bookmarksOnly ? "No bookmarked matches" : "No results found"}
        description={
          bookmarksOnly
            ? "Try turning off the bookmarks filter"
            : "Try a different search term"
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {specialties.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Specialties
          </h2>
          <LibraryGrid>
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
          </LibraryGrid>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Articles
          </h2>
          <LibraryGrid>
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                query={query}
                onBookmarkChange={onBookmarkChange}
              />
            ))}
          </LibraryGrid>
        </section>
      ) : null}

      {topics.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Topics
          </h2>
          <LibraryGrid>
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                query={query}
                onBookmarkChange={onBookmarkChange}
              />
            ))}
          </LibraryGrid>
        </section>
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
      <LibraryEmptyState
        title="No bookmarks yet"
        description="Save specialties, topics, or articles to find them here"
      />
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
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <Search size={18} strokeWidth={2.5} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search library"
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
          className={`flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors ${
            bookmarksOnly
              ? "border-slate-700 bg-slate-700 text-white"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
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
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LibraryTab>("browse");
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

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const bookmarkCount =
    specialtyIds.length + topicIds.length + articleIds.length;

  const isSearching = query.trim().length > 0;

  return (
    <LibraryBrowseShell
      headerEnd={<ProductSiteNav />}
      footer={
        <StickyLibrarySearch
          query={query}
          onQuery={setQuery}
          bookmarksOnly={bookmarksOnly || activeTab === "bookmarks"}
          onToggleBookmarks={() => {
            if (activeTab === "bookmarks") {
              setActiveTab("browse");
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
      }
    >
      <LibraryHero onSuggestArticle={() => setShowSuggestModal(true)} />

      {!isSearching ? (
        <div className="mt-6 flex justify-center gap-2">
          {(
            [
              { id: "browse" as const, label: "Browse" },
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
              className={`rounded-xl border px-3 py-2 text-sm font-bold transition-colors sm:px-4 ${
                activeTab === tab.id
                  ? "border-slate-700 bg-slate-700 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        {isSearching ? (
          <SearchAllResults
            query={query}
            bookmarksOnly={bookmarksOnly}
            specialtyIds={specialtyIds}
            topicIds={topicIds}
            articleIds={articleIds}
            onBookmarkChange={refreshBookmarks}
          />
        ) : activeTab === "browse" ? (
          <SpecialtyTab
            query={query}
            bookmarksOnly={bookmarksOnly}
            bookmarkedIds={specialtyIds}
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

      {showSuggestModal ? (
        <SuggestArticleModal onClose={() => setShowSuggestModal(false)} />
      ) : null}
    </LibraryBrowseShell>
  );
}
