"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  SAMPLE_FLASHCARDS,
  SAMPLE_IMAGES,
  SAMPLE_QUESTIONS,
  SAMPLE_SUMMARIES,
  SETS_BY_TAB,
  type StudySet,
} from "@/lib/mock-data";
import {
  examTabPath,
  filtersPath,
  setPath,
  UPGRADE_PATH,
  type ContentTab,
} from "@/lib/routes";
import { CitationList } from "@/components/tool-ui/citation";
import { BottomTabBar } from "@/components/BottomTabBar";
import { BrowseHeader } from "@/components/BrowseHeader";
import { FilterFab } from "@/components/FilterFab";
import {
  countBrowseFilters,
  loadBrowseFilters,
  type BrowseFilters,
} from "@/lib/browse-filters";
import { saveCurrentExamId } from "@/lib/current-exam";
import { getTileColors } from "@/lib/tile-colors";
import type { LucideIcon } from "lucide-react";
import {
  FileQuestion,
  FileText,
  Image,
  BookOpen,
  CreditCard,
  X,
  Check,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Crown,
  Star,
  Bookmark,
  Lightbulb,
  Flag,
  Send,
  RotateCcw,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronRight as Chevron,
  Target,
  Pause,
  Share2,
  Sparkles,
  BarChart3,
  Layers,
} from "lucide-react";

/** Mobile: centered narrow column. Desktop: full width with edge padding. */
const PAGE_SHELL =
  "w-full max-w-2xl mx-auto px-4 md:max-w-none md:mx-0 md:px-8 lg:px-12 xl:px-16";

const SUBJECTS = [
  "Anatomy",
  "Physiology",
  "Pharmacology",
  "Pathology",
  "Biochemistry",
  "Microbiology",
  "Surgery",
  "Internal Medicine",
];

const STATUSES = [
  { id: "used", label: "Used" },
  { id: "unused", label: "Unused" },
  { id: "incorrect", label: "Incorrect" },
  { id: "bookmark", label: "Bookmark" },
];

const TAGS = [
  "High Yield",
  "Exam Ready",
  "Review Needed",
  "Master",
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
];

const DAILY_LIMIT = 20;
const DAILY_USED = 13;

const TAB_SET_LABEL: Record<string, string> = {
  questions: "practice sets",
  summary: "note sets",
  images: "image sets",
  flashcards: "card sets",
  library: "sets",
};

const TAB_ITEM_LABEL: Record<string, string> = {
  questions: "questions",
  summary: "notes",
  images: "images",
  flashcards: "cards",
  library: "items",
};

function filterSets(
  sets: StudySet[],
  query: string,
  filters: BrowseFilters
): StudySet[] {
  let result = sets;

  if (filters.subjects.length > 0) {
    result = result.filter((set) => filters.subjects.includes(set.subject));
  }
  if (filters.tags.length > 0) {
    result = result.filter((set) => filters.tags.includes(set.tag));
  }
  if (filters.statuses.length > 0) {
    result = result.filter((set) => {
      const used = set.done > 0;
      const incorrect = set.score !== null && set.score < 70;
      return filters.statuses.some((status) => {
        if (status === "Used") return used;
        if (status === "Unused") return !used;
        if (status === "Incorrect") return incorrect;
        if (status === "Bookmark") return set.tag.toLowerCase().includes("yield");
        return false;
      });
    });
  }

  const q = query.trim().toLowerCase();
  if (!q) return result;

  return result.filter(
    (set) =>
      set.title.toLowerCase().includes(q) ||
      set.subject.toLowerCase().includes(q) ||
      set.tag.toLowerCase().includes(q) ||
      set.about.toLowerCase().includes(q)
  );
}


const TAB_ACCENT: Record<
  string,
  { color: string; bg: string; border: string; icon: LucideIcon }
> = {
  questions: {
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: FileQuestion,
  },
  summary: {
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    icon: FileText,
  },
  images: {
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#fbcfe8",
    icon: Image,
  },
  flashcards: {
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    icon: CreditCard,
  },
};

type SidebarMode = "explain" | "report" | "comments";


function progressColor(pct: number) {
  if (pct >= 100) return "#22c55e";
  if (pct >= 60) return "#58CC02";
  if (pct >= 30) return "#f97316";
  return "#94a3b8";
}

function scoreColor(score: number) {
  if (score >= 70)
    return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", bar: "#22c55e" };
  if (score >= 55)
    return { color: "#b45309", bg: "#fffbeb", border: "#fde68a", bar: "#f59e0b" };
  return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", bar: "#ef4444" };
}

