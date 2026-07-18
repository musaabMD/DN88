const STACK_PATTERNS =
  /context\.dev|openrouter|cloudflare|wrangler|\bd1\b|\br2\b|CONTEXT_DEV|OPENROUTER|api\.context|openrouter\.ai/i;

const GENERIC: Record<string, string> = {
  parse: "We couldn't read this file. Try a PDF or text document, or contact support.",
  ai: "AI is temporarily unavailable. Please try again in a moment.",
  upload: "Upload failed. Please try again.",
  processing: "Processing failed. Please try uploading again.",
  credits: "You've reached your plan limit. Upgrade to continue.",
  default: "Something went wrong. Please try again.",
};

export function sanitizeUserError(
  message: string,
  kind: keyof typeof GENERIC = "default"
): string {
  const trimmed = message.trim();
  if (!trimmed) return GENERIC[kind];

  if (STACK_PATTERNS.test(trimmed)) {
    return GENERIC[kind];
  }

  if (/API key not configured|not configured/i.test(trimmed)) {
    return kind === "parse" ? GENERIC.parse : kind === "ai" ? GENERIC.ai : GENERIC.default;
  }

  if (/INSUFFICIENT_CREDITS|plan limit|credits/i.test(trimmed)) {
    return GENERIC.credits;
  }

  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}…` : trimmed;
}
