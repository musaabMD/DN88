"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { useClientMounted, useClerkEnabled } from "@/hooks/useClerkEnabled";

function GuestAuthControls({ compact = false }: { compact?: boolean }) {
  return (
    <span className="text-xs font-bold text-[#AFAFAF]">
      {compact ? "Guest" : "Guest mode"}
    </span>
  );
}

function ClerkUserAuthControls({ compact = false }: { compact?: boolean }) {
  const { user } = useUser();

  return (
    <>
      <SignedIn>
        {!compact && (
          <span className="hidden max-w-[120px] truncate text-sm font-bold text-[#4B4B4B] sm:inline">
            {user?.firstName ?? user?.username ?? "Account"}
          </span>
        )}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            className={
              compact
                ? "flex h-9 shrink-0 items-center rounded-xl border-2 border-b-4 border-[#46A302] bg-[#58CC02] px-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white transition-all active:translate-y-0.5 active:border-b-2"
                : "rounded-xl border-2 border-b-4 border-[#46A302] bg-[#58CC02] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all active:translate-y-[2px] active:border-b-2"
            }
          >
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}

export function UserAuthControls({ compact = false }: { compact?: boolean }) {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();

  if (!mounted || !clerkEnabled) {
    return <GuestAuthControls compact={compact} />;
  }

  return <ClerkUserAuthControls compact={compact} />;
}
