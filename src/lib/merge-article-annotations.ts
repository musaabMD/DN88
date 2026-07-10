import type { JSONContent } from "@tiptap/react";
import type { LibraryArticle } from "@/lib/set-content";
import { articleToTiptapContent } from "@/components/library/editor/article-to-tiptap";

type MarkNode = {
  type: "text";
  text: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

/** Extract highlight marks keyed by plain text for merge. */
function extractHighlights(node: JSONContent, map: Map<string, MarkNode["marks"]>) {
  if (node.type === "text" && typeof node.text === "string" && node.marks?.length) {
    const highlightMarks = node.marks.filter(
      (m) => m.type === "highlight" || m.type === "underline" || m.type === "bold"
    );
    if (highlightMarks.length > 0) {
      map.set(node.text.trim(), node.marks);
    }
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      extractHighlights(child, map);
    }
  }
}

function applyHighlights(node: JSONContent, map: Map<string, MarkNode["marks"]>): JSONContent {
  if (node.type === "text" && typeof node.text === "string") {
    const marks = map.get(node.text.trim());
    if (marks) {
      return { ...node, marks };
    }
    return node;
  }
  if (Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map((child) => applyHighlights(child, map)),
    };
  }
  return node;
}

/**
 * Merge user annotations (highlights, underline, bold) from saved content
 * into the latest published article source.
 */
export function mergeAnnotationsWithSource(
  article: LibraryArticle,
  savedContent: JSONContent | null
): JSONContent {
  const source = articleToTiptapContent(article);
  if (!savedContent) return source;

  const highlightMap = new Map<string, MarkNode["marks"]>();
  extractHighlights(savedContent, highlightMap);
  if (highlightMap.size === 0) return source;

  return applyHighlights(source, highlightMap);
}
