/**
 * Clerk runs on the public app domain only, not Pages preview domains.
 */

export const CLERK_CUSTOM_DOMAIN =
  process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim() || "drnote.co";

const CLERK_ACCOUNT_PORTAL_BASE =
  process.env.NEXT_PUBLIC_CLERK_ACCOUNT_PORTAL_URL?.trim() ||
  "https://accounts.drnote.co";

function accountPortalPath(path: string): string {
  return `${CLERK_ACCOUNT_PORTAL_BASE.replace(/\/+$/, "")}${path}`;
}

export const CLERK_SIGN_IN_URL = accountPortalPath("/sign-in");
export const CLERK_SIGN_UP_URL = accountPortalPath("/sign-up");
export const CLERK_USER_PROFILE_URL = accountPortalPath("/user");

/** Hostnames where Clerk sign-in is enabled. */
export const CLERK_ENABLED_HOSTS = [
  "drnote.co",
  "www.drnote.co",
  "localhost",
] as const;

export function isClerkHost(hostname: string): boolean {
  return (CLERK_ENABLED_HOSTS as readonly string[]).includes(hostname);
}

/**
 * Clerk is optional. Treat missing or placeholder keys as "not configured"
 * so the app stays in guest mode until real keys are added.
 */
export function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!key) return false;

  const placeholders = [
    "your_key",
    "pk_test_your",
    "pk_live_your",
    "changeme",
    "placeholder",
  ];
  if (placeholders.some((p) => key.toLowerCase().includes(p))) return false;

  return /^pk_(test|live)_[a-zA-Z0-9_$]+$/.test(key) && key.length > 20;
}

export function isClerkActiveForHost(hostname: string): boolean {
  return isClerkConfigured() && isClerkHost(hostname);
}
