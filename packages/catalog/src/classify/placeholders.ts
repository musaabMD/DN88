const PLACEHOLDER_PATTERNS: Array<{ pattern: RegExp; blocking: boolean }> = [
  { pattern: /\bTODO\b/i, blocking: false },
  { pattern: /\bTBD\b/i, blocking: false },
  { pattern: /lorem ipsum/i, blocking: true },
  { pattern: /\{\{[^}]+\}\}/, blocking: true },
  { pattern: /\[insert[^\]]*\]/i, blocking: false },
  { pattern: /coming soon/i, blocking: false },
  { pattern: /placeholder/i, blocking: false },
];

export type PlaceholderMatch = {
  marker: string;
  blocking: boolean;
};

export function detectPlaceholders(text: string): PlaceholderMatch[] {
  const matches: PlaceholderMatch[] = [];
  for (const { pattern, blocking } of PLACEHOLDER_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches.push({ marker: found[0], blocking });
    }
  }
  return matches;
}

export function hasBlockingPlaceholders(text: string): boolean {
  return detectPlaceholders(text).some((m) => m.blocking);
}
