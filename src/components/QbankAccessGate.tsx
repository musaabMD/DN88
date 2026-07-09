"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { isQbankOwnerEmail } from "@/lib/qbank-access";
import { HOME_PATH } from "@/lib/routes";

function ClerkQbankGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;
  const allowed = isLoaded && isQbankOwnerEmail(email);

  useEffect(() => {
    if (isLoaded && !allowed) {
      router.replace(HOME_PATH);
    }
  }, [allowed, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm font-extrabold text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-sm font-extrabold text-slate-500">
          Qbank is coming soon — redirecting…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Blocks Qbank routes unless signed in as the owner email. */
export function QbankAccessGate({ children }: { children: ReactNode }) {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !clerkEnabled) {
      router.replace(HOME_PATH);
    }
  }, [mounted, clerkEnabled, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm font-extrabold text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!clerkEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-sm font-extrabold text-slate-500">
          Qbank is coming soon — redirecting…
        </p>
      </div>
    );
  }

  return <ClerkQbankGate>{children}</ClerkQbankGate>;
}
