import type { Root, Content } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { ParsedSection, ValidationIssue } from "../models/article.js";
import { dedupeSectionIds, slugifyHeading } from "./slugify.js";

export type SectionParseResult = {
  sections: ParsedSection[];
  preambleMarkdown?: string;
  warnings: ValidationIssue[];
};

type SectionDraft = {
  heading: string;
  startOffset: number;
  bodyStartOffset: number;
  endOffset?: number;
};

const parser = unified().use(remarkParse).use(remarkGfm);

export function parseSectionsFromMarkdown(
  markdown: string,
  sourcePath: string
): SectionParseResult {
  const tree = parser.parse(markdown) as Root;
  const warnings: ValidationIssue[] = [];

  const drafts: SectionDraft[] = [];
  let preambleEnd: number | undefined;

  for (const node of tree.children) {
    if (isRootLevelH2(node)) {
      const position = node.position;
      const startOffset = position?.start?.offset;
      const bodyStartOffset = position?.end?.offset;
      if (startOffset == null) {
        warnings.push({
          code: "sections.missing_position",
          severity: "warning",
          message: `Section heading "${extractHeadingText(node)}" has no source position`,
          sourcePath,
        });
        continue;
      }
      if (bodyStartOffset == null) {
        warnings.push({
          code: "sections.missing_position",
          severity: "warning",
          message: `Section heading "${extractHeadingText(node)}" has no end position`,
          sourcePath,
        });
        continue;
      }

      if (drafts.length === 0 && startOffset > 0) {
        preambleEnd = startOffset;
      }

      if (drafts.length > 0) {
        const prev = drafts[drafts.length - 1];
        prev.endOffset = startOffset;
      }

      drafts.push({
        heading: extractHeadingText(node),
        startOffset,
        bodyStartOffset,
      });
      continue;
    }

    if (drafts.length === 0 && hasNestedH2(node)) {
      warnings.push({
        code: "sections.nested_h2_ignored",
        severity: "warning",
        message:
          "Headings inside blockquotes, lists, or code blocks do not create sections",
        sourcePath,
      });
    }
  }

  if (drafts.length > 0) {
    const last = drafts[drafts.length - 1];
    last.endOffset = markdown.length;
  }

  const preambleMarkdown =
    preambleEnd !== undefined
      ? markdown.slice(0, preambleEnd).trim() || undefined
      : drafts.length === 0
        ? markdown.trim() || undefined
        : undefined;

  if (preambleMarkdown && drafts.length > 0) {
    warnings.push({
      code: "sections.preamble_before_first_h2",
      severity: "warning",
      message:
        "Content exists before the first root-level h2; stored as preamble",
      sourcePath,
    });
  }

  if (drafts.length === 0 && markdown.trim()) {
    warnings.push({
      code: "sections.no_h2",
      severity: "warning",
      message: "Article has no root-level h2 sections",
      sourcePath,
    });
  }

  const rawIds = drafts.map((draft) => slugifyHeading(draft.heading));
  const sectionIds = dedupeSectionIds(rawIds);

  const sections: ParsedSection[] = drafts.map((draft, index) => {
    const end = draft.endOffset ?? markdown.length;
    const bodyMarkdown = markdown.slice(draft.bodyStartOffset, end).trim();

    return {
      id: sectionIds[index] ?? `section-${index + 1}`,
      heading: draft.heading,
      bodyMarkdown,
      sortOrder: index,
    };
  });

  return { sections, preambleMarkdown, warnings };
}

function isRootLevelH2(node: Content): node is Content & { depth: number } {
  return node.type === "heading" && "depth" in node && node.depth === 2;
}

function extractHeadingText(node: Content): string {
  if (node.type !== "heading") return "Untitled";
  const parts: string[] = [];
  for (const child of node.children ?? []) {
    if (child.type === "text") parts.push(child.value);
    if (child.type === "inlineCode") parts.push(child.value);
  }
  return parts.join("").trim() || "Untitled";
}

function hasNestedH2(node: Content): boolean {
  if (node.type === "heading" && "depth" in node && node.depth === 2) {
    return true;
  }

  if (!("children" in node) || !Array.isArray(node.children)) {
    return false;
  }

  for (const child of node.children) {
    if (hasNestedH2(child as Content)) return true;
  }

  return false;
}
