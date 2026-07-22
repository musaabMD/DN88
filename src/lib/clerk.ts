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

export function isPublishableKeyConfigured(key: string | null | undefined): key is string {
  if (!key) return false;
  const trimmed = key.trim();

  const placeholders = [
    "your_key",
    "pk_test_your",
    "pk_live_your",
    "changeme",
    "placeholder",
  ];
  if (placeholders.some((p) => trimmed.toLowerCase().includes(p))) return false;

  return /^pk_(test|live)_[a-zA-Z0-9_$]+$/.test(trimmed) && trimmed.length > 20;
}

/**
 * Clerk is optional. Treat missing or placeholder keys as "not configured"
 * so the app can fetch runtime config before enabling auth UI.
 */
export function isClerkConfigured(): boolean {
  return isPublishableKeyConfigured(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function isClerkActiveForHost(hostname: string): boolean {
  return isClerkConfigured() && isClerkHost(hostname);
}
