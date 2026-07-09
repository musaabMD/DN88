"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@clerk/clerk-react";
import { FileQuestion, Lock } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { EXAMS } from "@/lib/exams";
import {
  isQbankOwnerEmail,
  saveQbankPreorder,
} from "@/lib/qbank-access";
import { HOME_PATH, LIBRARY_PATH } from "@/lib/routes";

function QbankComingSoon({ defaultEmail }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [examId, setExamId] = useState(EXAMS[0]?.id ?? "smle");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

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
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-white px-4 pb-14 sm:px-6">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4 sm:px-6">
          <Link href={HOME_PATH} className="flex min-w-0 items-center">
            <DrNoteLogo showWordmark forceWordmark />
          </Link>
          <UserAuthControls compact />
        </div>
      </header>
      <div className="h-[4.5rem] shrink-0" aria-hidden />

      <div className="mt-10 flex flex-1 flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-b-4 border-slate-700 bg-slate-700 text-white">
          <FileQuestion size={28} strokeWidth={2.5} />
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
          <Lock size={11} strokeWidth={3} /> Coming soon
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
          Qbank
        </h1>
        <p className="mt-2 max-w-sm text-sm font-bold leading-relaxed text-slate-500">
          Practice questions, notes, images, and flashcards by exam. Join the
          waitlist and we&apos;ll email you when it opens.
        </p>

        {done ? (
          <div className="mt-8 w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-5">
            <p className="text-base font-extrabold text-emerald-900">
              You&apos;re on the list
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              We saved your email and exam preference.
            </p>
            <Link
              href={LIBRARY_PATH}
              className="mt-4 inline-flex rounded-xl border-2 border-b-4 border-slate-700 bg-slate-700 px-4 py-2 text-sm font-extrabold text-white"
            >
              Browse Library
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 w-full space-y-3 text-left">
            <label className="block">
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
            <label className="block">
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
              Notify me at launch
            </button>
            <Link
              href={LIBRARY_PATH}
              className="block text-center text-sm font-extrabold text-slate-500 hover:text-slate-800"
            >
              Or browse Library now
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}

function ClerkQbankGate({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;
  const allowed = isLoaded && isQbankOwnerEmail(email);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm font-extrabold text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!allowed) {
    return <QbankComingSoon defaultEmail={email} />;
  }

  return <>{children}</>;
}

/** Shows Coming Soon for everyone except the owner email. No redirect. */
export function QbankAccessGate({ children }: { children: ReactNode }) {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm font-extrabold text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!clerkEnabled) {
    return <QbankComingSoon />;
  }

  return <ClerkQbankGate>{children}</ClerkQbankGate>;
}
