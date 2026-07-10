import { createStoredPage } from "@/lib/pages/create-page-store";
import {
  getPageById,
  refreshInternalLinkAttrs,
  searchPages,
} from "@/lib/pages/page-index";
import type {
  CheckPageExistsResponse,
  CreatePageInput,
  CreatePageResponse,
  InternalLinkAttrs,
  PageSearchItem,
  SearchPagesResponse,
} from "@/lib/pages/types";

const SEARCH_DELAY_MS = 120;

/** Mock async search — simulates API latency for loading states. */
export async function searchPagesApi(
  query: string,
  signal?: AbortSignal
): Promise<SearchPagesResponse> {
  await delay(SEARCH_DELAY_MS, signal);
  if (signal?.aborted) {
    return { items: [], error: "Aborted" };
  }
  try {
    const items = searchPages(query);
    return { items };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

export async function checkPageExistsApi(
  pageId: string,
  signal?: AbortSignal
): Promise<CheckPageExistsResponse> {
  await delay(60, signal);
  const page = getPageById(pageId);
  return page ? { exists: true, page } : { exists: false };
}

/** Mock create-page endpoint — persists to localStorage in this demo. */
export async function createPageApi(
  input: CreatePageInput,
  signal?: AbortSignal
): Promise<CreatePageResponse> {
  await delay(180, signal);
  const page = createStoredPage({
    title: input.title,
    subject: input.subject,
  });
  return { page: { id: page.id, title: page.title, slug: page.slug } };
}

export function resolveLinkAttrsForEditor(
  attrs: Partial<InternalLinkAttrs> & { pageId: string; pageTitle: string }
): InternalLinkAttrs {
  return refreshInternalLinkAttrs(attrs);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

export type { PageSearchItem };
