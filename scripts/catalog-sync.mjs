#!/usr/bin/env node
/**
 * Full DL88 catalog sync: import, classify, upload R2 snapshot, activate in D1.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CACHE_DIR = join(ROOT, ".catalog-sync");
const STAGING_DIR = join(ROOT, ".catalog-staging");

function decodeOrigin() {
  const direct = process.env.CATALOG_SYNC_ORIGIN?.trim();
  if (direct) return direct;
  const encoded = process.env.CATALOG_SYNC_ORIGIN_B64?.trim();
  if (encoded) return Buffer.from(encoded, "base64").toString("utf8").trim();
  return "";
}

function cloneRepo(origin) {
  rmSyncSafe(CACHE_DIR);
  mkdirSyncSafe(CACHE_DIR);
  const token = process.env.CATALOG_SYNC_TOKEN?.trim();
  let cloneUrl = origin;
  if (token && origin.includes("github.com") && !origin.includes("@")) {
    cloneUrl = origin.replace("https://", `https://x-access-token:${token}@`);
  }
  const branch = process.env.CATALOG_SYNC_REF?.trim() || "main";
  execSync(
    `git clone --depth 1 --branch "${branch}" --single-branch "${cloneUrl}" "${CACHE_DIR}/payload"`,
    { stdio: "pipe" }
  );
  return join(CACHE_DIR, "payload");
}

function rmSyncSafe(path) {
  try {
    execSync(`rm -rf "${path}"`);
  } catch {
    // ignore
  }
}

function mkdirSyncSafe(path) {
  execSync(`mkdir -p "${path}"`);
}

function getCommitSha(repoRoot) {
  const arg = process.argv.find((a) => a.startsWith("--commit-sha="));
  if (arg) return arg.slice("--commit-sha=".length);
  try {
    return execSync("git rev-parse HEAD", { cwd: repoRoot, stdio: "pipe" })
      .toString()
      .trim();
  } catch {
    return "local-" + Date.now();
  }
}

function uploadToR2(localPath, r2Key) {
  execSync(
    `npx wrangler r2 object put "${r2Key}" --file="${localPath}" --bucket=dn88-catalog-snapshots -c workers/dn88/wrangler.jsonc`,
    { cwd: ROOT, stdio: "pipe" }
  );
}

function walkFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

async function main() {
  const catalogDist = join(ROOT, "packages", "catalog", "dist", "index.js");
  if (!existsSync(catalogDist)) {
    execSync("npm run build --workspace=@dn88/catalog", { cwd: ROOT, stdio: "inherit" });
  }

  const {
    importAndClassifyRepo,
    buildSnapshot,
    formatFullImportReport,
  } = await import(catalogDist);

  const fixture = process.argv.includes("--fixture");
  const pathArg = process.argv.find((a) => a.startsWith("--path="))?.slice(7);
  const origin = decodeOrigin();

  let repoRoot;
  if (pathArg) repoRoot = resolve(pathArg);
  else if (fixture) repoRoot = join(ROOT, "tests", "fixtures", "dl88-mini");
  else if (origin) repoRoot = cloneRepo(origin);
  else throw new Error("Set CATALOG_SYNC_ORIGIN, --fixture, or --path=");

  const commitSha = getCommitSha(repoRoot);
  console.log(`[catalog-sync] Importing from ${repoRoot} @ ${commitSha}`);

  const importResult = importAndClassifyRepo(repoRoot);
  console.log(formatFullImportReport(importResult));

  rmSyncSafe(STAGING_DIR);
  const { snapshotDir, manifest } = buildSnapshot(
    repoRoot,
    commitSha,
    importResult.articles,
    importResult.invalid,
    STAGING_DIR
  );

  console.log(`[catalog-sync] Uploading snapshot to R2...`);
  const files = walkFiles(snapshotDir);
  for (const file of files) {
    const rel = file.slice(snapshotDir.length + 1);
    const key = `catalog/snapshots/${commitSha}/${rel}`;
    uploadToR2(file, key);
  }

  const apiUrl = process.env.CATALOG_API_URL?.trim() || process.env.NEXT_PUBLIC_DN88_API_URL?.trim() || "http://localhost:8787";
  const syncSecret = process.env.CATALOG_SYNC_SECRET?.trim();
  if (!syncSecret) {
    console.warn("[catalog-sync] CATALOG_SYNC_SECRET not set — skipping D1 activation");
    console.log("[catalog-sync] Snapshot uploaded to R2 only.");
    return;
  }

  const activatePayload = {
    commitSha,
    manifest,
    articles: importResult.articles.map((a) => ({
      id: a.id,
      publicSlug: a.publicSlug,
      title: a.title,
      slug: a.slug,
      specialty: a.specialty,
      subspecialty: a.subspecialty,
      subject: a.subject,
      contentStatus: a.contentStatus,
      sourcePath: a.sourcePath,
      sourceHash: a.sourceHash,
      readMinutes: a.readMinutes,
      updatedAt: a.updatedAt,
      hasBlockingErrors: a.hasBlockingErrors,
      r2Key: `catalog/snapshots/${commitSha}/articles/${a.id}.json`,
      sections: a.sections,
      allIssues: a.allIssues,
    })),
  };

  const response = await fetch(`${apiUrl}/api/admin/sync/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Catalog-Sync-Secret": syncSecret,
    },
    body: JSON.stringify(activatePayload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Activation failed (${response.status}): ${err}`);
  }

  const result = await response.json();
  console.log(`[catalog-sync] Activated ${result.activated} articles (snapshot ${result.snapshotId})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
