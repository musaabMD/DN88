import { mergeAttributes } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";

export const SectionHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) =>
          attributes.id ? { id: attributes.id as string } : {},
      },
      "data-section-id": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-section-id"),
        renderHTML: (attributes) =>
          attributes["data-section-id"]
            ? { "data-section-id": attributes["data-section-id"] as string }
            : {},
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const level = Number(node.attrs.level);
    const levelClass =
      level === 1
        ? "article-title"
        : level === 2
          ? "article-section-heading"
          : level === 3
            ? "article-subsection-heading"
            : undefined;

    return [
      `h${level}`,
      mergeAttributes(HTMLAttributes, {
        class: levelClass,
      }),
      0,
    ];
  },
}).configure({ levels: [1, 2, 3] });
