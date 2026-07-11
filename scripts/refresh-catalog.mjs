#!/usr/bin/env node
/**
 * Catalog refresh for prebuild — keeps committed bundle only in DEMO_MODE.
 * Production uses Worker catalog API (no silent demo fallback).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_FILE = join(ROOT, "src", "generated", "catalog.json");

const DEMO_MODE = process.env.DEMO_MODE === "true";
const CATALOG_API_ENABLED =
  process.env.NEXT_PUBLIC_CATALOG_API_ENABLED !== "false";

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
  if (!DEMO_MODE && CATALOG_API_ENABLED) {
    console.log(
      "[catalog] Production mode — articles served from Worker API. No local bundle refresh."
    );
    return;
  }

  const existing = loadExisting();
  if (existing?.length) {
    console.log(
      `[catalog] DEMO_MODE — keeping ${existing.length} local article(s) from src/generated/catalog.json`
    );
    return;
  }

  throw new Error(
    "No local catalog bundle. Set DEMO_MODE=true for local demo articles."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
