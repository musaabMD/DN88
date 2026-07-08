"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useClientMounted, useClerkEnabled } from "@/hooks/useClerkEnabled";
import { DASHBOARD_PATH } from "@/lib/routes";

function GuestAuthControls({ compact = false }: { compact?: boolean }) {
  return (
    <span className="text-xs font-bold text-[#AFAFAF]">
      {compact ? "Guest" : "Guest mode"}
    </span>
  );
}

function ClerkUserAuthControls({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <SignedIn>
        {!compact && (
          <Link
            href={DASHBOARD_PATH}
            className="hidden max-w-[120px] truncate text-sm font-bold text-[#4B4B4B] hover:text-[#58CC02] sm:inline"
          >
            Dashboard
          </Link>
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
                ? "flex h-9 shrink-0 items-center rounded-lg bg-[#58CC02] px-3 text-xs font-extrabold text-white transition-colors hover:bg-[#46A302]"
                : "rounded-lg bg-[#58CC02] px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-[#46A302]"
            }
          >
            Get started
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
