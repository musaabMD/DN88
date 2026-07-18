export type ContentStatus = "scaffold" | "partial" | "complete";

export type AiReviewStatus =
  | "not-reviewed"
  | "reviewing"
  | "changes-required"
  | "recommended-for-approval"
  | "not-for-publication";

export type AdminPublicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "unpublished";

export type CatalogSyncState = "fresh" | "stale" | "unavailable" | "unchanged";

export type Bindings = {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_MONTHLY?: string;
  STRIPE_PRICE_YEARLY?: string;
  DB: D1Database;
  SNAPSHOTS: R2Bucket;
  USER_CONTENT: R2Bucket;
  PROCESSING_QUEUE: Queue;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  CONTEXT_DEV_API_KEY?: string;
  ADMIN_BOOTSTRAP_IDS?: string;
  CATALOG_SYNC_SECRET?: string;
};

export type ArticleRow = {
  id: string;
  public_slug: string;
  title: string;
  slug: string;
  specialty: string;
  subspecialty: string | null;
  subject: string | null;
  content_status: ContentStatus;
  ai_review_status: AiReviewStatus;
  admin_publication_status: AdminPublicationStatus;
  source_path: string;
  source_hash: string;
  dl88_commit_sha: string | null;
  read_minutes: number;
  updated_at: string;
  has_blocking_errors: number;
  r2_article_key: string;
};

export type SectionRow = {
  section_id: string;
  heading: string;
  body_markdown: string;
  sort_order: number;
};
