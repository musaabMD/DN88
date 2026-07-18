"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import { HOME_PATH } from "@/lib/routes";

export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();
  const clerkEnabled = useClerkEnabled();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkEnabled || !publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
      signInFallbackRedirectUrl={HOME_PATH}
      signUpFallbackRedirectUrl={HOME_PATH}
      afterSignOutUrl={HOME_PATH}
    >
      {children}
    </ClerkProvider>
  );
}
