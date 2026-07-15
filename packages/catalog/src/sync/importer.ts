import { basename, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { findArticleMarkdownFiles } from "../discover/find-article-md.js";
import type {
  ImportArticleResult,
  ParsedArticle,
  ValidationIssue,
} from "../models/article.js";
import { PARSER_VERSION } from "../models/article.js";
import { parseFrontmatter } from "../parse/frontmatter.js";
import { parseSectionsFromMarkdown } from "../parse/sections-from-markdown.js";
import { slugifyHeading } from "../parse/slugify.js";

function deriveSlugFromPath(filePath: string, title: string): string {
  const topicDir = basename(dirname(filePath));
  if (topicDir && topicDir !== "content") {
    const fromDir = slugifyHeading(topicDir);
    if (fromDir) return fromDir;
  }
  return slugifyHeading(title) || "article";
}

function resolveSpecialtyKeyFromPath(sourcePath: string): string | undefined {
  const match = sourcePath.match(/content\/([^/]+)\//i);
  return match?.[1]?.toLowerCase();
}

function normalizeArticleFields(
  filePath: string,
  data: {
    id: string;
    title: string;
    slug?: string;
    specialty?: string;
    subspecialty?: string;
    type?: string;
    tags?: string[];
    updated_at?: string;
    updated?: string;
  }
): { article: ParsedArticle; warnings: ValidationIssue[] } {
  const warnings: ValidationIssue[] = [];
  const pathSpecialty = resolveSpecialtyKeyFromPath(filePath);
  const specialty = data.specialty?.trim() || pathSpecialty || "general";

  if (!data.specialty) {
    warnings.push({
      code: "frontmatter.specialty_inferred",
      severity: "warning",
      message: `Missing specialty — inferred "${specialty}" from path`,
      sourcePath: filePath,
    });
  }

  const slug = data.slug?.trim() || deriveSlugFromPath(filePath, data.title);
  if (!data.slug) {
    warnings.push({
      code: "frontmatter.slug_inferred",
      severity: "warning",
      message: `Missing slug — inferred "${slug}" from path/title`,
      sourcePath: filePath,
    });
  }

  const updatedAt = data.updated_at?.trim() || data.updated?.trim() || new Date().toISOString().slice(0, 10);

  return {
    article: {
      id: data.id,
      title: data.title,
      slug,
      specialty,
      subspecialty: data.subspecialty,
      articleType: data.type,
      tags: data.tags,
      updatedAt,
      sourcePath: filePath,
      sections: [],
      preambleMarkdown: undefined,
    },
    warnings,
  };
}

export type ImportRepoResult = {
  parserVersion: string;
  repoRoot: string;
  discovered: number;
  results: ImportArticleResult[];
};

export function importArticleFile(
  filePath: string,
  repoRoot: string
): ImportArticleResult {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      sourcePath: filePath,
      errors: [
        {
          code: "article.read",
          severity: "error",
          message: `Failed to read file: ${message}`,
          sourcePath: filePath,
        },
      ],
    };
  }

  const frontmatter = parseFrontmatter(raw, filePath);
  if (!frontmatter.ok) {
    return { ok: false, sourcePath: filePath, errors: frontmatter.errors };
  }

  const sectionParse = parseSectionsFromMarkdown(
    frontmatter.content,
    filePath
  );

  const warnings: ValidationIssue[] = [
    ...frontmatter.warnings,
    ...sectionParse.warnings,
  ];

  const normalized = normalizeArticleFields(filePath, frontmatter.data);
  warnings.push(...normalized.warnings);

  const article: ParsedArticle = {
    ...normalized.article,
    sections: sectionParse.sections,
    preambleMarkdown: sectionParse.preambleMarkdown,
  };

  return { ok: true, article, warnings };
}

export function importArticleRepo(repoRoot: string): ImportRepoResult {
  const files = findArticleMarkdownFiles(repoRoot);
  const results: ImportArticleResult[] = [];
  const seenIds = new Map<string, string>();

  for (const filePath of files) {
    const result = importArticleFile(filePath, repoRoot);

    if (result.ok) {
      const existingPath = seenIds.get(result.article.id);
      if (existingPath) {
        results.push({
          ok: false,
          sourcePath: filePath,
          errors: [
            {
              code: "article.duplicate_id",
              severity: "error",
              message: `Duplicate id "${result.article.id}" (also in ${existingPath})`,
              sourcePath: filePath,
            },
          ],
        });
        continue;
      }
      seenIds.set(result.article.id, filePath);
    }

    results.push(result);
  }

  return {
    parserVersion: PARSER_VERSION,
    repoRoot,
    discovered: files.length,
    results,
  };
}
