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

  return /^pk_(test|live)_[a-zA-Z0-9]+$/.test(key);
}
