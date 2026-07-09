/**
 * URL routing rules for DrNote (frontend-only for now).
 *
 * Path shape:
 *   /                               Product picker (Qbank | Library)
 *   /qbank                          Exam picker
 *   /qbank/{examId}                 Browse sets (default questions tab)
 *   /qbank/{examId}/{tab}           Browse sets for a content tab
 *   /qbank/{examId}/{tab}/sets/{setId}
 *   /qbank/{examId}/{tab}/sets/{setId}/quiz
 *   /qbank/{examId}/{tab}/sets/{setId}/results
 *   /qbank/{examId}/filters         Filter panel
 *   /library                        Article library product
 *   /library/specialties/{slug}     Specialty hub (topics list / coming soon)
 *   /library/topics/{topicId}       Topic page (article or coming soon)
 *   /library/articles/{articleId}   Article reader
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

/** Product picker home. */
export const HOME_PATH = "/";

/** Qbank exam picker. */
export const QBANK_PATH = "/qbank";

/** User dashboard with pinned exams. */
export const DASHBOARD_PATH = "/dashboard";

/** Global article library product. */
export const LIBRARY_PATH = "/library";

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
  return `/qbank/${examId}`;
}

export function examTabPath(
  examId: string,
  tab: ContentTab = DEFAULT_TAB
): string {
  if (tab === "library") return LIBRARY_PATH;
  if (tab === DEFAULT_TAB) return examPath(examId);
  return `/qbank/${examId}/${tab}`;
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
  return `/qbank/${examId}/${tab}/sets/${setId}`;
}

export function quizPath(
  examId: string,
  tab: ContentTab,
  setId: string,
  params?: QuizSearchParams
): string {
  const base = `/qbank/${examId}/${tab}/sets/${setId}/quiz`;
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
  return `/qbank/${examId}/${tab}/sets/${setId}/results`;
}

export function filtersPath(examId: string = DEFAULT_EXAM_ID): string {
  return `/qbank/${examId}/filters`;
}

export const UPGRADE_PATH = "/upgrade";
export const PRICING_PATH = "/pricing";

/** Library article reader — independent of qbank exams. */
export function articlePath(articleId: string): string {
  return `/library/articles/${articleId}`;
}

export function specialtyPath(specialtySlug: string): string {
  return `/library/specialties/${specialtySlug}`;
}

export function topicPath(topicId: string): string {
  return `/library/topics/${topicId}`;
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
  // /qbank/{examId}/{tab}/...
  if (segments[0] === "qbank" && segments.length >= 3 && isValidTab(segments[2]!)) {
    return segments[2];
  }
  // legacy /{examId}/{tab}
  if (segments.length >= 2 && isValidExamId(segments[0]!) && isValidTab(segments[1]!)) {
    return segments[1];
  }
  return DEFAULT_TAB;
}

export function examIdFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "qbank" && segments[1] && isValidExamId(segments[1])) {
    return segments[1];
  }
  // legacy /{examId}/...
  if (segments[0] && isValidExamId(segments[0])) return segments[0];
  return null;
}
