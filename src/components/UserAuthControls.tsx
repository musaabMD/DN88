"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useClientMounted, useClerkEnabled } from "@/hooks/useClerkEnabled";
import {
  CLERK_SIGN_IN_URL,
  CLERK_SIGN_UP_URL,
  CLERK_USER_PROFILE_URL,
} from "@/lib/clerk";
import { DASHBOARD_PATH } from "@/lib/routes";
import { primaryNavButtonClass, primaryNavLinkClass } from "@/components/ProductSiteNav";

function AccountPortalAuthControls({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {!compact ? (
        <Link href={DASHBOARD_PATH} className={primaryNavLinkClass}>
          Dashboard
        </Link>
      ) : null}
      <a
        href={compact ? CLERK_SIGN_IN_URL : CLERK_SIGN_UP_URL}
        className={primaryNavButtonClass}
      >
        {compact ? "Sign in" : "Get started"}
      </a>
    </>
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
        <SignInButton mode="modal" fallbackRedirectUrl={DASHBOARD_PATH}>
          <button type="button" className={primaryNavButtonClass}>
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
    return <AccountPortalAuthControls compact={compact} />;
  }

  return <ClerkUserAuthControls compact={compact} />;
}
