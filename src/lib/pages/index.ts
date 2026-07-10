export type {
  CheckPageExistsResponse,
  CreatePageInput,
  CreatePageResponse,
  InternalLinkAttrs,
  Page,
  PageSearchItem,
  PageSearchResult,
  SearchPagesResponse,
} from "@/lib/pages/types";

export {
  buildInternalLinkAttrs,
  buildInternalLinkFromTitle,
  getAllPages,
  getPageById,
  getPageBySlug,
  getPageByTitle,
  getPublishedPages,
  refreshInternalLinkAttrs,
  resolvePageFromTitle,
  resolvePageHref,
  searchPages,
} from "@/lib/pages/page-index";

export {
  checkPageExistsApi,
  createPageApi,
  resolveLinkAttrsForEditor,
  searchPagesApi,
} from "@/lib/pages/page-api";

export {
  createStoredPage,
  getCreatedPages,
  pendingIdForTitle,
} from "@/lib/pages/create-page-store";

export { isPendingPageId, pageTitleToSlug, pendingPageId } from "@/lib/pages/page-slug";
