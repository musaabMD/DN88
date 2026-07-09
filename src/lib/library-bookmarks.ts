const SPECIALTY_KEY = "drnote-specialty-bookmarks";
const TOPIC_KEY = "drnote-topic-bookmarks";

function readIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function toggleId(key: string, id: string): boolean {
  const current = readIds(key);
  const bookmarked = current.includes(id);
  const next = bookmarked
    ? current.filter((item) => item !== id)
    : [...current, id];
  localStorage.setItem(key, JSON.stringify(next));
  return !bookmarked;
}

export function isSpecialtyBookmarked(specialty: string): boolean {
  return readIds(SPECIALTY_KEY).includes(specialty);
}

export function toggleSpecialtyBookmark(specialty: string): boolean {
  return toggleId(SPECIALTY_KEY, specialty);
}

export function getSpecialtyBookmarks(): string[] {
  return readIds(SPECIALTY_KEY);
}

export function isTopicBookmarked(topicId: string): boolean {
  return readIds(TOPIC_KEY).includes(topicId);
}

export function toggleTopicBookmark(topicId: string): boolean {
  return toggleId(TOPIC_KEY, topicId);
}

export function getTopicBookmarks(): string[] {
  return readIds(TOPIC_KEY);
}