function setMastery(set: StudySet): number {
  return set.score ?? 0;
}

function LetterTile({ title }: { title: string }) {
  const { bg, border } = getTileColors(title);
  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4"
      style={{ background: bg, borderColor: border }}
    >
      <span
        aria-hidden="true"
        className="absolute -bottom-3 -right-1 select-none text-5xl font-black text-white opacity-20"
      >
        {title.charAt(0)}
      </span>
      <span className="relative text-2xl font-black text-white">{title.charAt(0)}</span>
    </div>
  );
}

function SetCard({
  set,
  tab,
  onOpen,
}: {
  set: StudySet;
  tab: string;
  onOpen: () => void;
}) {
  const mastery = setMastery(set);
  const started = mastery > 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50 active:translate-y-0.5 active:border-b-2"
    >
      <div className="flex items-center gap-4">
        <LetterTile title={set.title} />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold tracking-tight text-slate-700">
            {set.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-400">
            <Layers size={14} strokeWidth={2.5} />
            <span className="tabular-nums">
              {set.upvotes.toLocaleString()} {TAB_ITEM_LABEL[tab] ?? "items"}
            </span>
          </p>
        </div>

        <span
          className={`shrink-0 text-xl font-black tabular-nums ${
            started ? "text-green-500" : "text-slate-300"
          }`}
        >
          {mastery}
          <span className="text-sm font-extrabold">%</span>
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        {started && (
          <div
            className="relative h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${mastery}%` }}
          >
            <div className="absolute inset-x-2 top-0.5 h-0.5 rounded-full bg-white/35" />
          </div>
        )}
      </div>
    </button>
  );
}

