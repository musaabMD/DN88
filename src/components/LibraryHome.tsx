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

/** Spotify-inspired library accents (green + charcoal, not teal). */
const LIB = {
  green: "#1DB954",
  greenDark: "#169C46",
  greenSoft: "#E8F8EE",
  greenBorder: "#A8E6C0",
  ink: "#191414",
  muted: "#6B7280",
} as const;

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
        className="rounded-sm bg-[#1DB954]/30 px-0.5 text-inherit"
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

function MedicalDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* DNA helix */}
      <svg
        className="absolute -right-2 top-3 h-28 w-16 opacity-[0.18] sm:right-6 sm:top-4 sm:h-36 sm:w-20 sm:opacity-25"
        viewBox="0 0 64 140"
        fill="none"
      >
        <path
          d="M16 8 C40 28, 24 48, 48 68 C24 88, 40 108, 16 128"
          stroke={LIB.ink}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M48 8 C24 28, 40 48, 16 68 C40 88, 24 108, 48 128"
          stroke={LIB.green}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {[18, 38, 58, 78, 98, 118].map((y) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="44"
            y2={y}
            stroke={LIB.ink}
            strokeWidth="2"
            opacity="0.5"
          />
        ))}
      </svg>

      {/* Cell */}
      <svg
        className="absolute -left-4 bottom-2 h-24 w-24 opacity-[0.16] sm:left-4 sm:bottom-4 sm:h-28 sm:w-28 sm:opacity-22"
        viewBox="0 0 100 100"
        fill="none"
      >
        <ellipse cx="50" cy="50" rx="38" ry="34" stroke={LIB.ink} strokeWidth="2.5" />
        <ellipse cx="50" cy="50" rx="28" ry="24" stroke={LIB.green} strokeWidth="2" />
        <circle cx="48" cy="46" r="10" fill={LIB.green} opacity="0.35" />
        <circle cx="48" cy="46" r="5" fill={LIB.ink} opacity="0.4" />
        <circle cx="68" cy="38" r="4" fill={LIB.ink} opacity="0.25" />
        <circle cx="34" cy="62" r="3.5" fill={LIB.green} opacity="0.45" />
        <circle cx="62" cy="64" r="3" fill={LIB.ink} opacity="0.2" />
      </svg>

      {/* Chromosome pair */}
      <svg
        className="absolute right-24 -bottom-2 hidden h-20 w-20 opacity-20 sm:block"
        viewBox="0 0 80 80"
        fill="none"
      >
        <path
          d="M28 12 C22 28, 22 40, 28 56 C34 40, 34 28, 28 12 Z"
          fill={LIB.ink}
          opacity="0.35"
        />
        <path
          d="M28 12 C34 28, 34 40, 28 56 C22 40, 22 28, 28 12 Z"
          fill={LIB.green}
          opacity="0.55"
        />
        <path
          d="M52 18 C46 34, 46 46, 52 62 C58 46, 58 34, 52 18 Z"
          fill={LIB.ink}
          opacity="0.35"
        />
        <path
          d="M52 18 C58 34, 58 46, 52 62 C46 46, 46 34, 52 18 Z"
          fill={LIB.green}
          opacity="0.55"
        />
        <circle cx="28" cy="34" r="3" fill={LIB.ink} />
        <circle cx="52" cy="40" r="3" fill={LIB.ink} />
      </svg>

      {/* Virus / infection */}
      <svg
        className="absolute left-1/4 top-2 h-14 w-14 opacity-[0.14] sm:left-[18%] sm:top-3 sm:h-16 sm:w-16 sm:opacity-20"
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle cx="32" cy="32" r="12" fill={LIB.ink} opacity="0.35" />
        <circle cx="32" cy="32" r="7" fill={LIB.green} opacity="0.5" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 32 + Math.cos(rad) * 12;
          const y1 = 32 + Math.sin(rad) * 12;
          const x2 = 32 + Math.cos(rad) * 22;
          const y2 = 32 + Math.sin(rad) * 22;
          return (
            <g key={deg}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={LIB.ink}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx={x2} cy={y2} r="2.5" fill={LIB.green} />
            </g>
          );
        })}
      </svg>

      {/* Vaccine syringe */}
      <svg
        className="absolute bottom-8 right-[38%] hidden h-16 w-16 opacity-20 md:block"
        viewBox="0 0 64 64"
        fill="none"
      >
        <rect
          x="28"
          y="8"
          width="8"
          height="14"
          rx="1"
          fill={LIB.ink}
          opacity="0.4"
        />
        <rect x="26" y="20" width="12" height="6" rx="1" fill={LIB.green} />
        <rect
          x="24"
          y="26"
          width="16"
          height="22"
          rx="2"
          stroke={LIB.ink}
          strokeWidth="2"
          fill={LIB.green}
          fillOpacity="0.25"
        />
        <line x1="32" y1="48" x2="32" y2="58" stroke={LIB.ink} strokeWidth="2" />
        <line x1="28" y1="58" x2="36" y2="58" stroke={LIB.ink} strokeWidth="2" />
        <line
          x1="28"
          y1="34"
          x2="36"
          y2="34"
          stroke={LIB.ink}
          strokeWidth="1.5"
          opacity="0.5"
        />
        <line
          x1="28"
          y1="40"
          x2="36"
          y2="40"
          stroke={LIB.ink}
          strokeWidth="1.5"
          opacity="0.5"
        />
      </svg>
    </div>
  );
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
          className="hidden text-sm font-bold text-slate-600 hover:text-[#191414] sm:inline"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => router.push(UPGRADE_PATH)}
          className="rounded-xl border-b-4 border-[#0f0f0f] bg-[#191414] px-3 py-2 text-sm font-extrabold text-white transition-colors hover:bg-[#2a2a2a] active:translate-y-0.5 active:border-b-2 sm:px-4"
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
    <div
      className="relative overflow-hidden rounded-3xl border-2 px-6 py-8 sm:px-10 sm:py-10"
      style={{
        borderColor: LIB.greenBorder,
        background: `linear-gradient(145deg, ${LIB.greenSoft} 0%, #ffffff 55%, #f3faf6 100%)`,
      }}
    >
      <MedicalDecor />

      <div className="relative mx-auto max-w-2xl text-center">
        <h1
          className="text-2xl font-black leading-tight tracking-tight sm:text-4xl"
          style={{ color: LIB.ink }}
        >
          Library
        </h1>
        <p
          className="mx-auto mt-2 max-w-sm text-sm font-bold sm:text-base"
          style={{ color: LIB.greenDark }}
        >
          Browse articles and study guides
        </p>

        <div
          className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border-2 border-b-4 bg-white px-4 py-3"
          style={{ borderColor: LIB.greenBorder }}
        >
          <Search
            size={20}
            strokeWidth={2.5}
            className="shrink-0"
            style={{ color: LIB.green }}
          />
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

