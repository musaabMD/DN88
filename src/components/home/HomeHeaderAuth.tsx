"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { CreditsBadge } from "@/components/medgenius/CreditsUsage";
import { primaryNavButtonClass } from "@/components/ProductSiteNav";
import { useClientMounted, useClerkEnabled } from "@/hooks/useClerkEnabled";
import { useStudyStreak } from "@/hooks/useStudyStreak";
import {
  CLERK_SIGN_IN_URL,
  CLERK_SIGN_UP_URL,
  CLERK_USER_PROFILE_URL,
} from "@/lib/clerk";
import { DASHBOARD_PATH } from "@/lib/routes";

const loginButtonClass =
  "rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";

const dashboardLinkClass =
  "rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";

function GuestAuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link href={CLERK_SIGN_IN_URL} className={loginButtonClass}>
        Log in
      </Link>
      <Link href={CLERK_SIGN_UP_URL} className={primaryNavButtonClass}>
        Sign up
      </Link>
    </div>
  );
}

function ClerkGuestAuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="redirect" fallbackRedirectUrl={DASHBOARD_PATH}>
        <button type="button" className={loginButtonClass}>
          Log in
        </button>
      </SignInButton>
      <SignUpButton mode="redirect" fallbackRedirectUrl={DASHBOARD_PATH}>
        <button type="button" className={primaryNavButtonClass}>
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}

function StreakBadge({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200/70">
      <Flame className="h-4 w-4 text-amber-500" fill="currentColor" strokeWidth={1.5} />
      <span className="text-sm font-bold text-amber-600">{days}</span>
    </div>
  );
}

function DashboardLink() {
  return (
    <Link href={DASHBOARD_PATH} className={dashboardLinkClass}>
      Dashboard
    </Link>
  );
}

function ClerkUserMenu({ streakDays }: { streakDays: number }) {
  return (
    <>
      <CreditsBadge />
      <StreakBadge days={streakDays} />
      <DashboardLink />
      <UserButton
        userProfileMode="navigation"
        userProfileUrl={CLERK_USER_PROFILE_URL}
        appearance={{
          elements: {
            avatarBox: "h-9 w-9",
          },
        }}
      />
    </>
  );
}

export function HomeHeaderAuth({ variant = "modern" }: { variant?: "modern" | "legacy" }) {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();
  const { streakDays } = useStudyStreak(true);

  if (!mounted) {
    return <div className="h-9 w-24" aria-hidden />;
  }

  if (!clerkEnabled) {
    return (
      <div className={variant === "legacy" ? "dn-header-right" : "flex items-center gap-3"}>
        <GuestAuthButtons />
      </div>
    );
  }

  if (variant === "legacy") {
    return (
      <div className="dn-header-right">
        <SignedIn>
          <CreditsBadge />
          <span className="dn-streak">
            <Flame size={18} color="#FFC800" fill="#FFC800" strokeWidth={2} />
            <b>{streakDays}</b>
          </span>
          <DashboardLink />
          <UserButton
            userProfileMode="navigation"
            userProfileUrl={CLERK_USER_PROFILE_URL}
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 rounded-full",
              },
            }}
          />
        </SignedIn>
        <SignedOut>
          <ClerkGuestAuthButtons />
        </SignedOut>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignedIn>
        <ClerkUserMenu streakDays={streakDays} />
      </SignedIn>
      <SignedOut>
        <ClerkGuestAuthButtons />
      </SignedOut>
    </div>
  );
}
