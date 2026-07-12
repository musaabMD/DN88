"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronRight, Plus, Search } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { ProductSiteNav } from "@/components/ProductSiteNav";
import {
  EXAM_CATEGORIES,
  EXAMS,
  formatExamCategory,
  type Exam,
  type ExamCategory,
} from "@/lib/exams";
import { saveCurrentExamId } from "@/lib/current-exam";
import { HOME_PATH, examPath } from "@/lib/routes";
import { getTileColors } from "@/lib/tile-colors";
import { addUserExam, getUserExamIds, isUserExam, removeUserExam } from "@/lib/user-exams";

function ExamHomeHeader() {
  return (
    <header className="flex items-center justify-between py-4">
      <Link href={HOME_PATH} className="flex min-w-0 items-center">
        <DrNoteLogo showWordmark forceWordmark />
      </Link>

      <ProductSiteNav showFeatures={false} />
    </header>
  );
}

function ExamHero({
  query,
  onQuery,
}: {
  query: string;
  onQuery: (value: string) => void;
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
        Q
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-8 -left-4 select-none text-8xl font-black text-slate-200"
      >
        ?
      </span>

      <div className="relative mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
          Choose your exam
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-bold text-slate-500 sm:text-base">
          Qbank — pick the test you&apos;re studying for and start practicing
        </p>

        <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-3">
          <Search size={20} strokeWidth={2.5} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search exams"
            className="w-full bg-transparent text-base font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border-2 px-4 py-2 text-sm font-bold"
      style={
        active
          ? {
              background: "#334155",
              borderColor: "#1e293b",
              color: "#fff",
            }
          : {
              background: "#fff",
              borderColor: "#e2e8f0",
              color: "#64748b",
            }
      }
    >
      {label}
    </button>
  );
}

function ExamCard({
  exam,
  added,
  onToggleAdd,
}: {
  exam: Exam;
  added: boolean;
  onToggleAdd: () => void;
}) {
  const { bg, border } = getTileColors(exam.name);

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50">
      <Link
        href={examPath(exam.id)}
        onClick={() => saveCurrentExamId(exam.id)}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4"
          style={{ background: bg, borderColor: border }}
        >
          <span
            aria-hidden="true"
            className="absolute -bottom-3 -right-1 select-none text-4xl font-black text-white opacity-20"
          >
            {exam.name.charAt(0)}
          </span>
          <span className="relative text-xl font-black text-white">
            {exam.name.charAt(0)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold tracking-tight text-slate-700">
            {exam.name}
          </h3>
          <p className="mt-0.5 truncate text-xs font-bold text-slate-400">
            {exam.country} · {formatExamCategory(exam.category)}
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
        onClick={(e) => {
          e.preventDefault();
          onToggleAdd();
        }}
        aria-label={added ? `${exam.name} added to dashboard` : `Add ${exam.name} to dashboard`}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-b-4 transition-colors active:translate-y-0.5 active:border-b-2 ${
          added
            ? "border-slate-700 bg-slate-700 text-white"
            : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700"
        }`}
      >
        {added ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
      </button>
    </div>
  );
}

export default function ExamHome() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExamCategory | "all">("all");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    setPinnedIds(getUserExamIds());
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = EXAMS.filter((exam) => {
    const matchesCategory = category === "all" || exam.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      exam.name,
      exam.country,
      exam.category,
      formatExamCategory(exam.category),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const toggleExam = (examId: string) => {
    if (isUserExam(examId)) {
      removeUserExam(examId);
    } else {
      addUserExam(examId);
    }
    setPinnedIds(getUserExamIds());
  };

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <ExamHomeHeader />

      <ExamHero query={query} onQuery={setQuery} />

      <div className="mt-6 flex flex-wrap gap-2">
        <CategoryChip
          label="All"
          active={category === "all"}
          onClick={() => setCategory("all")}
        />
        {EXAM_CATEGORIES.map((value) => (
          <CategoryChip
            key={value}
            label={formatExamCategory(value)}
            active={category === value}
            onClick={() => setCategory(value)}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            added={pinnedIds.includes(exam.id)}
            onToggleAdd={() => toggleExam(exam.id)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
          <p className="text-lg font-extrabold text-slate-700">No exams found</p>
          <p className="mt-1 text-sm font-bold text-slate-400">
            Try a different search term
          </p>
        </div>
      ) : null}
    </main>
  );
}
