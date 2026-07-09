"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Bookmark, ChevronRight, Clock3, Search } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { SuggestArticleModal } from "@/components/SuggestArticleModal";
import { UserAuthControls } from "@/components/UserAuthControls";
import {
  isArticleBookmarked,
  toggleArticleBookmark,
} from "@/lib/article-bookmarks";
import { DEFAULT_EXAM_ID } from "@/lib/exams";
import { filterLibraryArticles, type LibraryArticle } from "@/lib/mock-data";
import { DASHBOARD_PATH, HOME_PATH, UPGRADE_PATH, articlePath } from "@/lib/routes";
import { MEDICAL_SPECIALTIES } from "@/lib/specialties";
import { getTileColors } from "@/lib/tile-colors";

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
    <div className="relative overflow-hidden rounded-3xl border-2 border-teal-200 bg-teal-50 px-6 py-8 sm:px-10 sm:py-10">
      <span
        aria-hidden="true"
        className="absolute -top-6 right-8 select-none text-8xl font-black text-teal-200"
      >
        A
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-10 right-32 hidden select-none text-9xl font-black text-teal-200 sm:block"
      >
        B
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-8 -left-4 select-none text-8xl font-black text-teal-200"
      >
        ?
      </span>

      <div className="relative mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
          Library
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-bold text-teal-700 sm:text-base">
          Browse articles and study guides
        </p>

        <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border-2 border-b-4 border-teal-200 bg-white px-4 py-3">
          <Search size={20} strokeWidth={2.5} className="shrink-0 text-teal-500" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search articles"
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

function ArticleCard({ article }: { article: LibraryArticle }) {
  const { bg, border } = getTileColors(article.subject);
  const href = articlePath(DEFAULT_EXAM_ID, article.id);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isArticleBookmarked(article.id));
  }, [article.id]);

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4"
          style={{ background: bg, borderColor: border }}
        >
          <BookOpen size={20} strokeWidth={2.5} className="text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold tracking-tight text-slate-700">
            {article.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-400">
            <Clock3 size={14} strokeWidth={2.5} />
            <span>{article.readMinutes} min read</span>
            <span>·</span>
            <span>{article.subject}</span>
          </p>
        </div>

        <ChevronRight
          size={20}
          strokeWidth={3}
          className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
        />
      </Link>

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
    </div>
  );
}

function SpecialtiesSection() {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-black tracking-tight text-slate-800 sm:text-2xl">
        Specialties
      </h2>
      <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
        Browse the latest medical content in over 30 specialties to help you
        make evidence-based clinical decisions.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {MEDICAL_SPECIALTIES.map((specialty) => (
          <button
            key={specialty}
            type="button"
            className="rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
          >
            {specialty}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function LibraryHome() {
  const [query, setQuery] = useState("");
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const articles = filterLibraryArticles(query);

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <LibraryHomeHeader />

      <LibraryHero
        query={query}
        onQuery={setQuery}
        onSuggestArticle={() => setShowSuggestModal(true)}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
          <p className="text-lg font-extrabold text-slate-700">No articles found</p>
          <p className="mt-1 text-sm font-bold text-slate-400">
            Try a different search term
          </p>
        </div>
      ) : null}

      <SpecialtiesSection />

      {showSuggestModal ? (
        <SuggestArticleModal onClose={() => setShowSuggestModal(false)} />
      ) : null}
    </main>
  );
}
