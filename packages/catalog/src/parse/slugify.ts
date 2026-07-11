/**
 * Slugify a heading for use as a section id.
 */
export function slugifyHeading(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Deduplicate section ids: management, management-2, management-3, ...
 */
export function dedupeSectionIds(ids: string[]): string[] {
  const counts = new Map<string, number>();
  return ids.map((id) => {
    const base = id || "section";
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
}
