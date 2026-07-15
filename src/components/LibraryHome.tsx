"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookOpen, Clock, Search, Sparkles } from "lucide-react";
import { LibraryBrowseShell } from "@/components/library/LibraryBrowseShell";
import { LibraryGrid, LibraryListCard } from "@/components/library/LibraryListCard";
import { CatalogStateBanner } from "@/components/library/CatalogStateBanner";
import {
  BookmarkButton,
  LibraryEmptyState,
  useBookmark,
} from "@/components/library/LibraryUi";
import { LibraryThumbHero } from "@/components/library/LibraryThumb";
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
  entityPathForCatalogArticle,
  entityPathForTopic,
} from "@/lib/entities";
import {
  fetchPublicArticles,
  isCatalogApiEnabled,
  searchCatalog,
} from "@/lib/catalog/api";
import type { CatalogArticleSummary } from "@/lib/catalog/types";
import {
  ALL_SPECIALTY_TOPICS,
  MEDICAL_SPECIALTIES,
  SPECIALTY_TOPIC_GROUPS,
  filterSpecialtyTopics,
  specialtySlug,
  type MedicalSpecialty,
  type SpecialtyTopic,
} from "@/lib/specialties";
import { specialtyPath } from "@/lib/routes";

type LibraryTab = "articles" | "browse" | "bookmarks";

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

