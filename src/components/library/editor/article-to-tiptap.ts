import type { JSONContent } from "@tiptap/react";
import type { LibraryArticleSection } from "@/lib/set-content";

export function sectionToTiptapContent(
  section: LibraryArticleSection
): JSONContent {
  const content: JSONContent[] = [];

  if (section.body) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: section.body }],
    });
  }

  if (section.bullets && section.bullets.length > 0) {
    content.push({
      type: "bulletList",
      content: section.bullets.map((item) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: item }],
          },
        ],
      })),
    });
  }

  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

  return { type: "doc", content };
}
