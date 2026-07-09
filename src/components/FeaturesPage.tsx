"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileQuestion,
  Filter,
  Highlighter,
  Library,
  Monitor,
  Search,
  Sparkles,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { LIBRARY_PATH, QBANK_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

type FeatureTab = "qbank" | "library";

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

const LIBRARY_FEATURES = [
  {
    icon: Library,
    title: "Specialty library",
    body: "Browse specialties and topics with clinical articles written for study.",
  },
  {
    icon: Sparkles,
    title: "Ask AI",
    body: "Ask follow-ups on any article and keep the chat with that topic.",
  },
  {
    icon: Highlighter,
    title: "Study modes",
    body: "Flip a section into Summary, Questions, Cards, or Present — one mode at a time.",
  },
  {
    icon: Search,
    title: "In-article search",
    body: "Jump straight to the paragraph you need without leaving the page.",
  },
];

export function FeaturesPageClient() {
  const [tab, setTab] = useState<FeatureTab>("library");
  const features = tab === "qbank" ? QBANK_FEATURES : LIBRARY_FEATURES;
  const ctaHref = tab === "qbank" ? QBANK_PATH : LIBRARY_PATH;
  const ctaLabel = tab === "qbank" ? "Open Qbank" : "Open Library";

  return (
    <div className="min-h-screen bg-white font-sans">
      <AppHeader showBack title="Features" showLibrary />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Features
        </h1>
        <p className="mt-2 max-w-xl text-sm font-bold leading-relaxed text-slate-500">
          Two products, one study flow — practice exams in Qbank, read and ask
          in Library.
        </p>

        <div
          className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1"
          role="tablist"
          aria-label="Product features"
        >
          {(
            [
              { id: "library", label: "Library", icon: BookOpen },
              { id: "qbank", label: "Qbank", icon: FileQuestion },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold transition-colors",
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon size={16} strokeWidth={2.5} />
                {item.label}
              </button>
            );
          })}
        </div>

        <ul className="mt-8 space-y-5" role="tabpanel">
          {features.map((feature) => {
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
          href={ctaHref}
          className="mt-10 inline-flex rounded-xl border-2 border-b-4 border-slate-800 bg-slate-800 px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-slate-700 active:translate-y-0.5 active:border-b-2"
        >
          {ctaLabel}
        </Link>
      </main>
    </div>
  );
}
