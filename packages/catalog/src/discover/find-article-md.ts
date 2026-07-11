import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".github",
  "dist",
  "build",
  ".catalog-sync",
]);

const ARTICLE_FILE = "article.md";

/**
 * Recursively finds article.md files under content/ in a repository root.
 */
export function findArticleMarkdownFiles(repoRoot: string): string[] {
  const contentRoot = join(repoRoot, "content");
  if (!existsSync(contentRoot)) {
    return [];
  }

  const found: string[] = [];
  walk(contentRoot, repoRoot, found);
  return found.sort();
}

function walk(dir: string, repoRoot: string, found: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }

    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full, repoRoot, found);
      continue;
    }

    if (name !== ARTICLE_FILE) continue;

    const rel = relative(repoRoot, full).split(sep).join("/");
    if (!rel.startsWith("content/")) continue;
    found.push(full);
  }
}