function SetDetailHeader({
  set,
  tab,
  onBack,
}: {
  set: StudySet;
  tab: string;
  onBack: () => void;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const pct = Math.round((set.done / set.total) * 100);
  const accent = TAB_ACCENT[tab];

  return (
    <div
      className="bg-white rounded-3xl mb-4 px-4 py-3.5"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "#f1f5f9",
            border: "2px solid #e2e8f0",
            boxShadow: "0 2px 0 #e2e8f0",
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} className="text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm truncate">{set.title}</p>
          <span className="text-xs font-black" style={{ color: accent.color }}>
            {set.subject}
          </span>
        </div>
        <button
          onClick={() => setBookmarked((p) => !p)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={
            bookmarked
              ? {
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  color: "#ea580c",
                }
              : {
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  color: "#94a3b8",
                }
          }
        >
          <Bookmark
            size={15}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div
            className="h-2.5 rounded-full overflow-hidden"
            style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: progressColor(pct) }}
            />
          </div>
        </div>
        <span
          className="text-xs font-black flex-shrink-0"
          style={{ color: progressColor(pct) }}
        >
          {set.done}/{set.total}
        </span>
        {set.score !== null && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
            style={{
              background: scoreColor(set.score).bg,
              border: `1.5px solid ${scoreColor(set.score).border}`,
            }}
          >
            <Target
              size={11}
              strokeWidth={2.5}
              style={{ color: scoreColor(set.score).color }}
            />
            <span
              className="text-xs font-black"
              style={{ color: scoreColor(set.score).color }}
            >
              {set.score}/100
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  onSidebar,
}: {
  q: (typeof SAMPLE_QUESTIONS)[0];
  onSidebar: (m: SidebarMode) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const statusColor: Record<string, string> = {
    used: "#22c55e",
    unused: "#94a3b8",
    incorrect: "#ef4444",
  };

  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "2px solid #f8fafc" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-black px-2.5 py-1 rounded-xl"
            style={{
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1.5px solid #bfdbfe",
            }}
          >
            {q.subject}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{ background: "#f0fdf4", color: "#16a34a" }}
          >
            {q.tag}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: statusColor[q.status] }}
          />
          <span
            className="text-xs font-bold capitalize"
            style={{ color: statusColor[q.status] }}
          >
            {q.status}
          </span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2">
        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
          {q.text}
        </p>
      </div>

      <div className="px-4 pb-3 space-y-2">
        {q.options.map((opt, i) => {
          const letter = ["A", "B", "C", "D"][i];
          const isSelected = selected === i;
          const isCorrect = selected !== null && i === q.answer;
          const isWrong = selected !== null && isSelected && i !== q.answer;
          return (
            <button
              key={i}
              onClick={() => selected === null && setSelected(i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-left transition-all"
              style={
                isCorrect
                  ? {
                      background: "#f0fdf4",
                      border: "2px solid #22c55e",
                      color: "#15803d",
                      boxShadow: "0 2px 0 #86efac",
                    }
                  : isWrong
                    ? {
                        background: "#fef2f2",
                        border: "2px solid #f87171",
                        color: "#dc2626",
                        boxShadow: "0 2px 0 #fca5a5",
                      }
                    : isSelected
                      ? {
                          background: "#eff6ff",
                          border: "2px solid #3b82f6",
                          color: "#1d4ed8",
                          boxShadow: "0 2px 0 #bfdbfe",
                        }
                      : {
                          background: "#f8fafc",
                          border: "2px solid #e2e8f0",
                          color: "#475569",
                          boxShadow: "0 2px 0 #e2e8f0",
                        }
              }
            >
              <span
                className="w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{
                  background: isCorrect
                    ? "#22c55e"
                    : isWrong
                      ? "#ef4444"
                      : isSelected
                        ? "#3b82f6"
                        : "#e2e8f0",
                  color:
                    isCorrect || isWrong || isSelected ? "#fff" : "#64748b",
                }}
              >
                {letter}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: "2px solid #f8fafc" }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSidebar("explain")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
            style={{
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              color: "#b45309",
              boxShadow: "0 2px 0 #fde68a",
            }}
          >
            <Lightbulb size={12} strokeWidth={2.5} />
            Explain
          </button>
          <button
            onClick={() => onSidebar("report")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
            style={{
              background: "#fef2f2",
              border: "1.5px solid #fecaca",
              color: "#dc2626",
              boxShadow: "0 2px 0 #fecaca",
            }}
          >
            <Flag size={12} strokeWidth={2.5} />
            Report
          </button>
        </div>
        <button
          onClick={() => setBookmarked((p) => !p)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={
            bookmarked
              ? {
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  color: "#ea580c",
                }
              : {
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  color: "#94a3b8",
                }
          }
        >
          <Bookmark
            size={14}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>
    </div>
  );
}

function SessionNavButton({
  onClick,
  disabled,
  children,
  ariaLabel,
  variant = "neutral",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  ariaLabel: string;
  variant?: "neutral" | "primary" | "danger" | "ai";
}) {
  const styles = {
    neutral: {
      background: "#fff",
      border: "2px solid #e2e8f0",
      color: "#64748b",
      boxShadow: "0 2px 0 #e2e8f0",
    },
    primary: {
      background: "#58CC02",
      border: "2px solid #46A302",
      color: "#fff",
      boxShadow: "0 3px 0 #46A302",
    },
    danger: {
      background: "#fff",
      border: "2px solid #fecaca",
      color: "#dc2626",
      boxShadow: "0 2px 0 #fecaca",
    },
    ai: {
      background: "#f5f3ff",
      border: "2px solid #ddd6fe",
      color: "#6d28d9",
      boxShadow: "0 2px 0 #ddd6fe",
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5"
      style={styles}
    >
      {children}
    </button>
  );
}

function LessonQuestionView({
  q,
  onAnswer,
}: {
  q: (typeof SAMPLE_QUESTIONS)[0];
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const citations = "citations" in q ? q.citations : [];

  const pickOption = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    onAnswer(index === q.answer);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="text-xs font-bold text-slate-500">{q.subject}</span>
        <button
          onClick={() => setBookmarked((prev) => !prev)}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={
            bookmarked
              ? {
                  background: "#fff7ed",
                  border: "2px solid #fed7aa",
                  color: "#ea580c",
                }
              : {
                  background: "#f8fafc",
                  border: "2px solid #e2e8f0",
                  color: "#94a3b8",
                }
          }
        >
          <Bookmark
            size={18}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-snug">
        {q.text}
      </h2>

      <div className="flex flex-col gap-3 mb-6">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = answered && i === q.answer;
          const isWrong = answered && isSelected && i !== q.answer;
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pickOption(i)}
              className="w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm md:text-base transition-all active:scale-[0.99] disabled:cursor-default"
              style={
                isCorrect
                  ? {
                      background: "#f0fdf4",
                      borderColor: "#22c55e",
                      color: "#15803d",
                      boxShadow: "0 3px 0 #86efac",
                    }
                  : isWrong
                    ? {
                        background: "#fef2f2",
                        borderColor: "#f87171",
                        color: "#dc2626",
                        boxShadow: "0 3px 0 #fca5a5",
                      }
                    : isSelected
                      ? {
                          background: "#eff6ff",
                          borderColor: "#3b82f6",
                          color: "#1d4ed8",
                          boxShadow: "0 3px 0 #bfdbfe",
                        }
                      : {
                          background: "#fff",
                          borderColor: "#e2e8f0",
                          color: "#334155",
                          boxShadow: "0 3px 0 #e2e8f0",
                        }
              }
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className="rounded-2xl p-5 md:p-6 mb-4 space-y-4"
          style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}
        >
          <p className="text-sm font-black uppercase tracking-widest text-green-700">
            Explanation
          </p>
          <p className="text-base md:text-lg font-medium text-green-950 leading-relaxed">
            {q.explanation}
          </p>
          {citations.length > 0 && (
            <CitationList
              id={`citation-list-q${q.id}`}
              citations={citations}
              variant="stacked"
            />
          )}
        </div>
      )}
    </div>
  );
}


