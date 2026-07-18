"use client";

export async function getClerkToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const clerk = (
    window as unknown as {
      Clerk?: { session?: { getToken: () => Promise<string | null> } };
    }
  ).Clerk;
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

export function isClerkSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  const clerk = (window as unknown as { Clerk?: { user?: unknown } }).Clerk;
  return Boolean(clerk?.user);
}
