"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@clerk/clerk-react";
import { BookOpen, ChevronRight, FileQuestion, Lock } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { ProductSiteNav } from "@/components/ProductSiteNav";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { EXAMS } from "@/lib/exams";
import {
  hasQbankPreorder,
  isQbankOwnerEmail,
  saveQbankPreorder,
} from "@/lib/qbank-access";
import { isLibraryOwnerEmail } from "@/lib/library-access";
import {
  LIBRARY_PATH,
  QBANK_PATH,
  UPGRADE_PATH,
} from "@/lib/routes";
import { getTileColors } from "@/lib/tile-colors";

function ProductHomeHeader() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center">
            <DrNoteLogo showWordmark forceWordmark />
          </Link>

          <ProductSiteNav />
        </div>
      </header>
      <div className="h-[4.5rem] shrink-0" aria-hidden />
    </>
  );
}

function ProductCard({
  title,
  description,
  href,
  colorKey,
  icon: Icon,
  badge,
  locked,
  onClick,
}: {
  title: string;
  description: string;
  href?: string;
  colorKey: string;
  icon: typeof FileQuestion;
  badge?: string;
  locked?: boolean;
  onClick?: () => void;
}) {
  const { bg, border } = getTileColors(colorKey);

  const inner = (
    <>
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4"
        style={{ background: bg, borderColor: border }}
      >
        <Icon size={24} strokeWidth={2.5} className="relative text-white" />
        {locked ? (
          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-md bg-white/90 text-slate-700">
            <Lock size={12} strokeWidth={3} />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-800 sm:text-xl">
            {title}
          </h2>
          {badge ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-bold text-slate-400">{description}</p>
      </div>

      <ChevronRight
        size={22}
        strokeWidth={3}
        className="shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#334155]"
      />
    </>
  );

  const className =
    "group flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-5 text-left transition-colors duration-150 hover:bg-slate-50";

  if (href && !locked) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

function QbankPreorderPanel({
  onClose,
  defaultEmail,
}: {
  onClose: () => void;
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [examId, setExamId] = useState(EXAMS[0]?.id ?? "smle");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Enter a valid email");
      return;
    }
    saveQbankPreorder(trimmed, examId);
    setDone(true);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
              Qbank early access
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-900">
              Join the waitlist
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Tell us your email and exam — we&apos;ll notify you when Qbank opens.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-extrabold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        {done ? (
          <div className="mt-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
            <p className="text-base font-extrabold text-emerald-900">
              You&apos;re on the list
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              We saved your email and exam preference.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl border-2 border-b-4 border-slate-700 bg-slate-700 px-4 py-2 text-sm font-extrabold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-left">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
              />
            </label>
            <label className="block text-left">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                Exam
              </span>
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
              >
                {EXAMS.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </label>
            {error ? (
              <p className="text-sm font-bold text-red-500">{error}</p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-xl border-2 border-b-4 border-slate-700 bg-slate-700 px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-slate-600 active:translate-y-0.5 active:border-b-2"
            >
              Preorder notify me
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ProductHomeBody({
  canOpenQbank,
  canOpenLibrary,
  userEmail,
}: {
  canOpenQbank: boolean;
  canOpenLibrary: boolean;
  userEmail?: string;
}) {
  const [showPreorder, setShowPreorder] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    if (userEmail && hasQbankPreorder(userEmail)) setAlreadyJoined(true);
  }, [userEmail]);

  return (
    <>
      <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-4">
        {canOpenLibrary ? (
          <ProductCard
            title="Library"
            description="Browse specialties, topics, and clinical articles"
            href={LIBRARY_PATH}
            colorKey="Library"
            icon={BookOpen}
          />
        ) : null}
        <ProductCard
          title="Qbank"
          description={
            canOpenQbank
              ? "Private preview — open exam practice"
              : alreadyJoined
                ? "You're on the waitlist — we'll email you at launch"
                : "Coming soon — join the waitlist with your exam"
          }
          href={canOpenQbank ? QBANK_PATH : undefined}
          colorKey="Qbank"
          icon={FileQuestion}
          badge={canOpenQbank ? "Preview" : "Coming soon"}
          locked={!canOpenQbank}
          onClick={canOpenQbank ? undefined : () => setShowPreorder(true)}
        />
      </div>

      {showPreorder ? (
        <QbankPreorderPanel
          defaultEmail={userEmail}
          onClose={() => {
            setShowPreorder(false);
            if (userEmail && hasQbankPreorder(userEmail)) setAlreadyJoined(true);
          }}
        />
      ) : null}
    </>
  );
}

function ClerkGatedProducts() {
  const { user, isLoaded } = useUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;
  const canOpenQbank = isLoaded && isQbankOwnerEmail(email);
  const canOpenLibrary = isLoaded && isLibraryOwnerEmail(email);

  return (
    <ProductHomeBody
      canOpenQbank={canOpenQbank}
      canOpenLibrary={canOpenLibrary}
      userEmail={email}
    />
  );
}

export default function ProductHome() {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();

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
            Study medicine your way
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm font-bold text-slate-500 sm:text-base">
            Practice medicine questions with Qbank when it launches.
          </p>
        </div>
      </div>

      {mounted && clerkEnabled ? (
        <ClerkGatedProducts />
      ) : (
        <ProductHomeBody canOpenQbank={false} canOpenLibrary={false} />
      )}
    </main>
  );
}
