/**
 * URL routing rules for DrNote (frontend-only for now).
 *
 * Path shape:
 *   /                               Exam picker home
 *   /{examId}                       Browse sets (default questions tab)
 *   /{examId}/{tab}                 Browse sets for a content tab
 *   /{examId}/{tab}/sets/{setId}    Set hub
 *   /{examId}/{tab}/sets/{setId}/quiz
 *   /{examId}/{tab}/sets/{setId}/results
 *   /{examId}/filters               Filter panel
 *   /upgrade                        Upgrade page
 */

import { DEFAULT_EXAM_ID, isValidExamId } from "@/lib/exams";

export const VALID_TABS = [
  "questions",
  "summary",
  "images",
  "flashcards",
  "library",
] as const;

export type ContentTab = (typeof VALID_TABS)[number];

export const DEFAULT_TAB: ContentTab = "questions";

/** Exam picker home. */
export const HOME_PATH = "/";

export type QuizMode =
  | "resume"
  | "restart"
  | "quick"
  | "timed"
  | "incorrect"
  | "flagged"
  | "mock";

export type QuizSearchParams = {
  mode?: QuizMode;
  count?: number;
  minutes?: number;
};

export function isValidTab(tab: string): tab is ContentTab {
  return (VALID_TABS as readonly string[]).includes(tab);
}

export function examPath(examId: string = DEFAULT_EXAM_ID): string {
  return `/${examId}`;
}

export function examTabPath(
  examId: string,
  tab: ContentTab = DEFAULT_TAB
): string {
  if (tab === DEFAULT_TAB) return examPath(examId);
  return `/${examId}/${tab}`;
}

/** @deprecated Use examTabPath(examId, tab) */
export function tabPath(
  tab: ContentTab = DEFAULT_TAB,
  examId: string = DEFAULT_EXAM_ID
): string {
  return examTabPath(examId, tab);
}

export function setPath(
  examId: string,
  tab: ContentTab,
  setId: string
): string {
  return `/${examId}/${tab}/sets/${setId}`;
}

export function quizPath(
  examId: string,
  tab: ContentTab,
  setId: string,
  params?: QuizSearchParams
): string {
  const base = `/${examId}/${tab}/sets/${setId}/quiz`;
  if (!params) return base;

  const search = new URLSearchParams();
  if (params.mode) search.set("mode", params.mode);
  if (params.count !== undefined) search.set("count", String(params.count));
  if (params.minutes !== undefined) search.set("minutes", String(params.minutes));

  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function resultsPath(
  examId: string,
  tab: ContentTab,
  setId: string
): string {
  return `/${examId}/${tab}/sets/${setId}/results`;
}

export function filtersPath(examId: string = DEFAULT_EXAM_ID): string {
  return `/${examId}/filters`;
}

export const UPGRADE_PATH = "/upgrade";
export const PRICING_PATH = "/pricing";

export function articlePath(examId: string, articleId: string): string {
  return `/${examId}/library/articles/${articleId}`;
}

/** @deprecated Use filtersPath(examId) */
export const FILTERS_PATH = filtersPath(DEFAULT_EXAM_ID);

export function parseQuizSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): QuizSearchParams {
  const rawMode = searchParams.mode;
  const mode =
    typeof rawMode === "string" &&
    [
      "resume",
      "restart",
      "quick",
      "timed",
      "incorrect",
      "flagged",
      "mock",
    ].includes(rawMode)
      ? (rawMode as QuizMode)
      : undefined;

  const rawCount = searchParams.count;
  const count =
    typeof rawCount === "string" && rawCount !== ""
      ? Number.parseInt(rawCount, 10)
      : undefined;

  const rawMinutes = searchParams.minutes;
  const minutes =
    typeof rawMinutes === "string" && rawMinutes !== ""
      ? Number.parseInt(rawMinutes, 10)
      : undefined;

  return {
    mode,
    count: Number.isFinite(count) ? count : undefined,
    minutes: Number.isFinite(minutes) ? minutes : undefined,
  };
}

export function activeTabFromPathname(pathname: string): ContentTab {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && isValidTab(segments[1]!)) {
    return segments[1];
  }
  return DEFAULT_TAB;
}

export function examIdFromPathname(pathname: string): string | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment || !isValidExamId(segment)) return null;
  return segment;
}
