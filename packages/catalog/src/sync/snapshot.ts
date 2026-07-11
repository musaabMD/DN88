import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { createHash } from "node:crypto";
import type { EnrichedArticle } from "../classify/enrich.js";
import { PARSER_VERSION } from "../models/article.js";
import { CLASSIFICATION_VERSION } from "../classify/content-status.js";
import { AI_REVIEW_VERSION } from "../ai/review.js";

export const SANITIZATION_VERSION = "1.0.0";

export type SnapshotManifest = {
  commitSha: string;
  createdAt: string;
  parserVersion: string;
  classificationVersion: string;
  aiReviewVersion: string;
  sanitizationVersion: string;
  discovered: number;
  invalid: number;
  scaffold: number;
  partial: number;
  complete: number;
  articles: Array<{
    id: string;
    publicSlug: string;
    r2Key: string;
    sourceHash: string;
    contentStatus: string;
  }>;
};

export type SnapshotBuildResult = {
  snapshotDir: string;
  manifest: SnapshotManifest;
  articles: EnrichedArticle[];
};

export function buildSnapshot(
  repoRoot: string,
  commitSha: string,
  articles: EnrichedArticle[],
  invalidCount: number,
  outputDir: string
): SnapshotBuildResult {
  const snapshotDir = join(outputDir, commitSha);
  const articlesDir = join(snapshotDir, "articles");
  mkdirSync(articlesDir, { recursive: true });

  const manifestArticles: SnapshotManifest["articles"] = [];

  for (const article of articles) {
    const r2Key = `catalog/snapshots/${commitSha}/articles/${article.id}.json`;
    const articlePath = join(articlesDir, `${article.id}.json`);
    writeFileSync(
      articlePath,
      JSON.stringify(
        {
          ...article,
          commitSha,
        },
        null,
        2
      ),
      "utf8"
    );
    manifestArticles.push({
      id: article.id,
      publicSlug: article.publicSlug,
      r2Key,
      sourceHash: article.sourceHash,
      contentStatus: article.contentStatus,
    });
  }

  const manifest: SnapshotManifest = {
    commitSha,
    createdAt: new Date().toISOString(),
    parserVersion: PARSER_VERSION,
    classificationVersion: CLASSIFICATION_VERSION,
    aiReviewVersion: AI_REVIEW_VERSION,
    sanitizationVersion: SANITIZATION_VERSION,
    discovered: articles.length + invalidCount,
    invalid: invalidCount,
    scaffold: articles.filter((a) => a.contentStatus === "scaffold").length,
    partial: articles.filter((a) => a.contentStatus === "partial").length,
    complete: articles.filter((a) => a.contentStatus === "complete").length,
    articles: manifestArticles,
  };

  writeFileSync(
    join(snapshotDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  return { snapshotDir, manifest, articles };
}

export function readSnapshotManifest(snapshotDir: string): SnapshotManifest {
  const raw = readFileSync(join(snapshotDir, "manifest.json"), "utf8");
  return JSON.parse(raw) as SnapshotManifest;
}

export function copyArticleAssets(
  repoRoot: string,
  article: EnrichedArticle,
  snapshotDir: string,
  commitSha: string
): string[] {
  const copied: string[] = [];
  const articleDir = dirname(article.sourcePath);
  const assetsDir = join(snapshotDir, "assets");
  mkdirSync(assetsDir, { recursive: true });

  const assetRe = /!\[[^\]]*\]\(([^)]+)\)|\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|gif|webp|svg|pdf))\)/gi;
  const fullText = [
    article.preambleMarkdown ?? "",
    ...article.sections.map((s) => s.bodyMarkdown),
  ].join("\n");

  let m: RegExpExecArray | null;
  const refs = new Set<string>();
  while ((m = assetRe.exec(fullText)) !== null) {
    const ref = (m[1] ?? m[2])?.trim();
    if (ref && !ref.startsWith("http") && !ref.startsWith("data:")) {
      refs.add(ref);
    }
  }

  for (const ref of refs) {
    const src = join(articleDir, ref);
    if (!existsSync(src)) continue;
    const rel = relative(repoRoot, src).split("\\").join("/");
    const dest = join(assetsDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, readFileSync(src));
    copied.push(`catalog/snapshots/${commitSha}/assets/${rel}`);
  }

  return copied;
}

export function snapshotContentHash(manifest: SnapshotManifest): string {
  return createHash("sha256")
    .update(JSON.stringify(manifest))
    .digest("hex");
}
