#!/usr/bin/env node
/**
 * Refreshes the local catalog bundle from a configured remote origin.
 * Origin is supplied only via environment — never embedded in app code.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "src", "generated");
const OUT_FILE = join(OUT_DIR, "catalog.json");
const STAMP_FILE = join(OUT_DIR, ".catalog-stamp");
const CACHE_DIR = join(ROOT, ".catalog-sync");

const BUNDLE_PATHS = [
  "export/library-articles.json",
  "export/articles.json",
  "content/library-articles.json",
  "content/articles.json",
  "data/library-articles.json",
  "dist/library-articles.json",
];

const ARTICLE_DIR_PATHS = [
  "export/articles",
  "content/articles",
  "articles",
  "data/articles",
];

function decodeOrigin() {
  const direct = process.env.CATALOG_SYNC_ORIGIN?.trim();
  if (direct) return direct;

  const encoded = process.env.CATALOG_SYNC_ORIGIN_B64?.trim();
  if (encoded) {
    return Buffer.from(encoded, "base64").toString("utf8").trim();
  }

  return "";
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isArticleArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    typeof value[0].id === "string" &&
    typeof value[0].title === "string" &&
    Array.isArray(value[0].sections)
  );
}

function normalizePayload(raw) {
  if (isArticleArray(raw)) return raw;
  if (raw && isArticleArray(raw.articles)) return raw.articles;
  if (raw && isArticleArray(raw.libraryArticles)) return raw.libraryArticles;
  if (raw && isArticleArray(raw.items)) return raw.items;
  throw new Error("Unrecognized catalog payload shape");
}

function loadArticlesFromDir(dir) {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".json") && name !== "manifest.json")
    .sort();
  if (files.length === 0) return null;
  return files.map((name) => readJson(join(dir, name)));
}

function findBundleInTree(base) {
  for (const rel of BUNDLE_PATHS) {
    const full = join(base, rel);
    if (existsSync(full)) {
      return normalizePayload(readJson(full));
    }
  }

  for (const rel of ARTICLE_DIR_PATHS) {
    const full = join(base, rel);
    if (existsSync(full) && statSync(full).isDirectory()) {
      const articles = loadArticlesFromDir(full);
      if (articles) return articles;
    }
  }

  return null;
}

function materializeFromOrigin(origin) {
  mkdirSync(CACHE_DIR, { recursive: true });

  if (/^https?:\/\//i.test(origin)) {
    const res = fetch(origin);
    return res.then(async (response) => {
      if (!response.ok) {
        throw new Error(`Origin fetch failed (${response.status})`);
      }
      const raw = await response.json();
      return normalizePayload(raw);
    });
  }

  if (origin.startsWith("file://") || origin.startsWith("/")) {
    const localPath = origin.startsWith("file://")
      ? fileURLToPath(origin)
      : origin;
    const articles = findBundleInTree(localPath);
    if (!articles) throw new Error("No catalog bundle found at local origin");
    return Promise.resolve(articles);
  }

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

  const articles = findBundleInTree(join(CACHE_DIR, "payload"));
  if (!articles) throw new Error("No catalog bundle found in remote tree");
  return Promise.resolve(articles);
}

function writeBundle(articles) {
  mkdirSync(OUT_DIR, { recursive: true });
  const payload = {
    version: 1,
    syncedAt: new Date().toISOString(),
    articles,
  };
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  writeFileSync(OUT_FILE, serialized, "utf8");

  const digest = createHash("sha256").update(serialized).digest("hex");
  writeFileSync(STAMP_FILE, `${digest}\n`, "utf8");
  return digest;
}

function loadExisting() {
  if (!existsSync(OUT_FILE)) return null;
  try {
    const raw = readJson(OUT_FILE);
    return normalizePayload(raw.articles ?? raw);
  } catch {
    return null;
  }
}

async function main() {
  const origin = decodeOrigin();
  const force = process.argv.includes("--force");

  if (!origin) {
    const existing = loadExisting();
    if (existing?.length) {
      console.log(
        `[catalog] No origin configured — keeping ${existing.length} local article(s)`
      );
      return;
    }
    throw new Error(
      "No catalog origin configured and no local bundle present"
    );
  }

  try {
    const articles = await materializeFromOrigin(origin);
    const digest = writeBundle(articles);
    console.log(
      `[catalog] Refreshed ${articles.length} article(s) · ${digest.slice(0, 12)}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const existing = loadExisting();
    if (existing?.length && !force) {
      console.warn(`[catalog] Refresh failed (${message}) — using local bundle`);
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
