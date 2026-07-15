import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findArticleMarkdownFiles } from "../src/discover/find-article-md.js";
import { parseFrontmatter } from "../src/parse/frontmatter.js";
import { parseSectionsFromMarkdown } from "../src/parse/sections-from-markdown.js";
import { slugifyHeading, dedupeSectionIds } from "../src/parse/slugify.js";
import { importArticleFile, importArticleRepo } from "../src/sync/importer.js";
import { buildDryRunReport } from "../src/report/dry-run.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(__dirname, "../../../tests/fixtures/dl88-mini");

describe("findArticleMarkdownFiles", () => {
  it("discovers content/**/article.md only", () => {
    const files = findArticleMarkdownFiles(FIXTURE_ROOT);
    expect(files.length).toBeGreaterThanOrEqual(8);
    for (const file of files) {
      expect(file.endsWith("article.md")).toBe(true);
      expect(file).toContain("/content/");
    }
  });

  it("returns empty array when content/ is missing", () => {
    expect(findArticleMarkdownFiles("/tmp/nonexistent-repo")).toEqual([]);
  });
});

describe("frontmatter schema", () => {
  it("accepts valid hypertension frontmatter", () => {
    const raw = `---
id: dl88-im-cardiology-hypertension-001
title: Essential hypertension
slug: hypertension
specialty: cardiology
updated_at: "2026-06-15"
---

Body`;

    const result = parseFrontmatter(raw, "test.md");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe("dl88-im-cardiology-hypertension-001");
      expect(result.data.slug).toBe("hypertension");
    }
  });

  it("accepts missing slug in frontmatter (inferred at import)", () => {
    const raw = `---
id: test-id
title: Test Article
specialty: cardiology
updated_at: "2026-01-01"
---

Body`;

    const result = parseFrontmatter(raw, "invalid.md");
    expect(result.ok).toBe(true);
  });

  it("accepts YAML date values for updated_at", () => {
    const raw = `---
id: test-id
title: Test
slug: test-article
specialty: cardiology
updated_at: 2026-06-15
---

Body`;

    const result = parseFrontmatter(raw, "dated.md");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.updated_at).toBe("2026-06-15");
    }
  });

  it("strips unknown frontmatter keys instead of rejecting", () => {
    const raw = `---
id: test-id
title: Test
slug: test-article
specialty: cardiology
updated_at: "2026-01-01"
custom_field: ignored
---

Body`;

    const result = parseFrontmatter(raw, "extra-keys.md");
    expect(result.ok).toBe(true);
  });

  it("rejects non-kebab-case slug", () => {
    const raw = `---
id: test-id
title: Test
slug: Bad_Slug
specialty: cardiology
updated_at: "2026-01-01"
---

Body`;

    const result = parseFrontmatter(raw, "invalid.md");
    expect(result.ok).toBe(false);
  });
});

describe("section parser", () => {
  it("parses hypertension article with multiple h2 sections", () => {
    const hypertensionPath = join(
      FIXTURE_ROOT,
      "content/internal-medicine/cardiology/hypertension/article.md"
    );
    const result = importArticleFile(hypertensionPath, FIXTURE_ROOT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.article.sections.length).toBeGreaterThanOrEqual(7);
      const headings = result.article.sections.map((s) => s.heading);
      expect(headings).toContain("Summary");
      expect(headings).toContain("Management");
      expect(headings).toContain("Diagnosis");
      expect(result.article.preambleMarkdown).toBeTruthy();
    }
  });

  it("does not split on h2 inside fenced code", () => {
    const path = join(
      FIXTURE_ROOT,
      "content/internal-medicine/cardiology/code-heading/article.md"
    );
    const result = importArticleFile(path, FIXTURE_ROOT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.article.sections).toHaveLength(2);
      expect(result.article.sections[0]?.heading).toBe("Real section");
      expect(result.article.sections[1]?.heading).toBe("Second section");
      expect(result.article.sections[0]?.bodyMarkdown).toContain(
        "## Fake section inside code"
      );
    }
  });

  it("deduplicates identical section headings", () => {
    const path = join(
      FIXTURE_ROOT,
      "content/internal-medicine/cardiology/duplicate-headings/article.md"
    );
    const result = importArticleFile(path, FIXTURE_ROOT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = result.article.sections.map((s) => s.id);
      expect(ids).toEqual(["management", "management-2", "management-3"]);
    }
  });

  it("ignores h2 inside blockquotes at root level", () => {
    const path = join(
      FIXTURE_ROOT,
      "content/internal-medicine/cardiology/nested-heading/article.md"
    );
    const result = importArticleFile(path, FIXTURE_ROOT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.article.sections).toHaveLength(1);
      expect(result.article.sections[0]?.heading).toBe("Actual section");
      expect(result.warnings.some((w) => w.code === "sections.preamble_before_first_h2")).toBe(
        true
      );
    }
  });

  it("slugifyHeading normalizes punctuation", () => {
    expect(slugifyHeading("Type 1 vs. Type 2")).toBe("type-1-vs-type-2");
    expect(slugifyHeading("  Management  ")).toBe("management");
  });

  it("dedupeSectionIds handles collisions", () => {
    expect(dedupeSectionIds(["management", "management", "summary"])).toEqual([
      "management",
      "management-2",
      "summary",
    ]);
  });
});

describe("importArticleRepo", () => {
  it("imports fixture repo with valid hypertension and invalid articles", () => {
    const result = importArticleRepo(FIXTURE_ROOT);
    expect(result.discovered).toBeGreaterThanOrEqual(8);

    const hypertension = result.results.find(
      (r) => r.ok && r.article.id.includes("hypertension")
    );
    expect(hypertension?.ok).toBe(true);

    const invalid = result.results.filter((r) => !r.ok);
    expect(invalid.length).toBeGreaterThanOrEqual(1);

    const duplicateId = invalid.find((r) =>
      r.errors.some((e) => e.code === "article.duplicate_id")
    );
    expect(duplicateId).toBeTruthy();
  });

  it("builds dry-run report with counts", () => {
    const importResult = importArticleRepo(FIXTURE_ROOT);
    const report = buildDryRunReport(importResult);
    expect(report.discovered).toBe(importResult.discovered);
    expect(report.valid + report.invalid).toBe(report.discovered);
    expect(report.articles.some((a) => a.id?.includes("hypertension"))).toBe(
      true
    );
  });

  it("never crashes on invalid single article", () => {
    const invalidPath = join(
      FIXTURE_ROOT,
      "content/internal-medicine/cardiology/invalid-frontmatter/article.md"
    );
    expect(existsSync(invalidPath)).toBe(true);
    const result = importArticleRepo(FIXTURE_ROOT);
    expect(result.results.length).toBe(result.discovered);
  });
});

describe("parseSectionsFromMarkdown edge cases", () => {
  it("warns when no h2 sections exist", () => {
    const { sections, warnings } = parseSectionsFromMarkdown(
      "Just plain text without headings.",
      "plain.md"
    );
    expect(sections).toHaveLength(0);
    expect(warnings.some((w) => w.code === "sections.no_h2")).toBe(true);
  });

  it("preserves raw markdown including tables in section body", () => {
    const md = `## Data\n\n| A | B |\n| - | - |\n| 1 | 2 |`;
    const { sections } = parseSectionsFromMarkdown(md, "table.md");
    expect(sections[0]?.bodyMarkdown).toContain("| A | B |");
  });
});
