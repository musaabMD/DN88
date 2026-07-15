import catalogIndexPayload from "@/generated/catalog-index.json";

export type CatalogArticleIndexItem = {
  id: string;
  publicSlug?: string;
  slug?: string;
  subject: string;
  title: string;
  readMinutes: number;
  updated: string;
  updatedAt?: string;
};

type CatalogIndexPayload = {
  version: number;
  syncedAt: string;
  articles: CatalogArticleIndexItem[];
};

const payload = catalogIndexPayload as CatalogIndexPayload;

export const LIBRARY_ARTICLE_INDEX: CatalogArticleIndexItem[] = payload.articles;
export const CATALOG_INDEX_SYNCED_AT: string | null = payload.syncedAt ?? null;
