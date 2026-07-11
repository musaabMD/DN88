import type { ImportArticleResult } from "../models/article.js";
import type { DryRunSummary } from "../models/sync-state.js";
import type { ImportRepoResult } from "../sync/importer.js";

export type DryRunReport = DryRunSummary & {
  articles: Array<{
    sourcePath: string;
    status: "valid" | "invalid";
    id?: string;
    title?: string;
    sectionCount?: number;
    sectionHeadings?: string[];
    errorCount?: number;
    warningCount?: number;
    errors?: string[];
    warnings?: string[];
  }>;
};

export function buildDryRunReport(importResult: ImportRepoResult): DryRunReport {
  const articles = importResult.results.map((result) =>
    summarizeArticleResult(result)
  );

  const invalid = articles.filter((a) => a.status === "invalid").length;

  return {
    discovered: importResult.discovered,
    invalid,
    valid: importResult.discovered - invalid,
    parserVersion: importResult.parserVersion,
    repoRoot: importResult.repoRoot,
    articles,
  };
}

function summarizeArticleResult(result: ImportArticleResult) {
  if (!result.ok) {
    return {
      sourcePath: result.sourcePath,
      status: "invalid" as const,
      errorCount: result.errors.length,
      errors: result.errors.map((e) => `${e.code}: ${e.message}`),
    };
  }

  return {
    sourcePath: result.article.sourcePath,
    status: "valid" as const,
    id: result.article.id,
    title: result.article.title,
    sectionCount: result.article.sections.length,
    sectionHeadings: result.article.sections.map((s) => s.heading),
    warningCount: result.warnings.length,
    warnings:
      result.warnings.length > 0
        ? result.warnings.map((w) => `${w.code}: ${w.message}`)
        : undefined,
  };
}

export function formatDryRunReport(report: DryRunReport): string {
  const lines: string[] = [
    "DL88 Catalog Dry Run",
    "====================",
    `Repo: ${report.repoRoot}`,
    `Parser: v${report.parserVersion}`,
    "",
    `Discovered: ${report.discovered}`,
    `Valid: ${report.valid}`,
    `Invalid: ${report.invalid}`,
    "",
  ];

  const hypertension = report.articles.find(
    (a) =>
      a.id?.includes("hypertension") ||
      a.sourcePath.includes("hypertension")
  );

  if (hypertension) {
    lines.push("Hypertension article:");
    lines.push(`  Path: ${hypertension.sourcePath}`);
    lines.push(`  ID: ${hypertension.id ?? "(invalid)"}`);
    lines.push(`  Title: ${hypertension.title ?? "(invalid)"}`);
    lines.push(`  Sections: ${hypertension.sectionCount ?? 0}`);
    if (hypertension.sectionHeadings?.length) {
      lines.push(`  Headings: ${hypertension.sectionHeadings.join(" | ")}`);
    }
    if (hypertension.errors?.length) {
      lines.push("  Errors:");
      for (const err of hypertension.errors) lines.push(`    - ${err}`);
    }
    if (hypertension.warnings?.length) {
      lines.push("  Warnings:");
      for (const warn of hypertension.warnings) lines.push(`    - ${warn}`);
    }
    lines.push("");
  }

  const invalidArticles = report.articles.filter((a) => a.status === "invalid");
  if (invalidArticles.length > 0) {
    lines.push(`Invalid articles (${invalidArticles.length}):`);
    for (const article of invalidArticles.slice(0, 20)) {
      lines.push(`  - ${article.sourcePath}`);
      for (const err of article.errors ?? []) {
        lines.push(`      ${err}`);
      }
    }
    if (invalidArticles.length > 20) {
      lines.push(`  ... and ${invalidArticles.length - 20} more`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
