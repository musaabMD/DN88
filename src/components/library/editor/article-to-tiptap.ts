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
const MARKDOWN_BULLET_REGEX = /^\s*[-*]\s+(.+)$/;
const MARKDOWN_ORDERED_REGEX = /^\s*\d+[.)]\s+(.+)$/;
const MARKDOWN_HEADING_REGEX = /^\s*#{3,6}\s+(.+)$/;

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

function headingFromWikiText(text: string): JSONContent {
  return {
    type: "heading",
    attrs: { level: 3 },
    content: parseWikiLinksInText(text),
  };
}

function pushMarkdownTextContent(content: JSONContent[], text: string): void {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const nonEmptyLines = lines.map((line) => line.trim()).filter(Boolean);
  if (nonEmptyLines.length === 1) {
    const singleBullet = MARKDOWN_BULLET_REGEX.exec(nonEmptyLines[0]);
    const singleOrdered = MARKDOWN_ORDERED_REGEX.exec(nonEmptyLines[0]);
    const normalized = singleBullet?.[1] ?? singleOrdered?.[1];
    if (normalized) {
      const callout = admonitionCalloutFromText(normalized);
      content.push(callout ?? paragraphFromWikiText(normalized));
      return;
    }
  }

  const paragraphLines: string[] = [];
  const bulletLines: string[] = [];
  const orderedLines: string[] = [];

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();
    paragraphLines.length = 0;
    if (!paragraph) return;
    const callout = admonitionCalloutFromText(paragraph);
    content.push(callout ?? paragraphFromWikiText(paragraph));
  };

  const flushBullets = () => {
    if (bulletLines.length === 0) return;
    content.push({
      type: "bulletList",
      content: bulletLines.map((item) => bulletItemFromWikiText(item)),
    });
    bulletLines.length = 0;
  };

  const flushOrdered = () => {
    if (orderedLines.length === 0) return;
    content.push({
      type: "orderedList",
      content: orderedLines.map((item) => bulletItemFromWikiText(item)),
    });
    orderedLines.length = 0;
  };

  const flushLists = () => {
    flushBullets();
    flushOrdered();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushLists();
      continue;
    }

    const headingMatch = MARKDOWN_HEADING_REGEX.exec(line);
    if (headingMatch?.[1]) {
      flushParagraph();
      flushLists();
      content.push(headingFromWikiText(headingMatch[1].trim()));
      continue;
    }

    const callout = admonitionCalloutFromText(line);
    if (callout) {
      flushParagraph();
      flushLists();
      content.push(callout);
      continue;
    }

    const bulletMatch = MARKDOWN_BULLET_REGEX.exec(rawLine);
    if (bulletMatch?.[1]) {
      flushParagraph();
      flushOrdered();
      bulletLines.push(bulletMatch[1].trim());
      continue;
    }

    const orderedMatch = MARKDOWN_ORDERED_REGEX.exec(rawLine);
    if (orderedMatch?.[1]) {
      flushParagraph();
      flushBullets();
      orderedLines.push(orderedMatch[1].trim());
      continue;
    }

    flushLists();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushLists();
}

/** Push a section's body + bullets, promoting any `[!type]` lines to callouts. */
function pushSectionContent(
  content: JSONContent[],
  section: LibraryArticleSection
): void {
  if (section.body) {
    pushMarkdownTextContent(content, section.body);
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
      attrs: { class: "article-meta" },
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
