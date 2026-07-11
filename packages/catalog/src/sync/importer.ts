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

  const article: ParsedArticle = {
    id: frontmatter.data.id,
    title: frontmatter.data.title,
    slug: frontmatter.data.slug,
    specialty: frontmatter.data.specialty,
    subspecialty: frontmatter.data.subspecialty,
    tags: frontmatter.data.tags,
    updatedAt: frontmatter.data.updated_at,
    sourcePath: filePath,
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
