#!/usr/bin/env node
/**
 * Dry-run DL88 markdown import — discovers article.md under content/,
 * parses frontmatter + sections, prints a report. No DB writes.
 */

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CACHE_DIR = join(ROOT, ".catalog-sync");
const FIXTURE_ROOT = join(ROOT, "tests", "fixtures", "dl88-mini");

function decodeOrigin() {
  const direct = process.env.CATALOG_SYNC_ORIGIN?.trim();
  if (direct) return direct;

  const encoded = process.env.CATALOG_SYNC_ORIGIN_B64?.trim();
  if (encoded) {
    return Buffer.from(encoded, "base64").toString("utf8").trim();
  }

  return "";
}

function isGitOrigin(origin) {
  return (
    origin.startsWith("git@") ||
    origin.endsWith(".git") ||
    /github\.com[:/][^/]+\/[^/]+/.test(origin)
  );
}

function cloneFromGitOrigin(origin) {
  rmSync(CACHE_DIR, { recursive: true, force: true });
  mkdirSync(CACHE_DIR, { recursive: true });

  const token = process.env.CATALOG_SYNC_TOKEN?.trim();
  let cloneUrl = origin;
  if (token && origin.includes("github.com") && !origin.includes("@")) {
    cloneUrl = origin.replace(
      "https://",
      `https://x-access-token:${token}@`
    );
  }

  const branch = process.env.CATALOG_SYNC_REF?.trim() || "main";
  execSync(
    `git clone --depth 1 --branch "${branch}" --single-branch "${cloneUrl}" "${CACHE_DIR}/payload"`,
    { stdio: "pipe" }
  );

  return join(CACHE_DIR, "payload");
}

function resolveRepoRoot() {
  const args = process.argv.slice(2);
  const fixtureFlag = args.includes("--fixture");
  const pathArg = args.find((a) => a.startsWith("--path="))?.slice(7);

  if (pathArg) return resolve(pathArg);
  if (fixtureFlag) return FIXTURE_ROOT;

  const origin = decodeOrigin();
  if (!origin) return FIXTURE_ROOT;

  if (origin.startsWith("file://") || origin.startsWith("/")) {
    return origin.startsWith("file://")
      ? fileURLToPath(origin)
      : origin;
  }

  if (isGitOrigin(origin) || /^https?:\/\//i.test(origin)) {
    return cloneFromGitOrigin(origin);
  }

  return resolve(origin);
}

async function main() {
  const catalogDist = join(ROOT, "packages", "catalog", "dist", "index.js");
  if (!existsSync(catalogDist)) {
    execSync("npm run build --workspace=@dn88/catalog", {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  const {
    importArticleRepo,
    buildDryRunReport,
    formatDryRunReport,
  } = await import(catalogDist);

  const repoRoot = resolveRepoRoot();
  const jsonOutput = process.argv.includes("--json");

  const importResult = importArticleRepo(repoRoot);
  const report = buildDryRunReport(importResult);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatDryRunReport(report));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
