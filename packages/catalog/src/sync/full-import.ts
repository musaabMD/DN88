import { readFileSync } from "node:fs";
import { importArticleRepo } from "./importer.js";
import { enrichArticle, type EnrichedArticle } from "../classify/enrich.js";
import { buildDryRunReport } from "../report/dry-run.js";
import type { ValidationIssue } from "../models/article.js";

export type FullImportResult = {
  repoRoot: string;
  discovered: number;
  invalid: number;
  scaffold: number;
  partial: number;
  complete: number;
  articles: EnrichedArticle[];
  invalidPaths: Array<{ sourcePath: string; errors: ValidationIssue[] }>;
};

export function importAndClassifyRepo(repoRoot: string): FullImportResult {
  const importResult = importArticleRepo(repoRoot);
  const articles: EnrichedArticle[] = [];
  const invalidPaths: FullImportResult["invalidPaths"] = [];

  for (const result of importResult.results) {
    if (!result.ok) {
      invalidPaths.push({
        sourcePath: result.sourcePath,
        errors: result.errors,
      });
      continue;
    }

    const raw = readFileSync(result.article.sourcePath, "utf8");
    articles.push(
      enrichArticle(result.article, raw, result.warnings)
    );
  }

  return {
    repoRoot,
    discovered: importResult.discovered,
    invalid: invalidPaths.length,
    scaffold: articles.filter((a) => a.contentStatus === "scaffold").length,
    partial: articles.filter((a) => a.contentStatus === "partial").length,
    complete: articles.filter((a) => a.contentStatus === "complete").length,
    articles,
    invalidPaths,
  };
}

export function formatFullImportReport(result: FullImportResult): string {
  const dry = buildDryRunReport({
    parserVersion: "1.0.0",
    repoRoot: result.repoRoot,
    discovered: result.discovered,
    results: [],
  });

  const lines = [
    "DL88 Catalog Import Report",
    "============================",
    `Repo: ${result.repoRoot}`,
    "",
    `Discovered: ${result.discovered}`,
    `Invalid: ${result.invalid}`,
    `Scaffold: ${result.scaffold}`,
    `Partial: ${result.partial}`,
    `Complete: ${result.complete}`,
    "",
  ];

  const hypertension = result.articles.find((a) =>
    a.id.includes("hypertension")
  );
  if (hypertension) {
    lines.push(
      "Hypertension:",
      `  ID: ${hypertension.id}`,
      `  Status: ${hypertension.contentStatus}`,
      `  Words: ${hypertension.wordCount}`,
      `  Sections: ${hypertension.sections.length}`,
      `  Public slug: ${hypertension.publicSlug}`,
      ""
    );
  }

  return lines.join("\n");
}