function formatSpecialtyLabel(value: string): string {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function articleMeta(article: {
  subject: string | null;
  specialty: string;
  readMinutes: number;
}): string {
  const label = article.subject ?? formatSpecialtyLabel(article.specialty);
  return `${label} · ${article.readMinutes} min read`;
}

function LibraryHero({
  onSuggestArticle,
  articleCount,
}: {
  onSuggestArticle: () => void;
  articleCount: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 px-6 py-8 sm:px-10 sm:py-10">
      <span
        aria-hidden="true"
        className="absolute -top-6 right-8 select-none text-8xl font-black text-slate-200/80"
      >
        A
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-10 right-32 hidden select-none text-9xl font-black text-slate-200/80 sm:block"
      >
        B
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-8 -left-4 select-none text-8xl font-black text-slate-200/80"
      >
        ?
      </span>

      <div className="relative mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
          <BookOpen size={28} strokeWidth={2.25} className="text-slate-700" />
        </div>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
          Medical Library
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm font-bold text-slate-500 sm:text-base">
          {articleCount > 0
            ? `${articleCount} evidence-based article${articleCount === 1 ? "" : "s"} ready to study`
            : "Browse articles and study guides"}
        </p>
        {articleCount > 0 ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-800">
            <Sparkles size={14} strokeWidth={2.5} />
            Live catalog
          </div>
        ) : null}
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
  featured = false,
}: {
  article: {
    id: string;
    title: string;
    subject: string;
    readMinutes: number;
    href: string;
    seed: string;
    meta?: string;
  };
  query: string;
  onBookmarkChange?: () => void;
  featured?: boolean;
}) {
  const { bookmarked, toggleBookmark } = useBookmark(
    () => isArticleBookmarked(article.id),
    () => toggleArticleBookmark(article.id),
    [article.id]
  );

  if (featured) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:p-5">
        <div className="flex items-start gap-4">
          <LibraryThumbHero seed={article.seed} />
          <div className="min-w-0 flex-1">
            <a href={article.href} className="block">
              <h3 className="text-base font-black leading-snug tracking-tight text-slate-800 sm:text-lg">
                <HighlightText text={article.title} query={query} />
              </h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-400 sm:text-sm">
                <Clock size={14} strokeWidth={2.5} />
                {article.meta ?? article.subject}
              </p>
            </a>
          </div>
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
      </div>
    );
  }

  return (
    <LibraryListCard
      href={article.href}
      seed={article.seed}
      title={<HighlightText text={article.title} query={query} />}
      meta={
        article.meta ? (
          <HighlightText text={article.meta} query={query} />
        ) : (
          <HighlightText text={article.subject} query={query} />
        )
      }
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

function catalogToCardProps(article: CatalogArticleSummary) {
  return {
    id: article.id,
    title: article.title,
    subject: article.subject ?? formatSpecialtyLabel(article.specialty),
    readMinutes: article.readMinutes,
    href: entityPathForCatalogArticle(article),
    seed: article.subject ?? article.specialty,
    meta: articleMeta(article),
  };
}

function bundledToCardProps(article: (typeof LIBRARY_ARTICLES)[number]) {
  return {
    id: article.id,
    title: article.title,
    subject: article.subject,
    readMinutes: article.readMinutes,
    href: entityPathForArticle(article),
    seed: article.subject,
    meta: `${article.subject} · ${article.readMinutes} min read`,
  };
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

function ArticlesTab({
  articles,
  query,
  bookmarksOnly,
  bookmarkedIds,
  onBookmarkChange,
  loading,
}: {
  articles: CatalogArticleSummary[];
  query: string;
  bookmarksOnly: boolean;
  bookmarkedIds: string[];
  onBookmarkChange: () => void;
  loading: boolean;
}) {
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = articles;
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.subject ?? "").toLowerCase().includes(q) ||
          a.specialty.toLowerCase().includes(q) ||
          a.publicSlug.toLowerCase().includes(q)
      );
    }
    if (bookmarksOnly) {
      list = list.filter((a) => bookmarkedIds.includes(a.id));
    }
    return list;
  }, [articles, q, bookmarksOnly, bookmarkedIds]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogArticleSummary[]>();
    for (const article of filtered) {
      const key = article.subject ?? formatSpecialtyLabel(article.specialty);
      const bucket = map.get(key) ?? [];
      bucket.push(article);
      map.set(key, bucket);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const specialtyCount = grouped.length;

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
          />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <LibraryEmptyState
        title={
          bookmarksOnly ? "No bookmarked articles" : "No published articles yet"
        }
        description={
          bookmarksOnly
            ? "Bookmark articles to find them here"
            : "New content is syncing — check back soon or browse specialties"
        }
      />
    );
  }

  const featured = !q && !bookmarksOnly ? filtered.slice(0, 4) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
          <BookOpen size={18} strokeWidth={2.5} className="text-slate-500" />
          {filtered.length} article{filtered.length === 1 ? "" : "s"}
        </div>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <div className="text-sm font-bold text-slate-400">
          {specialtyCount} specialt{specialtyCount === 1 ? "y" : "ies"}
        </div>
      </div>

      {featured.length > 0 ? (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            <Sparkles size={14} strokeWidth={2.5} />
            Featured
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {featured.map((article) => (
              <ArticleCard
                key={article.id}
                article={catalogToCardProps(article)}
                query={query}
                onBookmarkChange={onBookmarkChange}
                featured
              />
            ))}
          </div>
        </section>
      ) : null}

      {grouped.map(([specialty, items]) => (
        <section key={specialty}>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            {specialty}
          </h2>
          <LibraryGrid>
            {items.map((article) => (
              <ArticleCard
                key={article.id}
                article={catalogToCardProps(article)}
                query={query}
                onBookmarkChange={onBookmarkChange}
              />
            ))}
          </LibraryGrid>
        </section>
      ))}
    </div>
  );
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
  catalogArticles,
  catalogSearchResults,
  onBookmarkChange,
}: {
  query: string;
  bookmarksOnly: boolean;
  specialtyIds: string[];
  topicIds: string[];
  articleIds: string[];
  catalogArticles: CatalogArticleSummary[];
  catalogSearchResults: CatalogArticleSummary[];
  onBookmarkChange: () => void;
}) {
  let specialties = filterSpecialties(query);
  let topics = filterSpecialtyTopics(query);
  const useCatalog = isCatalogApiEnabled();
  let articles = useCatalog
    ? catalogSearchResults.length > 0
      ? catalogSearchResults
      : catalogArticles.filter(
          (a) =>
            a.title.toLowerCase().includes(query.trim().toLowerCase()) ||
            (a.subject ?? "").toLowerCase().includes(query.trim().toLowerCase())
        )
    : filterLibraryArticles(query).map(bundledToCardProps);

  if (bookmarksOnly) {
    specialties = specialties.filter((s) => specialtyIds.includes(s));
    topics = topics.filter((t) => topicIds.includes(t.id));
    if (useCatalog) {
      articles = (articles as CatalogArticleSummary[]).filter((a) =>
        articleIds.includes(a.id)
      );
    } else {
      articles = (articles as ReturnType<typeof bundledToCardProps>[]).filter(
        (a) => articleIds.includes(a.id)
      );
    }
  }

  const articleCards = useCatalog
    ? (articles as CatalogArticleSummary[]).map(catalogToCardProps)
    : (articles as ReturnType<typeof bundledToCardProps>[]);

  if (
    specialties.length === 0 &&
    topics.length === 0 &&
    articleCards.length === 0
  ) {
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
      {articleCards.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Articles
          </h2>
          <LibraryGrid>
            {articleCards.map((article) => (
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
  catalogArticles,
  onBookmarkChange,
}: {
  query: string;
  specialtyIds: string[];
  topicIds: string[];
  articleIds: string[];
  catalogArticles: CatalogArticleSummary[];
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

  const catalogBookmarked = useMemo(
    () =>
      catalogArticles.filter(
        (a) =>
          articleIds.includes(a.id) &&
          (!q ||
            a.title.toLowerCase().includes(q) ||
            (a.subject ?? "").toLowerCase().includes(q))
      ),
    [catalogArticles, articleIds, q]
  );

  const bundledBookmarked = useMemo(
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

  const articles = isCatalogApiEnabled()
    ? catalogBookmarked.map(catalogToCardProps)
    : bundledBookmarked.map(bundledToCardProps);

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
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LibraryTab>("browse");
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([]);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [articleIds, setArticleIds] = useState<string[]>([]);
  const [catalogArticles, setCatalogArticles] = useState<CatalogArticleSummary[]>(
    []
  );
  const [catalogLoading, setCatalogLoading] = useState(isCatalogApiEnabled());
  const [catalogSearchResults, setCatalogSearchResults] = useState<
    CatalogArticleSummary[]
  >([]);

  const refreshBookmarks = () => {
    setSpecialtyIds(getSpecialtyBookmarks());
    setTopicIds(getTopicBookmarks());
    setArticleIds(getArticleBookmarks());
  };

  useEffect(() => {
    refreshBookmarks();
  }, []);

  useEffect(() => {
    if (!isCatalogApiEnabled()) {
      setCatalogLoading(false);
      return;
    }
    let cancelled = false;
    void fetchPublicArticles()
      .then(({ articles }) => {
        if (cancelled) return;
        setCatalogArticles(articles);
        if (articles.length > 0) setActiveTab("articles");
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isCatalogApiEnabled() || !query.trim()) {
      setCatalogSearchResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void searchCatalog(query).then(setCatalogSearchResults);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const bookmarkCount =
    specialtyIds.length + topicIds.length + articleIds.length;

  const isSearching = query.trim().length > 0;
  const catalogEnabled = isCatalogApiEnabled();
  const showArticlesTab = catalogEnabled;

  const tabs = [
    ...(showArticlesTab
      ? [{ id: "articles" as const, label: "Articles" }]
      : []),
    { id: "browse" as const, label: "Specialties" },
    { id: "bookmarks" as const, label: "My Bookmarks" },
  ];

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
              setActiveTab(catalogArticles.length > 0 ? "articles" : "browse");
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
      <CatalogStateBanner />
      <LibraryHero
        onSuggestArticle={() => setShowSuggestModal(true)}
        articleCount={catalogArticles.length}
      />

      {!isSearching ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
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
              {tab.id === "articles" && catalogArticles.length > 0 ? (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {catalogArticles.length}
                </span>
              ) : null}
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
            catalogArticles={catalogArticles}
            catalogSearchResults={catalogSearchResults}
            onBookmarkChange={refreshBookmarks}
          />
        ) : activeTab === "articles" ? (
          <ArticlesTab
            articles={catalogArticles}
            query={query}
            bookmarksOnly={bookmarksOnly}
            bookmarkedIds={articleIds}
            onBookmarkChange={refreshBookmarks}
            loading={catalogLoading}
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
            catalogArticles={catalogArticles}
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
