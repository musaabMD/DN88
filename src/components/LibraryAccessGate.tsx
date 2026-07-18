"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { useDrNoteAccess } from "@/hooks/useDrNoteAccess";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { HOME_PATH } from "@/lib/routes";

function LibrarySignInPrompt() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={HOME_PATH} className="flex min-w-0 items-center">
            <DrNoteLogo showWordmark forceWordmark />
          </Link>
          <UserAuthControls compact />
        </div>
      </header>

      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-700">
          <LockKeyhole size={26} strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">Sign in to read</h1>
        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">
          The medical library is available to signed-in DrNote accounts.
        </p>
      </section>
    </main>
  );
}

export function LibraryAccessGate({ children }: { children: ReactNode }) {
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

  if (!clerkEnabled || !access.canUseLibrary) {
    return <LibrarySignInPrompt />;
  }

  return <>{children}</>;
}
