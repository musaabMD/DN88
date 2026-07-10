"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignedIn } from "@clerk/clerk-react";
import { UserAuthControls } from "@/components/UserAuthControls";
import { useClientMounted, useClerkEnabled } from "@/hooks/useClerkEnabled";
import { DASHBOARD_PATH, FEATURES_PATH, UPGRADE_PATH } from "@/lib/routes";

export const primaryNavButtonClass =
  "rounded-xl border-b-4 border-[#1e293b] bg-[#334155] px-3 py-2 text-sm font-extrabold text-white transition-colors hover:bg-[#475569] active:translate-y-0.5 active:border-b-2 sm:px-4";

export const primaryNavLinkClass =
  "hidden text-sm font-bold text-slate-600 hover:text-[#334155] sm:inline";

export function ProductSiteNav({ showFeatures = true }: { showFeatures?: boolean }) {
  const router = useRouter();
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();

  return (
    <nav className="flex items-center gap-2 sm:gap-4">
      {mounted && clerkEnabled ? (
        <SignedIn>
          <Link href={DASHBOARD_PATH} className={primaryNavLinkClass}>
            Dashboard
          </Link>
        </SignedIn>
      ) : null}

      {showFeatures ? (
        <Link href={FEATURES_PATH} className={primaryNavLinkClass}>
          Features
        </Link>
      ) : null}

      <button
        type="button"
        onClick={() => router.push(UPGRADE_PATH)}
        className={primaryNavButtonClass}
      >
        Get Pro
      </button>

      <UserAuthControls compact />
    </nav>
  );
}
