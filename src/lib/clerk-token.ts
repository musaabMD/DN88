"use client";

type ClerkLike = {
  user?: unknown;
  session?: { getToken: () => Promise<string | null> };
};

function getWindowClerk(): ClerkLike | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Clerk?: ClerkLike }).Clerk;
}

export async function getClerkToken(timeoutMs = 4000): Promise<string | null> {
  const started = Date.now();

  while (Date.now() - started <= timeoutMs) {
    const clerk = getWindowClerk();
    if (!clerk) {
      await new Promise((resolve) => window.setTimeout(resolve, 150));
      continue;
    }

    if (!clerk.user) {
      return null;
    }

    if (clerk.session?.getToken) {
      try {
        const token = await clerk.session.getToken();
        if (token) return token;
      } catch {
        return null;
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }

  try {
    return (await getWindowClerk()?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

export function isClerkSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getWindowClerk()?.user);
}
