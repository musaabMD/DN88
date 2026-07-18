"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { useDrNoteAccess } from "@/hooks/useDrNoteAccess";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { HOME_PATH, UPGRADE_PATH } from "@/lib/routes";

function QbankLocked({ signedIn }: { signedIn: boolean }) {
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 text-white">
          <Lock size={28} strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Qbank</h1>
        <p className="mt-2 max-w-sm text-sm font-bold leading-relaxed text-slate-500">
          {signedIn
            ? "Upgrade to Student or Pro to unlock practice questions, flashcards, and full exam sets."
            : "Sign in and choose a plan to access the question bank."}
        </p>
        <Link
          href={signedIn ? UPGRADE_PATH : HOME_PATH}
          className="mt-8 rounded-xl border-b-4 border-indigo-800 bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-indigo-500"
        >
          {signedIn ? "View plans" : "Go to home"}
        </Link>
      </div>
    </main>
  );
}

export function QbankAccessGate({ children }: { children: ReactNode }) {
  const mounted = useClientMounted();
  const clerkEnabled = useClerkEnabled();
  const access = useDrNoteAccess();

  if (!mounted || access.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm font-extrabold text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!clerkEnabled || !access.canUseQbank) {
    return <QbankLocked signedIn={access.isSignedIn} />;
  }

  return <>{children}</>;
}
