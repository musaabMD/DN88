#!/usr/bin/env node
/**
 * Generates Cloudflare Pages _redirects for legacy library URLs → canonical entity URLs.
 */

import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

execSync("npx tsx scripts/generate-redirects.ts", {
  cwd: ROOT,
  stdio: "inherit",
});
