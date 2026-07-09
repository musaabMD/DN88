"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Clock3, Search } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { DEFAULT_EXAM_ID } from "@/lib/exams";
import { filterLibraryArticles, type LibraryArticle } from "@/lib/mock-data";
import { DASHBOARD_PATH, HOME_PATH, UPGRADE_PATH, articlePath } from "@/lib/routes";
import { getTileColors } from "@/lib/tile-colors";

function LibraryHomeHeader() {
  const router = useRouter();

  return (
    <header className="-mx-4 mb-6 flex items-center justify-between bg-violet-700 px-4 py-4 sm:-mx-6 sm:rounded-b-2xl sm:px-6">
      <Link href={HOME_PATH} className="flex min-w-0 items-center">
        <DrNoteLogo showWordmark forceWordmark lightWordmark />
      </Link>

      <nav className="flex items-center gap-2 sm:gap-4">
        <Link
          href={DASHBOARD_PATH}
          className="hidden text-sm font-bold text-violet-100 hover:text-white sm:inline"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => router.push(UPGRADE_PATH)}
          className="rounded-xl border-b-4 border-violet-900 bg-violet-800 px-3 py-2 text-sm font-extrabold text-white transition-colors hover:bg-violet-900 active:translate-y-0.5 active:border-b-2 sm:px-4"
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
}: {
  query: string;
  onQuery: (value: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-violet-200 bg-violet-50 px-6 py-8 sm:px-10 sm:py-10">
      <span
        aria-hidden="true"
        className="absolute -top-6 right-8 select-none text-8xl font-black text-violet-200"
      >
        A
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-10 right-32 hidden select-none text-9xl font-black text-violet-200 sm:block"
      >
        B
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-8 -left-4 select-none text-8xl font-black text-violet-200"
      >
        ?
      </span>

      <div className="relative mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
          Library
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-bold text-violet-600 sm:text-base">
          Browse articles and study guides
        </p>

        <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border-2 border-b-4 border-violet-200 bg-white px-4 py-3">
          <Search size={20} strokeWidth={2.5} className="shrink-0 text-violet-400" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search articles"
            className="w-full bg-transparent text-base font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: LibraryArticle }) {
  const { bg, border } = getTileColors(article.subject);
  const href = articlePath(DEFAULT_EXAM_ID, article.id);

  return (
    <Link
      href={href}
      className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50"
    >
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
  );
}

export default function LibraryHome() {
  const [query, setQuery] = useState("");
  const articles = filterLibraryArticles(query);

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <LibraryHomeHeader />

      <LibraryHero query={query} onQuery={setQuery} />

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
    </main>
  );
}
