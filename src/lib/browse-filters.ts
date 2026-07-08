export type BrowseFilters = {
  subjects: string[];
  statuses: string[];
  tags: string[];
};

const STORAGE_KEY = "drnote-browse-filters";

export function loadBrowseFilters(): BrowseFilters {
  if (typeof window === "undefined") {
    return { subjects: [], statuses: [], tags: [] };
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { subjects: [], statuses: [], tags: [] };
    const parsed = JSON.parse(raw) as BrowseFilters;
    return {
      subjects: parsed.subjects ?? [],
      statuses: parsed.statuses ?? [],
      tags: parsed.tags ?? [],
    };
  } catch {
    return { subjects: [], statuses: [], tags: [] };
  }
}

export function saveBrowseFilters(filters: BrowseFilters): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

export function countBrowseFilters(filters: BrowseFilters): number {
  return filters.subjects.length + filters.statuses.length + filters.tags.length;
}
