"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { useClientMounted, useClerkEnabled } from "@/hooks/useClerkEnabled";
import { CLERK_SIGN_IN_URL, CLERK_SIGN_UP_URL, CLERK_USER_PROFILE_URL } from "@/lib/clerk";
import { DASHBOARD_PATH } from "@/lib/routes";
import { primaryNavButtonClass, primaryNavLinkClass } from "@/components/ProductSiteNav";

const loginButtonClass =
  "rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-4";

function GuestAuthControls({ compact = false }: { compact?: boolean }) {
  if (compact) {
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

function ClerkUserAuthControls({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <SignedIn>
        {!compact && (
          <Link href={DASHBOARD_PATH} className={primaryNavLinkClass}>
            Dashboard
          </Link>
        )}
        <UserButton
          userProfileMode="navigation"
          userProfileUrl={CLERK_USER_PROFILE_URL}
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </SignedIn>
      <SignedOut>
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
