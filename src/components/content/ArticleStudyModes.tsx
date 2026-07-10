"use client";

import {
  BookOpen,
  CircleDot,
  CreditCard,
  FileText,
  MessageCircleQuestion,
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
  | "hy"
  | "round"
  | "qa";

/** Modes that transform section content in place (not a separate page). */
export const INLINE_CONTENT_MODES: StudyModeFilter[] = [
  "summary",
  "flashcards",
  "questions",
  "round",
  "qa",
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
  { id: "round", shortLabel: "Round", icon: CircleDot, group: "content" },
  { id: "qa", shortLabel: "QA", icon: MessageCircleQuestion, group: "content" },
];

export function getActiveStudyMode(
  activeMode: StudyModeFilter | null
): StudyModeFilter | null {
  return activeMode;
}

export function getInlineContentMode(
  activeMode: StudyModeFilter | null
): StudyModeFilter | null {
  if (!activeMode) return null;
  return INLINE_CONTENT_MODES.includes(activeMode) ? activeMode : null;
}

export function shouldShowSection(
  sectionId: string,
  activeMode: StudyModeFilter | null
): boolean {
  if (!activeMode || !SECTION_FILTER_MODES.includes(activeMode)) return true;

  if (activeMode === "hy") {
    return (
      sectionId === "overview" ||
      sectionId === "summary" ||
      sectionId === "diagnosis" ||
      sectionId === "glycemic-treatment" ||
      sectionId === "management" ||
      sectionId === "clinical-features" ||
      sectionId === "treatment"
    );
  }
  if (activeMode === "er") {
    return (
      sectionId.includes("clinical") ||
      sectionId.includes("diagnosis") ||
      sectionId.includes("treatment") ||
      sectionId.includes("complication") ||
      sectionId === "management"
    );
  }
  if (activeMode === "lastmin") {
    return (
      sectionId === "overview" ||
      sectionId === "summary" ||
      sectionId === "diagnosis" ||
      sectionId === "glycemic-treatment" ||
      sectionId === "treatment" ||
      sectionId === "management"
    );
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
