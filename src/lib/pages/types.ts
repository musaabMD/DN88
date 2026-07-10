/** Canonical page record used by wiki-link resolution. */
export type Page = {
  id: string;
  title: string;
  slug: string;
};

export type PageSearchResult = Page & {
  /** Whether the page exists in the published index. */
  exists: true;
};

export type PageSearchItem =
  | PageSearchResult
  | {
      title: string;
      exists: false;
      /** Stable placeholder id until the page is created. */
      pendingId: string;
    };

export type InternalLinkAttrs = {
  href: string;
  pageId: string;
  pageTitle: string;
  exists: boolean;
  linkType: "internal";
};

export type SearchPagesResponse = {
  items: PageSearchItem[];
  loading?: boolean;
  error?: string;
};

export type CheckPageExistsResponse = {
  exists: boolean;
  page?: Page;
};

export type CreatePageInput = {
  title: string;
  subject?: string;
};

export type CreatePageResponse = {
  page: Page;
};
