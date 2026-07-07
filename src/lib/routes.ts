/**
 * URL routing rules for DrNote (frontend-only for now).
 *
 * RULE: Every user-facing screen must have a stable URL built from these helpers.
 * When the backend arrives, keep these paths and swap mock loaders for API calls
 * in page components — do not scatter path strings across the app.
 *
 * Path shape:
 *   /{tab}                          Browse sets for a content tab
 *   /{tab}/sets/{setId}             Set hub (QuizSetScreen)
 *   /{tab}/sets/{setId}/quiz        Active study session
 *   /{tab}/sets/{setId}/results     Session results / history
 *   /filters                        Filter panel (full page)
 *   /upgrade                        Upgrade modal as page
 *
 * Query params on /quiz (optional, preserved for backend session creation):
 *   mode=resume|quick|timed|incorrect|flagged|mock|restart
 *   count, minutes — mode-specific limits
 */

export const VALID_TABS = [
  "questions",
  "summary",
  "images",
  "flashcards",
  "library",
] as const;

export type ContentTab = (typeof VALID_TABS)[number];

export const DEFAULT_TAB: ContentTab = "questions";

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

export function tabPath(tab: ContentTab = DEFAULT_TAB): string {
  return `/${tab}`;
}

export function setPath(tab: ContentTab, setId: string): string {
  return `/${tab}/sets/${setId}`;
}

export function quizPath(
  tab: ContentTab,
  setId: string,
  params?: QuizSearchParams
): string {
  const base = `/${tab}/sets/${setId}/quiz`;
  if (!params) return base;

  const search = new URLSearchParams();
  if (params.mode) search.set("mode", params.mode);
  if (params.count !== undefined) search.set("count", String(params.count));
  if (params.minutes !== undefined) search.set("minutes", String(params.minutes));

  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function resultsPath(tab: ContentTab, setId: string): string {
  return `/${tab}/sets/${setId}/results`;
}

export const FILTERS_PATH = "/filters";
export const UPGRADE_PATH = "/upgrade";

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

/** All static paths needed for `output: "export"` pre-rendering. */
export function allStaticRouteParams(): Array<{ tab: string; setId?: string }> {
  return VALID_TABS.flatMap((tab) => [{ tab }]);
}