/** Compact topic row — preferred size for Topic tab. */
function TopicCard({
  topic,
  query,
}: {
  topic: SpecialtyTopic;
  query: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-start gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-[#1DB954]/50 hover:bg-[#E8F8EE]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold leading-snug text-slate-800">
          <HighlightText text={topic.title} query={query} />
        </p>
        <p className="mt-1 text-xs font-bold" style={{ color: LIB.greenDark }}>
          <HighlightText text={topic.specialty} query={query} />
        </p>
      </div>
      <ChevronRight
        size={18}
        strokeWidth={3}
        className="mt-0.5 shrink-0 text-slate-300"
      />
    </button>
  );
}

/** Article card — book icon + read time (published posts only). */
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
            <HighlightText text={article.title} query={query} />
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-400">
            <Clock3 size={14} strokeWidth={2.5} />
            <span>{article.readMinutes} min read</span>
            <span>·</span>
            <span>
              <HighlightText text={article.subject} query={query} />
            </span>
          </p>
        </div>

        <ChevronRight
          size={20}
          strokeWidth={3}
          className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#191414]"
        />
      </Link>

      <button
        type="button"
        onClick={() => setBookmarked(toggleArticleBookmark(article.id))}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-b-4 transition-colors active:translate-y-0.5 active:border-b-2 ${
          bookmarked
            ? "border-[#191414] bg-[#191414] text-white"
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

function SpecialtyCard({
  specialty,
  meta,
  query,
}: {
  specialty: MedicalSpecialty;
  meta: string;
  query: string;
}) {
  const { bg, border } = getTileColors(specialty);

  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50"
    >
      <div
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4"
        style={{ background: bg, borderColor: border }}
      >
        <span className="text-lg font-black text-white">
          {specialty.charAt(0)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-extrabold tracking-tight text-slate-700">
          <HighlightText text={specialty} query={query} />
        </h3>
        <p className="mt-1 text-sm font-bold text-slate-400">{meta}</p>
      </div>
      <ChevronRight
        size={20}
        strokeWidth={3}
        className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#191414]"
      />
    </button>
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

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
      {specialties.length === 0 ? (
        <p className="col-span-full py-8 text-center text-sm font-bold text-slate-400">
          No specialties match your search
        </p>
      ) : null}
    </div>
  );
}

function TopicTab({ query }: { query: string }) {
  const topics = filterSpecialtyTopics(query);
  const articles = filterLibraryArticles(query);

  return (
    <div className="space-y-6">
      {articles.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Articles
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} query={query} />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        {articles.length > 0 ? (
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Topics
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} query={query} />
          ))}
        </div>
      </div>

      {articles.length === 0 && topics.length === 0 ? (
        <p className="py-8 text-center text-sm font-bold text-slate-400">
          No topics match your search
        </p>
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

      <div className="mt-8 flex gap-2 border-b-2 border-slate-100">
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
            className={`border-b-4 px-4 py-2.5 text-sm font-extrabold transition-colors ${
              activeTab === tab.id
                ? "text-[#169C46]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            style={
              activeTab === tab.id
                ? { borderColor: LIB.green }
                : undefined
            }
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
