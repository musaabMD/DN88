"use client";

import {
  BookOpen,
  CreditCard,
  FileText,
  Monitor,
  Stethoscope,
  Timer,
  Zap,
} from "lucide-react";

export type StudyModeFilter =
  | "summary"
  | "flashcards"
  | "questions"
  | "presentation"
  | "lastmin"
  | "er"
  | "hy";

/** Modes that transform section content in place (not a separate page). */
export const INLINE_CONTENT_MODES: StudyModeFilter[] = [
  "summary",
  "flashcards",
  "questions",
];

/** Modes that filter which sections appear. */
export const SECTION_FILTER_MODES: StudyModeFilter[] = ["lastmin", "er", "hy"];

export const STUDY_MODE_OPTIONS: Array<{
  id: StudyModeFilter;
  shortLabel: string;
  icon: typeof FileText;
  group: "content" | "filter" | "present";
}> = [
  { id: "summary", shortLabel: "Summary", icon: FileText, group: "content" },
  { id: "flashcards", shortLabel: "Cards", icon: CreditCard, group: "content" },
  { id: "questions", shortLabel: "Questions", icon: BookOpen, group: "content" },
  { id: "presentation", shortLabel: "Present", icon: Monitor, group: "present" },
  { id: "lastmin", shortLabel: "Last Min", icon: Timer, group: "filter" },
  { id: "er", shortLabel: "ER", icon: Stethoscope, group: "filter" },
  { id: "hy", shortLabel: "HY", icon: Zap, group: "filter" },
];

export function getInlineContentMode(
  activeModes: Set<StudyModeFilter>
): StudyModeFilter | null {
  for (const mode of INLINE_CONTENT_MODES) {
    if (activeModes.has(mode)) return mode;
  }
  return null;
}

export function shouldShowSection(
  sectionId: string,
  activeModes: Set<StudyModeFilter>
): boolean {
  const sectionFilters = SECTION_FILTER_MODES.filter((m) => activeModes.has(m));
  if (sectionFilters.length === 0) return true;

  const onlyHy = activeModes.has("hy") && sectionFilters.length === 1;
  const onlyEr = activeModes.has("er") && sectionFilters.length === 1;
  const onlyLastMin = activeModes.has("lastmin") && sectionFilters.length === 1;

  if (onlyHy) {
    return (
      sectionId === "overview" ||
      sectionId === "diagnosis" ||
      sectionId === "treatment" ||
      sectionId === "clinical-features"
    );
  }
  if (onlyEr) {
    return (
      sectionId.includes("clinical") ||
      sectionId.includes("diagnosis") ||
      sectionId.includes("treatment")
    );
  }
  if (onlyLastMin) {
    return sectionId === "overview" || sectionId === "treatment";
  }
  return true;
}

/** First 1–2 sentences as a section summary. */
export function summarizeSectionText(body: string, bullets?: string[]): string {
  const trimmed = body.trim();
  if (!trimmed && bullets?.length) {
    return bullets.slice(0, 2).join(" ");
  }
  const sentences = trimmed.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length === 0) {
    return trimmed.slice(0, 220) + (trimmed.length > 220 ? "…" : "");
  }
  const take = sentences.slice(0, Math.min(2, sentences.length)).join("").trim();
  return take;
}
