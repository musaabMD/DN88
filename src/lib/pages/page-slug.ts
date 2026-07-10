/** Slugify a page title for URLs and pending ids. */
export function pageTitleToSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stable placeholder id for pages that do not exist yet. */
export function pendingPageId(title: string): string {
  return `pending:${pageTitleToSlug(title)}`;
}

export function isPendingPageId(pageId: string): boolean {
  return pageId.startsWith("pending:");
}
