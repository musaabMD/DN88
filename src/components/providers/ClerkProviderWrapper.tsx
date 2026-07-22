"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useClerkRuntime } from "@/hooks/useClerkEnabled";
import { CLERK_SIGN_IN_URL, CLERK_SIGN_UP_URL } from "@/lib/clerk";
import { HOME_PATH } from "@/lib/routes";

export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { publishableKey } = useClerkRuntime();

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
      signInUrl={CLERK_SIGN_IN_URL}
      signUpUrl={CLERK_SIGN_UP_URL}
      signInFallbackRedirectUrl={HOME_PATH}
      signUpFallbackRedirectUrl={HOME_PATH}
      afterSignOutUrl={HOME_PATH}
    >
      {children}
    </ClerkProvider>
  );
}
