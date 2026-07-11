import type { LibraryArticle } from "@/lib/set-content";
import catalogPayload from "@/generated/catalog.json";

type CatalogPayload = {
  version: number;
  syncedAt: string;
  articles: LibraryArticle[];
};

const payload = catalogPayload as CatalogPayload;

const DEMO_MODE = process.env.DEMO_MODE === "true";
const CATALOG_API_ENABLED =
  process.env.NEXT_PUBLIC_CATALOG_API_ENABLED !== "false";

/** Demo bundle only — production uses Worker catalog API. */
export const LIBRARY_ARTICLES: LibraryArticle[] =
  !DEMO_MODE && CATALOG_API_ENABLED ? [] : payload.articles;

export const CATALOG_SYNCED_AT: string | null =
  !DEMO_MODE && CATALOG_API_ENABLED ? null : payload.syncedAt;
