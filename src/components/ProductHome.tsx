"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, FileQuestion } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { DASHBOARD_PATH, LIBRARY_PATH, QBANK_PATH, UPGRADE_PATH } from "@/lib/routes";
import { getTileColors } from "@/lib/tile-colors";

function ProductHomeHeader() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between py-4">
      <Link href="/" className="flex min-w-0 items-center">
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

function ProductCard({
  title,
  description,
  href,
  letter,
  colorKey,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  letter: string;
  colorKey: string;
  icon: typeof FileQuestion;
}) {
  const { bg, border } = getTileColors(colorKey);

  return (
    <Link
      href={href}
      className="group flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-5 text-left transition-colors duration-150 hover:bg-slate-50"
    >
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4"
        style={{ background: bg, borderColor: border }}
      >
        <span
          aria-hidden="true"
          className="absolute -bottom-3 -right-1 select-none text-5xl font-black text-white opacity-20"
        >
          {letter}
        </span>
        <Icon size={24} strokeWidth={2.5} className="relative text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-800 sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-sm font-bold text-slate-400">{description}</p>
      </div>

      <ChevronRight
        size={22}
        strokeWidth={3}
        className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
      />
    </Link>
  );
}

export default function ProductHome() {
  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 pb-14 sm:px-6">
      <ProductHomeHeader />

      <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-slate-50 px-6 py-8 sm:px-10 sm:py-10">
        <span
          aria-hidden="true"
          className="absolute -top-6 right-8 select-none text-8xl font-black text-slate-200"
        >
          D
        </span>
        <span
          aria-hidden="true"
          className="absolute -bottom-8 -left-4 select-none text-8xl font-black text-slate-200"
        >
          ?
        </span>

        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
            What do you want to study?
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm font-bold text-slate-500 sm:text-base">
            Choose a product to get started
          </p>
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-4">
        <ProductCard
          title="Qbank"
          description="Practice questions, notes, images, and flashcards by exam"
          href={QBANK_PATH}
          letter="Q"
          colorKey="Qbank"
          icon={FileQuestion}
        />
        <ProductCard
          title="Library"
          description="Browse medical articles by specialty and topic"
          href={LIBRARY_PATH}
          letter="L"
          colorKey="Library"
          icon={BookOpen}
        />
      </div>
    </main>
  );
}
