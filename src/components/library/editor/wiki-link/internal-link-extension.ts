import Link from "@tiptap/extension-link";
import { mergeAttributes } from "@tiptap/core";

/**
 * Link extension extended with stable internal-page attributes.
 * External URLs keep linkType unset or "external".
 */
export const InternalLink = Link.extend({
  name: "link",

  addAttributes() {
    return {
      ...this.parent?.(),
      pageId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-page-id"),
        renderHTML: (attributes) =>
          attributes.pageId ? { "data-page-id": attributes.pageId } : {},
      },
      pageTitle: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-page-title"),
        renderHTML: (attributes) =>
          attributes.pageTitle ? { "data-page-title": attributes.pageTitle } : {},
      },
      exists: {
        default: true,
        parseHTML: (element) => element.getAttribute("data-exists") !== "false",
        renderHTML: (attributes) => ({
          "data-exists": attributes.exists === false ? "false" : "true",
        }),
      },
      linkType: {
        default: "external",
        parseHTML: (element) =>
          element.getAttribute("data-link-type") ?? "external",
        renderHTML: (attributes) =>
          attributes.linkType
            ? { "data-link-type": attributes.linkType }
            : {},
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const linkType = HTMLAttributes["data-link-type"] ?? HTMLAttributes.linkType;
    const exists = HTMLAttributes["data-exists"] !== "false";
    const classNames = [
      HTMLAttributes.class,
      linkType === "internal" ? "wiki-link" : "",
      linkType === "internal" && exists ? "wiki-link-exists" : "",
      linkType === "internal" && !exists ? "wiki-link-missing" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: classNames || undefined,
      }),
      0,
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-link-type="internal"]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            href: element.getAttribute("href"),
            pageId: element.getAttribute("data-page-id"),
            pageTitle: element.getAttribute("data-page-title"),
            exists: element.getAttribute("data-exists") !== "false",
            linkType: "internal",
          };
        },
      },
      ...(this.parent?.() ?? []),
    ];
  },
});

export type InternalLinkAttributes = {
  href: string;
  pageId?: string | null;
  pageTitle?: string | null;
  exists?: boolean;
  linkType?: "internal" | "external";
  target?: string | null;
};
