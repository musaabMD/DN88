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

function normalizeFrontmatterValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}

function normalizeFrontmatterData(
  data: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, normalizeFrontmatterValue(value)])
  );
}

function normalizeSlugValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return value
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Map common DL88 field aliases before schema validation. */
function coerceFrontmatterFields(
  data: Record<string, unknown>
): Record<string, unknown> {
  const coerced = normalizeFrontmatterData(data);

  if (!coerced.id) {
    if (typeof coerced.uuid === "string") coerced.id = coerced.uuid;
    else if (typeof coerced.article_id === "string") coerced.id = coerced.article_id;
    else if (typeof coerced.articleId === "string") coerced.id = coerced.articleId;
  }

  if (!coerced.title) {
    if (typeof coerced.name === "string") coerced.title = coerced.name;
    else if (typeof coerced.heading === "string") coerced.title = coerced.heading;
  }

  if (coerced.slug !== undefined) {
    coerced.slug = normalizeSlugValue(coerced.slug);
  }

  if (!coerced.updated_at && typeof coerced.updated === "string") {
    coerced.updated_at = coerced.updated;
  }

  return coerced;
}

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

  const result = frontmatterSchema.safeParse(coerceFrontmatterFields(parsed.data));
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
