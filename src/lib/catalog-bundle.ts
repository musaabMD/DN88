import type { LibraryArticle } from "@/lib/set-content";
import catalogPayload from "@/generated/catalog.json";

type CatalogPayload = {
  version: number;
  syncedAt: string;
  articles: LibraryArticle[];
};

const payload = catalogPayload as CatalogPayload;

export const LIBRARY_ARTICLES: LibraryArticle[] = payload.articles;

export const CATALOG_SYNCED_AT = payload.syncedAt;
