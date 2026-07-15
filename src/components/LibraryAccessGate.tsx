"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@clerk/clerk-react";
import { LockKeyhole } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { HOME_PATH } from "@/lib/routes";
import { isLibraryOwnerEmail } from "@/lib/library-access";

function LibraryUnavailable({
  loading = false,
  email,
}: {
  loading?: boolean;
  email?: string;
}) {
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
        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
          Library temporarily unavailable
        </h1>
        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">
          We are fixing the library right now. It is hidden from visitors and
          other accounts until it is ready.
        </p>
        {email ? (
          <p className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500">
            Signed in as {email}
          </p>
        ) : null}
        {loading ? (
          <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Checking access...
          </p>
        ) : null}
      </section>
    </main>
  );
}

function ClerkLibraryGate({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;

  if (!isLoaded) return <LibraryUnavailable loading />;
  if (!isLibraryOwnerEmail(email)) return <LibraryUnavailable email={email} />;

  return <>{children}</>;
}

export function LibraryAccessGate({ children }: { children: ReactNode }) {
  const mounted = useClientMounted();
  const clerkEnabled = useClerkEnabled();

  if (!mounted) return <LibraryUnavailable loading />;
  if (!clerkEnabled) return <LibraryUnavailable />;

  return <ClerkLibraryGate>{children}</ClerkLibraryGate>;
}
