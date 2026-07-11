import type { Root, Content } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

const parser = unified().use(remarkParse).use(remarkGfm);

export function countMeaningfulWords(markdown: string): number {
  const tree = parser.parse(markdown) as Root;
  const words: string[] = [];

  function walk(node: Content, inExcluded = false): void {
    const excluded =
      inExcluded ||
      node.type === "code" ||
      node.type === "html" ||
      node.type === "definition";

    if (!excluded && node.type === "text") {
      const parts = node.value
        .replace(/\[!?\w+\]/g, "")
        .split(/\s+/)
        .map((w) => w.replace(/[^\w'-]/g, ""))
        .filter((w) => w.length > 1);
      words.push(...parts);
    }

    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child as Content, excluded);
      }
    }
  }

  for (const child of tree.children) {
    walk(child as Content);
  }

  return words.length;
}

export function computeReadMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}
