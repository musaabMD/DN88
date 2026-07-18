"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useClientMounted, useClerkEnabled } from "@/hooks/useClerkEnabled";
import { CLERK_USER_PROFILE_URL } from "@/lib/clerk";
import { DASHBOARD_PATH } from "@/lib/routes";
import { primaryNavButtonClass, primaryNavLinkClass } from "@/components/ProductSiteNav";

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
    return <GuestAuthControls compact={compact} />;
  }

  return <ClerkUserAuthControls compact={compact} />;
}
