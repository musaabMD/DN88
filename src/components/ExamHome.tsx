"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, GraduationCap, Search } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { PricingModal } from "@/components/PricingModal";
import { UserAuthControls } from "@/components/UserAuthControls";
import { EXAMS, type Exam } from "@/lib/exams";
import { examPath } from "@/lib/routes";
import { getTileColors } from "@/lib/tile-colors";

function ExamHomeHeader({ onPricing }: { onPricing: () => void }) {
  return (
    <header className="flex items-center justify-between py-4">
      <Link href="/" className="flex min-w-0 items-center">
        <DrNoteLogo showWordmark />
      </Link>

      <nav className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onPricing}
          className="text-sm font-extrabold text-slate-400 transition-colors hover:text-slate-700"
        >
          Pricing
        </button>
        <button
          type="button"
          onClick={onPricing}
          className="rounded-xl border-b-4 border-[#46A302] bg-[#58CC02] px-3 py-2 text-sm font-extrabold text-white transition-colors hover:bg-[#4db802] active:translate-y-0.5 active:border-b-2 sm:px-4"
        >
          Get Pro
        </button>
        <UserAuthControls compact />
      </nav>
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
    <div className="relative overflow-hidden rounded-3xl border-b-4 border-[#46A302] bg-[#58CC02] px-6 py-8 sm:px-10 sm:py-10">
      <span
        aria-hidden="true"
        className="absolute -top-6 right-8 select-none text-8xl font-black text-white opacity-10"
      >
        A
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-10 right-32 hidden select-none text-9xl font-black text-white opacity-10 sm:block"
      >
        Q
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-8 -left-4 select-none text-8xl font-black text-white opacity-10"
      >
        ?
      </span>

      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#46A302] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
          <GraduationCap size={14} strokeWidth={2.5} />
          Exam prep
        </div>

        <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl">
          Which exam are you
          <br />
          studying for?
        </h1>

        <div className="mt-6 flex max-w-md items-center gap-3 rounded-2xl border-b-4 border-[#3a8200] bg-white px-4 py-3">
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

function ExamCard({ exam }: { exam: Exam }) {
  const { bg, border } = getTileColors(exam.name);

  return (
    <Link
      href={examPath(exam.id)}
      className="group flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50 active:translate-y-0.5 active:border-b-2"
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

      <h3 className="min-w-0 flex-1 truncate text-base font-extrabold tracking-tight text-slate-700">
        {exam.name}
      </h3>

      <ChevronRight
        size={20}
        strokeWidth={3}
        className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#58CC02]"
      />
    </Link>
  );
}

export default function ExamHome() {
  const [query, setQuery] = useState("");
  const [showPricing, setShowPricing] = useState(false);

  const filtered = EXAMS.filter((exam) =>
    exam.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <ExamHomeHeader onPricing={() => setShowPricing(true)} />

      <ExamHero query={query} onQuery={setQuery} />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
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

      {showPricing ? <PricingModal onClose={() => setShowPricing(false)} /> : null}
    </main>
  );
}