function SessionSlideShell({
  children,
  onSkip,
  onContinue,
  continueLabel,
}: {
  children: ReactNode;
  onSkip: () => void;
  onContinue: () => void;
  continueLabel: string;
}) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <div
        className="flex-shrink-0 border-t border-slate-200 bg-white -mx-4 px-4 py-4 mt-auto"
        style={{ borderTopWidth: "2px" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onSkip}
            className="px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-wide text-slate-400 border-2 border-slate-200 bg-white"
          >
            Skip
          </button>
          <button
            onClick={onContinue}
            className="px-10 py-3 rounded-2xl text-sm font-black uppercase tracking-wide text-white active:translate-y-0.5"
            style={{
              background: "#58CC02",
              border: "2px solid #46A302",
              boxShadow: "0 4px 0 #46A302",
            }}
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ s }: { s: (typeof SAMPLE_SUMMARIES)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const preview = s.bullets.slice(0, 2);
  const rest = s.bullets.slice(2);

  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "2px solid #f8fafc" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-black px-2.5 py-1 rounded-xl"
            style={{
              background: "#f5f3ff",
              color: "#7c3aed",
              border: "1.5px solid #ddd6fe",
            }}
          >
            {s.subject}
          </span>
          <span
            className="text-xs font-black px-2 py-0.5 rounded-lg"
            style={{
              background: "#fef9c3",
              color: "#a16207",
              border: "1.5px solid #fde68a",
            }}
          >
            {s.tag}
          </span>
        </div>
        <button
          onClick={() => setBookmarked((p) => !p)}
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ color: bookmarked ? "#ea580c" : "#94a3b8" }}
        >
          <Bookmark
            size={13}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <div className="px-4 pt-3 pb-1">
        <p className="font-black text-slate-900 text-base mb-3">{s.title}</p>
        <ul className="space-y-2">
          {preview.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm font-medium text-slate-700">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: "#7c3aed" }}
              />
              {b}
            </li>
          ))}
          {expanded &&
            rest.map((b, i) => (
              <li
                key={i + 2}
                className="flex gap-2 text-sm font-medium text-slate-700"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: "#7c3aed" }}
                />
                {b}
              </li>
            ))}
        </ul>
      </div>

      {rest.length > 0 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1 mx-4 my-2.5 text-xs font-black transition-colors"
          style={{ color: "#7c3aed" }}
        >
          {expanded ? (
            <>
              <ChevronUp size={13} strokeWidth={3} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={13} strokeWidth={3} />+{rest.length} more points
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ImageCard({ img }: { img: (typeof SAMPLE_IMAGES)[0] }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div
        className="w-full aspect-square flex items-center justify-center relative"
        style={{ background: img.gradient }}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-white/40">
            <Image size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <p className="text-xs font-bold text-white/80">Medical Diagram</p>
        </div>
        <span
          className="absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.9)",
            color: "#1d4ed8",
            border: "1.5px solid #bfdbfe",
          }}
        >
          {img.subject}
        </span>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked((p) => !p)}
            className="flex items-center gap-1 text-xs font-black transition-all"
            style={{ color: liked ? "#ef4444" : "#94a3b8" }}
          >
            <Heart size={18} strokeWidth={2} fill={liked ? "#ef4444" : "none"} />
          </button>
        </div>
        <button
          onClick={() => setBookmarked((p) => !p)}
          style={{ color: bookmarked ? "#ea580c" : "#94a3b8" }}
        >
          <Bookmark
            size={18}
            strokeWidth={2}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <div className="px-4 pb-4">
        <span
          className="text-xs font-black px-2 py-0.5 rounded-lg mr-2"
          style={{ background: "#f0fdf4", color: "#16a34a" }}
        >
          {img.tag}
        </span>
        <span className="text-sm font-medium text-slate-700">{img.caption}</span>
      </div>
    </div>
  );
}

