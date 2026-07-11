import type { ThemeMode } from "@/lib/theme";

export const HIGHLIGHT_COLORS = [
  { label: "Yellow", light: "#fef08a", dark: "#854d0e" },
  { label: "Green", light: "#bbf7d0", dark: "#166534" },
  { label: "Blue", light: "#bae6fd", dark: "#1e3a8a" },
  { label: "Purple", light: "#e9d5ff", dark: "#6b21a8" },
  { label: "Pink", light: "#fbcfe8", dark: "#9d174d" },
  { label: "Orange", light: "#fed7aa", dark: "#9a3412" },
] as const;

export function highlightColorForTheme(
  theme: ThemeMode,
  color: (typeof HIGHLIGHT_COLORS)[number]
): string {
  return theme === "dark" ? color.dark : color.light;
}

export function getHighlightColors(theme: ThemeMode) {
  return HIGHLIGHT_COLORS.map((color) => ({
    label: color.label,
    value: highlightColorForTheme(theme, color),
  }));
}
