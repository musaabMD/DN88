/** When true, skip credit charges and plan limits (for pipeline testing). */
export function isMedGeniusTestMode(value: string | undefined): boolean {
  return value === "true" || value === "1";
}
