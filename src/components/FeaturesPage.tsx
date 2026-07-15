"use client";

import Link from "next/link";
import {
  FileQuestion,
  Filter,
  Monitor,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { QBANK_PATH } from "@/lib/routes";

const QBANK_FEATURES = [
  {
    icon: FileQuestion,
    title: "Exam practice",
    body: "Browse question sets by exam and drill the way you take boards.",
  },
  {
    icon: Filter,
    title: "Smart filters",
    body: "Narrow by subject, status, and difficulty so every session counts.",
  },
  {
    icon: Monitor,
    title: "Quiz modes",
    body: "Timed, quick, incorrect-only, and mock sessions when you are ready.",
  },
];

export function FeaturesPageClient() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <AppHeader showBack title="Features" showLibrary />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Features
        </h1>
        <p className="mt-2 max-w-xl text-sm font-bold leading-relaxed text-slate-500">
          Practice exams in Qbank, with filters and quiz modes built for study.
        </p>

        <ul className="mt-8 space-y-5" role="tabpanel">
          {QBANK_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h2 className="text-base font-extrabold text-slate-800">
                    {feature.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">
                    {feature.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href={QBANK_PATH}
          className="mt-10 inline-flex rounded-xl border-2 border-b-4 border-slate-800 bg-slate-800 px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-slate-700 active:translate-y-0.5 active:border-b-2"
        >
          Open Qbank
        </Link>
      </main>
    </div>
  );
}
