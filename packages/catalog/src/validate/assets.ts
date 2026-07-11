import { existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import type { ValidationIssue } from "../models/article.js";

const ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
]);

export function extractAssetReferences(markdown: string): string[] {
  const refs = new Set<string>();
  const imageRe = /!\[[^\]]*\]\(([^)]+)\)/g;
  const linkRe = /(?<!!)\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|gif|webp|svg|pdf))\)/gi;
  let m: RegExpExecArray | null;
  while ((m = imageRe.exec(markdown)) !== null) {
    refs.add(m[1]!.trim());
  }
  while ((m = linkRe.exec(markdown)) !== null) {
    refs.add(m[1]!.trim());
  }
  return [...refs];
}

export function validateAssets(
  markdown: string,
  articlePath: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const articleDir = dirname(articlePath);
  const refs = extractAssetReferences(markdown);

  for (const ref of refs) {
    if (/^https?:\/\//i.test(ref) || ref.startsWith("data:")) continue;

    const ext = ref.slice(ref.lastIndexOf(".")).toLowerCase();
    if (!ASSET_EXTENSIONS.has(ext)) {
      issues.push({
        code: "assets.unsupported_extension",
        severity: "warning",
        message: `Unsupported asset extension: ${ref}`,
        sourcePath: articlePath,
      });
      continue;
    }

    const resolved = normalize(join(articleDir, ref));
    if (!resolved.startsWith(normalize(articleDir))) {
      issues.push({
        code: "assets.path_traversal",
        severity: "error",
        message: `Invalid asset path: ${ref}`,
        sourcePath: articlePath,
      });
      continue;
    }

    if (!existsSync(resolved)) {
      issues.push({
        code: "assets.missing",
        severity: "warning",
        message: `Missing asset: ${ref}`,
        sourcePath: articlePath,
      });
    }
  }

  return issues;
}
