import matter from "gray-matter";
import type { ValidationIssue } from "../models/article.js";
import {
  formatZodIssues,
  frontmatterSchema,
  type ArticleFrontmatter,
} from "../validate/frontmatter-schema.js";

export type ParsedFrontmatterResult =
  | {
      ok: true;
      data: ArticleFrontmatter;
      content: string;
      warnings: ValidationIssue[];
    }
  | { ok: false; errors: ValidationIssue[] };

const IGNORED_FRONTMATTER_KEYS = new Set([
  "provenance",
  "status",
  "ai_status",
]);

export function parseFrontmatter(
  raw: string,
  sourcePath: string
): ParsedFrontmatterResult {
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      errors: [
        {
          code: "frontmatter.parse",
          severity: "error",
          message: `Failed to parse frontmatter: ${message}`,
          sourcePath,
        },
      ],
    };
  }

  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    return {
      ok: false,
      errors: formatZodIssues(result.error.issues, sourcePath),
    };
  }

  const warnings: ValidationIssue[] = [];
  for (const key of Object.keys(parsed.data)) {
    if (IGNORED_FRONTMATTER_KEYS.has(key)) continue;
    if (!(key in frontmatterSchema.shape)) {
      warnings.push({
        code: "frontmatter.unknown_key",
        severity: "warning",
        message: `Unknown frontmatter key "${key}" will be ignored`,
        sourcePath,
      });
    }
  }

  return {
    ok: true,
    data: result.data,
    content: parsed.content,
    warnings,
  };
}
