"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronRight, Clock3, Search } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { SuggestArticleModal } from "@/components/SuggestArticleModal";
import { UserAuthControls } from "@/components/UserAuthControls";
import {
  isArticleBookmarked,
  toggleArticleBookmark,
} from "@/lib/article-bookmarks";
import { DEFAULT_EXAM_ID } from "@/lib/exams";
import { filterLibraryArticles } from "@/lib/mock-data";
import { DASHBOARD_PATH, HOME_PATH, UPGRADE_PATH, articlePath } from "@/lib/routes";
import {
  MEDICAL_SPECIALTIES,
  SPECIALTY_TOPIC_GROUPS,
  filterSpecialtyTopics,
  type MedicalSpecialty,
  type SpecialtyTopic,
} from "@/lib/specialties";
import { getTileColors } from "@/lib/tile-colors";

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

/** Specialty / article row — same visual language as ExamCard. */
function LibraryRowCard({
  title,
  letter,
  colorKey,
  query,
  href,
  meta,
  trailing,
}: {
  title: string;
  letter: string;
  colorKey: string;
  query: string;
  href?: string;
  meta?: string;
  trailing?: React.ReactNode;
}) {
  const { bg, border } = getTileColors(colorKey);

  const body = (
    <>
      <div
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4"
        style={{ background: bg, borderColor: border }}
      >
        <span
          aria-hidden="true"
          className="absolute -bottom-3 -right-1 select-none text-4xl font-black text-white opacity-20"
        >
          {letter}
        </span>
        <span className="relative text-xl font-black text-white">{letter}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-extrabold tracking-tight text-slate-700">
          <HighlightText text={title} query={query} />
        </h3>
        {meta ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-400">
            {meta.includes("min") ? (
              <Clock3 size={14} strokeWidth={2.5} className="shrink-0" />
            ) : null}
            <span>
              <HighlightText text={meta} query={query} />
            </span>
          </p>
        ) : null}
      </div>

      <ChevronRight
        size={20}
        strokeWidth={3}
        className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
      />
    </>
  );

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50">
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-4">
          {body}
        </Link>
      ) : (
        <button type="button" className="flex min-w-0 flex-1 items-center gap-4">
          {body}
        </button>
      )}
      {trailing}
    </div>
  );
}

/** Compact topic row — lighter than exam cards, still clean. */
function TopicCard({
  topic,
  query,
}: {
  topic: SpecialtyTopic;
  query: string;
}) {
  const { bg, border } = getTileColors(topic.specialty);
  const letter = topic.title.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-3 text-left transition-colors duration-150 hover:bg-slate-50"
    >
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-b-4"
        style={{ background: bg, borderColor: border }}
      >
        <span
          aria-hidden="true"
          className="absolute -bottom-2 -right-1 select-none text-3xl font-black text-white opacity-20"
        >
          {letter}
        </span>
        <span className="relative text-base font-black text-white">{letter}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold leading-snug text-slate-700">
          <HighlightText text={topic.title} query={query} />
        </p>
        <p className="mt-0.5 truncate text-xs font-bold text-slate-400">
          <HighlightText text={topic.specialty} query={query} />
        </p>
      </div>
      <ChevronRight
        size={18}
        strokeWidth={3}
        className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
      />
    </button>
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
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isArticleBookmarked(article.id));
  }, [article.id]);

  return (
    <LibraryRowCard
      title={article.title}
      letter={article.title.charAt(0).toUpperCase()}
      colorKey={article.subject}
      query={query}
      href={articlePath(DEFAULT_EXAM_ID, article.id)}
      meta={`${article.readMinutes} min read · ${article.subject}`}
      trailing={
        <button
          type="button"
          onClick={() => setBookmarked(toggleArticleBookmark(article.id))}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-b-4 transition-colors active:translate-y-0.5 active:border-b-2 ${
            bookmarked
              ? "border-slate-700 bg-slate-700 text-white"
              : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700"
          }`}
        >
          <Bookmark
            size={18}
            strokeWidth={2.5}
            fill={bookmarked ? "currentColor" : "none"}
          />
        </button>
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
          <LibraryRowCard
            key={specialty}
            title={specialty}
            letter={specialty.charAt(0).toUpperCase()}
            colorKey={specialty}
            query={query}
            meta={meta}
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

      <div className="mt-6 flex gap-2">
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
