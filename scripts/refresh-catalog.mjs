#!/usr/bin/env node
/**
 * Catalog refresh for prebuild — PR1 keeps the committed local bundle.
 * Markdown import is available via `npm run catalog:dry-run`.
 * JSON bundle discovery has been removed per DL88 markdown-only direction.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_FILE = join(ROOT, "src", "generated", "catalog.json");

function decodeOrigin() {
  const direct = process.env.CATALOG_SYNC_ORIGIN?.trim();
  if (direct) return direct;

  const encoded = process.env.CATALOG_SYNC_ORIGIN_B64?.trim();
  if (encoded) {
    return Buffer.from(encoded, "base64").toString("utf8").trim();
  }

  return "";
}

function loadExisting() {
  if (!existsSync(OUT_FILE)) return null;
  try {
    const raw = JSON.parse(readFileSync(OUT_FILE, "utf8"));
    const articles = Array.isArray(raw.articles) ? raw.articles : raw;
    return Array.isArray(articles) ? articles : null;
  } catch {
    return null;
  }
}

async function main() {
  const origin = decodeOrigin();
  const existing = loadExisting();

  if (origin) {
    console.warn(
      "[catalog] CATALOG_SYNC_ORIGIN is set but JSON bundle sync is removed. " +
        "Run `npm run catalog:dry-run` for markdown import reports. " +
        "Full snapshot sync arrives in PR3."
    );
  }

  if (existing?.length) {
    console.log(
      `[catalog] Keeping ${existing.length} committed article(s) from src/generated/catalog.json`
    );
    return;
  }

  throw new Error(
    "No local catalog bundle present. Commit src/generated/catalog.json or run catalog:dry-run against DL88."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
