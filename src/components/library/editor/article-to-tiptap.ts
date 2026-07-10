import type { JSONContent } from "@tiptap/react";
import type { LibraryArticle, LibraryArticleSection } from "@/lib/set-content";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";
import {
  bulletItemFromWikiText,
  paragraphFromWikiText,
  parseWikiLinksInText,
} from "@/components/library/editor/wiki-link/parse-wiki-text";

export function sectionToTiptapContent(
  section: LibraryArticleSection
): JSONContent {
  const content: JSONContent[] = [];

  if (section.body) {
    content.push(paragraphFromWikiText(section.body));
  }

  if (section.bullets && section.bullets.length > 0) {
    content.push({
      type: "bulletList",
      content: section.bullets.map((item) => bulletItemFromWikiText(item)),
    });
  }

  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

  return { type: "doc", content };
}

/** Full article as one Tiptap document with auto-parsed `[[wiki links]]`. */
export function articleToTiptapContent(article: LibraryArticle): JSONContent {
  const content: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: article.title }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `${article.subject} · ${article.readMinutes} min read`,
          marks: [{ type: "italic" }],
        },
      ],
    },
  ];

  for (const section of article.sections) {
    content.push({
      type: "heading",
      attrs: {
        level: 2,
        id: sectionSlug(section.heading),
        "data-section-id": section.id,
      },
      content: [{ type: "text", text: section.heading }],
    });

    if (section.body) {
      content.push(paragraphFromWikiText(section.body));
    }

    if (section.bullets && section.bullets.length > 0) {
      content.push({
        type: "bulletList",
        content: section.bullets.map((item) => bulletItemFromWikiText(item)),
      });
    }
  }

  if (article.highYield) {
    content.push({
      type: "heading",
      attrs: { level: 2, id: "high-yield" },
      content: [{ type: "text", text: "High yield" }],
    });
    content.push(paragraphFromWikiText(article.highYield));
  }

  return { type: "doc", content };
}

export { parseWikiLinksInText };