function FlashCard({ card }: { card: (typeof SAMPLE_FLASHCARDS)[0] }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="mb-3 cursor-pointer"
      onClick={() => setFlipped((p) => !p)}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full transition-all duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "160px",
        }}
      >
        <div
          className="absolute inset-0 rounded-3xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
            border: "2px solid #bfdbfe",
            boxShadow: "0 3px 0 #bfdbfe",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-black px-2.5 py-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.8)", color: "#1d4ed8" }}
            >
              {card.subject}
            </span>
            <span className="text-xs font-bold text-blue-400">Tap to reveal</span>
          </div>
          <p className="text-sm font-bold text-blue-900 leading-relaxed mt-3">
            {card.front}
          </p>
          <div className="flex justify-end mt-2">
            <RotateCcw size={14} className="text-blue-400" strokeWidth={2.5} />
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-3xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
            border: "2px solid #86efac",
            boxShadow: "0 3px 0 #86efac",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-black px-2.5 py-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.8)", color: "#15803d" }}
            >
              {card.subject}
            </span>
            <span className="text-xs font-bold text-green-500">Answer</span>
          </div>
          <p className="text-sm font-bold text-green-900 leading-relaxed mt-3">
            {card.back}
          </p>
          <div className="flex gap-2 mt-3">
            {["Again", "Hard", "Good", "Easy"].map((label, i) => {
              const colors = [
                ["#fee2e2", "#ef4444", "#fca5a5"],
                ["#fff7ed", "#f97316", "#fed7aa"],
                ["#eff6ff", "#3b82f6", "#bfdbfe"],
                ["#f0fdf4", "#22c55e", "#86efac"],
              ] as const;
              return (
                <button
                  key={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(false);
                  }}
                  className="flex-1 py-1.5 rounded-xl text-xs font-black transition-all"
                  style={{
                    background: colors[i][0],
                    color: colors[i][1],
                    border: `1.5px solid ${colors[i][2]}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetContent({
  tab,
  onSidebar,
}: {
  tab: string;
  onSidebar: (m: SidebarMode, text?: string) => void;
}) {
  if (tab === "questions")
    return (
      <>
        {SAMPLE_QUESTIONS.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            onSidebar={(m) => onSidebar(m, q.text)}
          />
        ))}
      </>
    );
  if (tab === "summary")
    return (
      <>
        {SAMPLE_SUMMARIES.map((s) => (
          <SummaryCard key={s.id} s={s} />
        ))}
      </>
    );
  if (tab === "images")
    return (
      <>
        {SAMPLE_IMAGES.map((img) => (
          <ImageCard key={img.id} img={img} />
        ))}
      </>
    );
  if (tab === "flashcards")
    return (
      <>
        {SAMPLE_FLASHCARDS.map((c) => (
          <FlashCard key={c.id} card={c} />
        ))}
      </>
    );
  return null;
}

function TabContent({
  tab,
  onOpenSet,
  search,
  filters,
}: {
  tab: string;
  onOpenSet: (s: StudySet) => void;
  search: string;
  filters: BrowseFilters;
}) {
  if (tab === "library") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
          <BookOpen size={28} className="text-slate-300" strokeWidth={1.5} />
        </div>
        <p className="text-base font-black text-slate-700 mb-1">
          Library coming soon
        </p>
        <p className="text-sm text-slate-400 font-medium">
          Your saved materials will appear here.
        </p>
      </div>
    );
  }

  const sets = filterSets(SETS_BY_TAB[tab] ?? [], search, filters);
  const sectionLabel = TAB_SET_LABEL[tab] ?? "sets";
  return (
    <>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
        {sets.length} {sectionLabel}
        {search.trim() ? ` matching "${search.trim()}"` : ""}
      </p>
      {sets.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="font-black text-slate-600 mb-1">No sets found</p>
          <p className="text-sm text-slate-400 font-medium">
            Try a different search term or clear filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sets.map((set) => (
            <SetCard key={set.id} set={set} tab={tab} onOpen={() => onOpenSet(set)} />
          ))}
        </div>
      )}
    </>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <div
        className="flex items-center justify-between px-4 h-14 flex-shrink-0"
        style={{ borderBottom: "3px solid #e2e8f0" }}
      >
        <div className="flex items-center gap-2">
          <Crown size={18} strokeWidth={2.5} style={{ color: "#a855f7" }} />
          <span className="font-black text-slate-900 text-base">Upgrade</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
        >
          <X size={15} strokeWidth={2.5} className="text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6 text-center">
          <div
            className="w-14 h-14 rounded-3xl mx-auto mb-3 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#a855f7,#7c3aed)",
              boxShadow: "0 4px 0 #6d28d9",
            }}
          >
            <Crown size={26} strokeWidth={2} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-1">
            Go Pro, Study Smarter
          </h2>
          <p className="text-sm font-medium text-slate-400 mb-6">
            Unlimited access to everything in Drnote
          </p>
          <div className="flex items-center justify-center mb-6">
            <div
              className="flex p-1 rounded-2xl gap-1"
              style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
            >
              {(["monthly", "yearly"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className="px-5 py-2 rounded-xl font-black text-sm transition-all capitalize"
                  style={
                    billing === b
                      ? {
                          background: "#7c3aed",
                          color: "#fff",
                          boxShadow: "0 2px 0 #6d28d9",
                        }
                      : { color: "#94a3b8" }
                  }
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <button
            className="w-full py-3 rounded-2xl font-black text-sm text-white"
            style={{
              background: "linear-gradient(135deg,#a855f7,#7c3aed)",
              border: "2px solid #6d28d9",
              boxShadow: "0 3px 0 #6d28d9",
            }}
          >
            Upgrade to Pro — {billing === "yearly" ? "$6.99/mo" : "$9.99/mo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HeaderPopover({
  onClose,
  anchor,
  caretClassName,
  children,
}: {
  onClose: () => void;
  anchor: "streak" | "daily";
  caretClassName: string;
  children: ReactNode;
}) {
  const positionClass =
    anchor === "streak"
      ? "right-28 md:right-36"
      : "right-16 md:right-24";

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/10" />
      <div
        className={`absolute top-24 ${positionClass} w-[280px] max-w-[calc(100vw-1rem)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-[-5px] flex justify-center">
          <div
            className={`h-2.5 w-2.5 rotate-45 border-l border-t ${caretClassName}`}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

function StatsPopup({
  streak,
  onClose,
}: {
  streak: number;
  onClose: () => void;
}) {
  const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();

  return (
    <HeaderPopover onClose={onClose} anchor="streak" caretClassName="border-orange-300 bg-[#ff9600]">
      <div
        className="overflow-hidden rounded-2xl p-4 text-white"
        style={{ background: "#ff9600", boxShadow: "0 8px 24px rgba(255,150,0,0.28)" }}
      >
        <div className="mb-4 flex items-center gap-3">
          <Flame size={28} strokeWidth={2.5} className="shrink-0 text-white" fill="white" />
          <div>
            <p className="text-xl font-extrabold leading-tight">{streak} day streak</p>
            <p className="text-xs font-semibold text-white/90">
              Keep studying daily to maintain it
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-3">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekLabels.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="text-[10px] font-bold text-slate-400"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {weekLabels.map((label, index) => {
              const active = index === today;
              return (
                <div key={`dot-${label}-${index}`} className="flex justify-center">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: active ? "#ff9600" : "#e5e7eb" }}
                  >
                    {active && (
                      <Check size={14} strokeWidth={3} className="text-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </HeaderPopover>
  );
}

function DailyPopup({
  used,
  limit,
  onUpgrade,
  onClose,
}: {
  used: number;
  limit: number;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const remaining = limit - used;
  const heartSlots = 5;
  const filledHearts = Math.max(
    0,
    Math.min(heartSlots, Math.ceil(remaining / (limit / heartSlots)))
  );

  return (
    <HeaderPopover onClose={onClose} anchor="daily" caretClassName="border-slate-200 bg-white">
      <div
        className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4"
        style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.1)" }}
      >
        <p className="mb-3 text-center text-base font-extrabold text-slate-700">
          Daily questions
        </p>

        <div className="mb-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: heartSlots }).map((_, index) => (
            <Heart
              key={index}
              size={22}
              strokeWidth={2}
              className={index < filledHearts ? "text-[#ff4b4b]" : "text-slate-200"}
              fill={index < filledHearts ? "#ff4b4b" : "none"}
            />
          ))}
        </div>

        <p className="mb-1 text-center text-sm font-bold text-slate-700">
          {remaining > 0 ? (
            <>
              <span className="text-[#ff4b4b]">{remaining}</span> left today
            </>
          ) : (
            "Limit reached"
          )}
        </p>
        <p className="mb-4 text-center text-xs font-medium text-slate-400">
          {remaining > 0 ? "You still have questions left." : "Come back tomorrow."}
        </p>

        <button
          type="button"
          onClick={() => {
            onClose();
            onUpgrade();
          }}
          className="mb-2 w-full rounded-xl border-2 border-b-4 border-violet-200 bg-violet-50 py-2.5 text-xs font-extrabold uppercase tracking-wide text-violet-700 active:translate-y-0.5 active:border-b-2"
        >
          Unlimited questions
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-1.5 text-xs font-bold text-slate-400"
        >
          Maybe later
        </button>
      </div>
    </HeaderPopover>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: string; label: string }[] | string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  const items = options.map((o) =>
    typeof o === "string" ? { id: o, label: o } : o
  );

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3 px-1">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        {selected.size > 0 && (
          <span
            className="text-xs font-black px-2 py-0.5 rounded-full"
            style={{ background: "#e8fde7", color: "#3a9e00" }}
          >
            {selected.size}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all"
              style={
                active
                  ? {
                      background: "#58CC02",
                      borderColor: "#46A302",
                      color: "#fff",
                      boxShadow: "0 3px 0 #46A302",
                    }
                  : {
                      background: "#fff",
                      borderColor: "#e2e8f0",
                      color: "#64748b",
                      boxShadow: "0 3px 0 #e2e8f0",
                    }
              }
            >
              {active && <Check size={12} strokeWidth={3} />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActiveFilterPills({
  subjects,
  statuses,
  tags,
  onRemoveSubject,
  onRemoveStatus,
  onRemoveTag,
  onClearAll,
}: {
  subjects: Set<string>;
  statuses: Set<string>;
  tags: Set<string>;
  onRemoveSubject: (v: string) => void;
  onRemoveStatus: (v: string) => void;
  onRemoveTag: (v: string) => void;
  onClearAll: () => void;
}) {
  const total = subjects.size + statuses.size + tags.size;
  if (total === 0) return null;

  const pills = [
    ...[...subjects].map((v) => ({
      label: v,
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      onRemove: () => onRemoveSubject(v),
    })),
    ...[...statuses].map((v) => {
      const s = STATUSES.find((st) => st.id === v);
      return {
        label: s?.label ?? v,
        color: "#7c3aed",
        bg: "#f5f3ff",
        border: "#ddd6fe",
        onRemove: () => onRemoveStatus(v),
      };
    }),
    ...[...tags].map((v) => ({
      label: v,
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
      onRemove: () => onRemoveTag(v),
    })),
  ];

  return (
    <div className="pb-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {pills.map((pill, i) => (
          <div
            key={i}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0"
            style={{
              background: pill.bg,
              border: `1.5px solid ${pill.border}`,
              color: pill.color,
            }}
          >
            {pill.label}
            <button onClick={pill.onRemove} className="ml-0.5 hover:opacity-70">
              <X size={10} strokeWidth={3} />
            </button>
          </div>
        ))}
        <button
          onClick={onClearAll}
          className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-xl"
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            border: "1.5px solid #fecaca",
          }}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

function FilterPage({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (s: Set<string>, st: Set<string>, t: Set<string>) => void;
}) {
  const [subjects, setSubjects] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<Set<string>>(new Set());

  const toggle = (
    setter: Dispatch<SetStateAction<Set<string>>>,
    val: string
  ) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });

  const totalActive = subjects.size + statuses.size + tags.size;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="bg-white" style={{ borderBottom: "3px solid #e2e8f0" }}>
        <div className={`${PAGE_SHELL} h-16 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
            >
              <ArrowLeft size={17} strokeWidth={2.5} />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900">Filters</h2>
              {totalActive > 0 && (
                <p
                  className="text-xs font-bold -mt-0.5"
                  style={{ color: "#58CC02" }}
                >
                  {totalActive} selected
                </p>
              )}
            </div>
          </div>
          {totalActive > 0 && (
            <button
              onClick={() => {
                setSubjects(new Set());
                setStatuses(new Set());
                setTags(new Set());
              }}
              className="text-sm font-bold px-3 py-1.5 rounded-xl"
              style={{ color: "#dc2626", background: "#fee2e2" }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className={`${PAGE_SHELL} py-6`}>
          <ChipGroup
            label="Subject"
            options={SUBJECTS}
            selected={subjects}
            onToggle={(v) => toggle(setSubjects, v)}
          />
          <ChipGroup
            label="Status"
            options={STATUSES}
            selected={statuses}
            onToggle={(v) => toggle(setStatuses, v)}
          />
          <ChipGroup
            label="Tags"
            options={TAGS}
            selected={tags}
            onToggle={(v) => toggle(setTags, v)}
          />
        </div>
      </div>
      <div className="bg-white py-4" style={{ borderTop: "3px solid #e2e8f0" }}>
        <div className={PAGE_SHELL}>
          <button
            onClick={() => {
              onApply(new Set(subjects), new Set(statuses), new Set(tags));
              onClose();
            }}
            className="w-full text-white font-black py-4 rounded-2xl text-base"
            style={{
              background: "#58CC02",
              border: "2px solid #46A302",
              boxShadow: "0 4px 0 #46A302",
            }}
          >
            {totalActive > 0
              ? `Apply ${totalActive} Filter${totalActive !== 1 ? "s" : ""}`
              : "Show All"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaginationBar({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-white py-3"
      style={{ borderTop: "3px solid #e2e8f0" }}
    >
      <div className={`${PAGE_SHELL} flex items-center justify-between gap-2`}>
        <button
          onClick={() => page > 1 && onChange(page - 1)}
          disabled={page === 1}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black disabled:opacity-30"
          style={{
            background: "#f1f5f9",
            border: "2px solid #e2e8f0",
            boxShadow: "0 3px 0 #e2e8f0",
            color: "#475569",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="w-9 h-9 rounded-xl font-black text-sm flex-shrink-0"
              style={
                p === page
                  ? {
                      background: "#58CC02",
                      border: "2px solid #46A302",
                      boxShadow: "0 3px 0 #46A302",
                      color: "#fff",
                    }
                  : {
                      background: "#fff",
                      border: "2px solid #e2e8f0",
                      boxShadow: "0 3px 0 #e2e8f0",
                      color: "#64748b",
                    }
              }
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => page < total && onChange(page + 1)}
          disabled={page === total}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black disabled:opacity-30"
          style={{
            background: "#f1f5f9",
            border: "2px solid #e2e8f0",
            boxShadow: "0 3px 0 #e2e8f0",
            color: "#475569",
          }}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function DrNoteApp({
  examId,
  tab: activeTab,
}: {
  examId: string;
  tab: ContentTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [statsOpen, setStatsOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [browseFilters, setBrowseFilters] = useState<BrowseFilters>({
    subjects: [],
    statuses: [],
    tags: [],
  });

  useEffect(() => {
    saveCurrentExamId(examId);
  }, [examId]);

  useEffect(() => {
    setBrowseFilters(loadBrowseFilters());
  }, [pathname]);

  const totalFilters = countBrowseFilters(browseFilters);

  const streak = 14;
  const dailyRemaining = DAILY_LIMIT - DAILY_USED;

  return (
    <div className="min-h-screen bg-white font-sans pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <BrowseHeader
        search={search}
        setSearch={setSearch}
        activeTab={activeTab}
        onTabChange={(tab) => router.push(examTabPath(examId, tab))}
        totalFilters={totalFilters}
        streak={streak}
        dailyRemaining={dailyRemaining}
        onStatsOpen={() => setStatsOpen(true)}
        onDailyOpen={() => setDailyOpen(true)}
        onUpgradeOpen={() => router.push(UPGRADE_PATH)}
        onFilterOpen={() => router.push(filtersPath(examId))}
      />

      <main className={`${PAGE_SHELL} py-4`}>
        <TabContent
          tab={activeTab}
          search={search}
          filters={browseFilters}
          onOpenSet={(s) => router.push(setPath(examId, activeTab, s.id))}
        />
      </main>

      <FilterFab
        hidden={totalFilters > 0}
        onClick={() => router.push(filtersPath(examId))}
      />

      <BottomTabBar />

      {statsOpen && (
        <StatsPopup streak={14} onClose={() => setStatsOpen(false)} />
      )}
      {dailyOpen && (
        <DailyPopup
          used={DAILY_USED}
          limit={DAILY_LIMIT}
          onUpgrade={() => {
            setDailyOpen(false);
            router.push(UPGRADE_PATH);
          }}
          onClose={() => setDailyOpen(false)}
        />
      )}
    </div>
  );
}
