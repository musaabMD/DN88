import type { ThemeMode } from "@/lib/theme";

/** Standard highlighter colors — same in light and dark (no brown/dark fills). */
export const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fff59d" },
  { label: "Green", value: "#b9f6ca" },
  { label: "Blue", value: "#b3e5fc" },
  { label: "Pink", value: "#f8bbd0" },
] as const;

export function highlightColorForTheme(
  _theme: ThemeMode,
  color: (typeof HIGHLIGHT_COLORS)[number]
): string {
  return color.value;
}

export function getHighlightColors(theme: ThemeMode) {
  return HIGHLIGHT_COLORS.map((color) => ({
    label: color.label,
    value: highlightColorForTheme(theme, color),
  }));
}
