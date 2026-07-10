import type { JSONContent } from "@tiptap/react";
import { buildInternalLinkFromTitle } from "@/lib/pages";
import { WIKI_LINK_SPLIT_REGEX } from "@/components/library/editor/wiki-link/constants";
import { toLinkMarkAttrs } from "@/components/library/editor/wiki-link/wiki-link-commands";

/**
 * Parse `[[Page Title]]` syntax into Tiptap inline content with internal link marks.
 */
export function parseWikiLinksInText(text: string): JSONContent[] {
  if (!text.includes("[[")) {
    return text ? [{ type: "text", text }] : [];
  }

  const nodes: JSONContent[] = [];
  let lastIndex = 0;
  WIKI_LINK_SPLIT_REGEX.lastIndex = 0;

  for (const match of text.matchAll(WIKI_LINK_SPLIT_REGEX)) {
    const index = match.index ?? 0;
    const rawTitle = match[1]?.trim();
    if (!rawTitle) continue;

    if (index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, index) });
    }

    const attrs = buildInternalLinkFromTitle(rawTitle);
    nodes.push({
      type: "text",
      text: attrs.pageTitle,
      marks: [{ type: "link", attrs: toLinkMarkAttrs(attrs) }],
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

export function paragraphFromWikiText(text: string): JSONContent {
  return { type: "paragraph", content: parseWikiLinksInText(text) };
}

export function bulletItemFromWikiText(text: string): JSONContent {
  return {
    type: "listItem",
    content: [paragraphFromWikiText(text)],
  };
}
