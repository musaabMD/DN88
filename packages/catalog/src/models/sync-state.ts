export type CatalogSyncState = "fresh" | "stale" | "unavailable" | "unchanged";

export type DryRunSummary = {
  discovered: number;
  invalid: number;
  valid: number;
  parserVersion: string;
  repoRoot: string;
};
