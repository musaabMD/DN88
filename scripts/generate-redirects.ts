/**
 * Generates Cloudflare Pages _redirects for legacy library URLs → canonical entity URLs.
 * Run: npx tsx scripts/generate-redirects.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getArticleRedirectMap,
  getTopicRedirectMap,
} from "../src/lib/entities";
import { getAllSpecialtyStaticParams } from "../src/lib/specialties";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(resolve(__dirname, ".."), "public", "_redirects");

const lines: string[] = [];

for (const { from, to } of getTopicRedirectMap()) {
  lines.push(`${from}/ ${to} 301`);
  lines.push(`${from} ${to} 301`);
}

for (const { from, to } of getArticleRedirectMap()) {
  lines.push(`${from}/ ${to} 301`);
  lines.push(`${from} ${to} 301`);
}

for (const { specialtySlug } of getAllSpecialtyStaticParams()) {
  lines.push(`/library/specialties/${specialtySlug}/ /specialties/${specialtySlug}/ 301`);
  lines.push(`/library/specialties/${specialtySlug} /specialties/${specialtySlug}/ 301`);
}

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, `${lines.join("\n")}\n`, "utf8");
console.log(`[redirects] Wrote ${lines.length} rule(s) to public/_redirects`);
