export type CatalogSyncState = "fresh" | "stale" | "unavailable" | "unchanged";

export type CatalogArticleSummary = {
  id: string;
  publicSlug: string;
  title: string;
  slug: string;
  specialty: string;
  subject: string | null;
  readMinutes: number;
  updatedAt: string;
};

export type CatalogArticleSection = {
  id: string;
  heading: string;
  bodyMarkdown: string;
  sortOrder: number;
};

export type CatalogArticleDetail = CatalogArticleSummary & {
  preambleMarkdown: string | null;
  sections: CatalogArticleSection[];
  commitSha: string | null;
};

export type CatalogState = {
  syncState: CatalogSyncState;
  activeSnapshotId: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
};

export type AdminArticleSummary = {
  id: string;
  publicSlug: string;
  title: string;
  contentStatus: string;
  aiReviewStatus: string;
  adminPublicationStatus: string;
  hasBlockingErrors: boolean;
  updatedAt: string;
};
