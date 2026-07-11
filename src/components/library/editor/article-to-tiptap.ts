import type { JSONContent } from "@tiptap/react";
import type {
  LibraryArticle,
  LibraryArticleCallout,
  LibraryArticleSection,
} from "@/lib/set-content";
import { sectionSlug } from "@/components/content/ArticleTableOfContents";
import { normalizeCalloutVariant } from "@/components/library/editor/callout";
import {
  bulletItemFromWikiText,
  paragraphFromWikiText,
  parseWikiLinksInText,
} from "@/components/library/editor/wiki-link/parse-wiki-text";

/** Matches an admonition prefix like `[!warning]` or `[!hy]` at line start. */
const ADMONITION_REGEX = /^\s*\[!([a-z-]+)\]\s*/i;

function calloutNode(callout: LibraryArticleCallout): JSONContent {
  const content: JSONContent[] = [];

  if (callout.body) {
    content.push(paragraphFromWikiText(callout.body));
  }

  if (callout.bullets && callout.bullets.length > 0) {
    content.push({
      type: "bulletList",
      content: callout.bullets.map((item) => bulletItemFromWikiText(item)),
    });
  }

  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

  return {
    type: "callout",
    attrs: { variant: normalizeCalloutVariant(callout.variant) },
    content,
  };
}

/**
 * If `text` starts with an admonition prefix (`[!type] ...`), return a callout
 * node built from the remaining text. Otherwise return null.
 */
function admonitionCalloutFromText(text: string): JSONContent | null {
  const match = ADMONITION_REGEX.exec(text);
  if (!match) return null;
  const variant = normalizeCalloutVariant(match[1]);
  const body = text.slice(match[0].length).trim();
  return calloutNode({ variant, body });
}

/** Push a section's body + bullets, promoting any `[!type]` lines to callouts. */
function pushSectionContent(
  content: JSONContent[],
  section: LibraryArticleSection
): void {
  if (section.body) {
    const callout = admonitionCalloutFromText(section.body);
    content.push(callout ?? paragraphFromWikiText(section.body));
  }

  if (section.bullets && section.bullets.length > 0) {
    const plainBullets: string[] = [];
    for (const bullet of section.bullets) {
      const callout = admonitionCalloutFromText(bullet);
      if (callout) {
        if (plainBullets.length > 0) {
          content.push({
            type: "bulletList",
            content: plainBullets.map((item) => bulletItemFromWikiText(item)),
          });
          plainBullets.length = 0;
        }
        content.push(callout);
      } else {
        plainBullets.push(bullet);
      }
    }
    if (plainBullets.length > 0) {
      content.push({
        type: "bulletList",
        content: plainBullets.map((item) => bulletItemFromWikiText(item)),
      });
    }
  }

  if (section.callouts && section.callouts.length > 0) {
    for (const callout of section.callouts) {
      content.push(calloutNode(callout));
    }
  }
}

export function sectionToTiptapContent(
  section: LibraryArticleSection
): JSONContent {
  const content: JSONContent[] = [];

  pushSectionContent(content, section);

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

    pushSectionContent(content, section);
  }

  if (article.highYield) {
    content.push({
      type: "heading",
      attrs: { level: 2, id: "high-yield" },
      content: [{ type: "text", text: "High yield" }],
    });
    content.push(calloutNode({ variant: "hy", body: article.highYield }));
  }

  return { type: "doc", content };
}

export { parseWikiLinksInText };
