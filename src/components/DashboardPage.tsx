"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, GraduationCap, Plus } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { saveCurrentExamId } from "@/lib/current-exam";
import { DASHBOARD_PATH, HOME_PATH, examPath } from "@/lib/routes";
import { getTileColors } from "@/lib/tile-colors";
import { getUserExams } from "@/lib/user-exams";
import type { Exam } from "@/lib/exams";

function DashboardHeader() {
  return (
    <header className="flex items-center justify-between py-4">
      <Link href={HOME_PATH} className="flex min-w-0 items-center">
        <DrNoteLogo showWordmark forceWordmark />
      </Link>
      <UserAuthControls />
    </header>
  );
}

function DashboardExamCard({ exam }: { exam: Exam }) {
  const { bg, border } = getTileColors(exam.name);

  return (
    <Link
      href={examPath(exam.id)}
      onClick={() => saveCurrentExamId(exam.id)}
      className="group flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-slate-50 active:translate-y-0.5 active:border-b-2"
    >
      <div
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4"
        style={{ background: bg, borderColor: border }}
      >
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
        className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
      />
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    setExams(getUserExams());
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <DashboardHeader />

      <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-slate-50 px-6 py-8 sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">
          <GraduationCap size={14} strokeWidth={2.5} />
          Your exams
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          Jump back into the exams you&apos;re studying
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {exams.map((exam) => (
          <DashboardExamCard key={exam.id} exam={exam} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push(HOME_PATH)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-extrabold text-slate-500 transition-colors hover:border-slate-700 hover:bg-slate-50 hover:text-slate-700"
      >
        <Plus size={18} strokeWidth={3} />
        Add exam from home
      </button>
    </main>
  );
}
