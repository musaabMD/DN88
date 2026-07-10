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
}).configure({ levels: [1, 2, 3] });
