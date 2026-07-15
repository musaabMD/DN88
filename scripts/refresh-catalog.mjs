#!/usr/bin/env node
/**
 * Prebuild catalog refresh — imports complete DL88 markdown into src/generated/catalog.json.
 * CI passes CATALOG_SYNC_ORIGIN (+ token) so Pages builds embed published articles
 * even when the Worker API is unavailable.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_FILE = join(ROOT, "src", "generated", "catalog.json");
const CACHE_DIR = join(ROOT, ".catalog-sync");
const FIXTURE_ROOT = join(ROOT, "tests", "fixtures", "dl88-mini");

function decodeOrigin() {
  const direct = process.env.CATALOG_SYNC_ORIGIN?.trim();
  if (direct) return direct;
  const encoded = process.env.CATALOG_SYNC_ORIGIN_B64?.trim();
  if (encoded) return Buffer.from(encoded, "base64").toString("utf8").trim();
  return "";
}

function cloneFromGitOrigin(origin) {
  rmSync(CACHE_DIR, { recursive: true, force: true });
  mkdirSync(CACHE_DIR, { recursive: true });

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

function resolveRepoRoot() {
  if (process.argv.includes("--fixture")) return FIXTURE_ROOT;

  const pathArg = process.argv.find((a) => a.startsWith("--path="))?.slice(7);
  if (pathArg) return resolve(pathArg);

  const origin = decodeOrigin();
  if (!origin) return null;

  if (origin.startsWith("file://") || origin.startsWith("/")) {
    return origin.startsWith("file://")
      ? fileURLToPath(origin)
      : origin;
  }

  return cloneFromGitOrigin(origin);
}

function formatUpdated(iso) {
  if (!iso) return "Recently updated";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function toLibraryArticle(article) {
  return {
    id: article.id,
    publicSlug: article.publicSlug,
    slug: article.slug,
    subject: article.subject,
    title: article.title,
    readMinutes: article.readMinutes,
    updated: formatUpdated(article.updatedAt),
    summary: article.preambleMarkdown ?? undefined,
    sections: article.sections.map((section) => ({
      id: section.id,
      heading: section.heading,
      body: section.bodyMarkdown,
    })),
  };
}

function loadExistingPayload() {
  if (!existsSync(OUT_FILE)) return null;
  try {
    return JSON.parse(readFileSync(OUT_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function importFromRepo(repoRoot) {
  const catalogDist = join(ROOT, "packages", "catalog", "dist", "index.js");
  if (!existsSync(catalogDist)) {
    execSync("npm run build --workspace=@dn88/catalog", { cwd: ROOT, stdio: "inherit" });
  }

  const { importAndClassifyRepo } = await import(catalogDist);
  return importAndClassifyRepo(repoRoot);
}

async function main() {
  const repoRoot = resolveRepoRoot();
  const existing = loadExistingPayload();

  if (!repoRoot) {
    if (existing?.articles?.length) {
      console.log(
        `[catalog] No CATALOG_SYNC_ORIGIN — keeping ${existing.articles.length} committed article(s)`
      );
      return;
    }
    throw new Error(
      "No catalog bundle. Set CATALOG_SYNC_ORIGIN for CI or use DEMO_MODE locally."
    );
  }

  console.log(`[catalog] Importing DL88 from ${repoRoot}`);
  const importResult = await importFromRepo(repoRoot);

  const publishable = importResult.articles.filter(
    (article) =>
      article.contentStatus !== "scaffold" && !article.hasBlockingErrors
  );

  console.log(
    `[catalog] DL88 stats: discovered=${importResult.discovered} invalid=${importResult.invalid} complete=${importResult.complete} partial=${importResult.partial} scaffold=${importResult.scaffold} publishable=${publishable.length}`
  );

  if (publishable.length === 0 && importResult.invalidPaths.length > 0) {
    for (const sample of importResult.invalidPaths.slice(0, 3)) {
      const err = sample.errors[0];
      console.warn(
        `[catalog] Invalid sample: ${sample.sourcePath} — ${err?.code ?? "?"}: ${err?.message ?? "unknown"}`
      );
    }
  }

  if (publishable.length === 0) {
    if (existing?.articles?.length) {
      console.warn(
        `[catalog] Import found 0 publishable articles — keeping ${existing.articles.length} committed article(s)`
      );
      return;
    }
    throw new Error("DL88 import produced no publishable articles");
  }

  const payload = {
    version: 1,
    syncedAt: new Date().toISOString(),
    source: repoRoot,
    articles: publishable.map(toLibraryArticle),
  };

  writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `[catalog] Wrote ${payload.articles.length} article(s) to src/generated/catalog.json`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
