import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { classifyContentStatus } from "../src/classify/content-status.js";
import { detectPlaceholders, hasBlockingPlaceholders } from "../src/classify/placeholders.js";
import { computePublicSlug, resolveSpecialtyLabel } from "../src/classify/specialty-registry.js";
import { importAndClassifyRepo } from "../src/sync/full-import.js";
import { isPubliclyPublishable, canApproveForPublication } from "../src/services/publication.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(__dirname, "../../../tests/fixtures/dl88-mini");

describe("classification", () => {
  it("classifies hypertension as complete", () => {
    const result = importAndClassifyRepo(FIXTURE_ROOT);
    const hypertension = result.articles.find((a) => a.id.includes("hypertension"));
    expect(hypertension?.contentStatus).toBe("complete");
    expect(hypertension?.wordCount).toBeGreaterThan(250);
  });

  it("classifies empty scaffold as scaffold", () => {
    const result = importAndClassifyRepo(FIXTURE_ROOT);
    const scaffold = result.articles.find((a) => a.slug === "empty-scaffold");
    expect(scaffold?.contentStatus).toBe("scaffold");
  });

  it("detects placeholders", () => {
    expect(detectPlaceholders("TODO: finish").length).toBeGreaterThan(0);
    expect(hasBlockingPlaceholders("lorem ipsum dolor")).toBe(true);
  });

  it("maps specialty keys to labels", () => {
    expect(resolveSpecialtyLabel("cardiology")).toBe("Cardiology");
    expect(computePublicSlug("cardiology", "hypertension")).toBe(
      "cardiology-hypertension"
    );
  });

  it("removes clinical filler from basic-science articles", () => {
    const result = importAndClassifyRepo(FIXTURE_ROOT);
    const aminoAcids = result.articles.find((a) => a.slug === "amino-acids");
    const skull = result.articles.find((a) => a.slug === "skull");

    for (const article of [aminoAcids, skull]) {
      expect(article).toBeTruthy();
      const headings = article?.sections.map((section) => section.heading) ?? [];
      const body = [
        article?.preambleMarkdown,
        ...(article?.sections.map((section) => section.bodyMarkdown) ?? []),
      ].join("\n");

      expect(headings).not.toContain("Epidemiology");
      expect(headings).not.toContain("Risk Factors");
      expect(headings).not.toContain("Management");
      expect(body).not.toMatch(/clinical condition or syndrome/i);
      expect(body).not.toMatch(/risk factors should guide pretest probability/i);
      expect(body).not.toMatch(/The epidemiology of/i);
    }
  });

  it("classifyContentStatus boundaries", () => {
    expect(
      classifyContentStatus({
        wordCount: 50,
        sectionCount: 1,
        hasBlockingPlaceholders: false,
        hasPlaceholderMarkers: true,
        hasBlockingValidationErrors: false,
      })
    ).toBe("scaffold");

    expect(
      classifyContentStatus({
        wordCount: 500,
        sectionCount: 4,
        hasBlockingPlaceholders: false,
        hasPlaceholderMarkers: false,
        hasBlockingValidationErrors: false,
      })
    ).toBe("complete");
  });
});

describe("publication gate", () => {
  it("only approves complete + recommended + admin approved", () => {
    expect(
      isPubliclyPublishable({
        contentStatus: "complete",
        aiReviewStatus: "recommended-for-approval",
        adminPublicationStatus: "approved",
        hasBlockingErrors: false,
      })
    ).toBe(true);

    expect(
      isPubliclyPublishable({
        contentStatus: "complete",
        aiReviewStatus: "recommended-for-approval",
        adminPublicationStatus: "pending",
        hasBlockingErrors: false,
      })
    ).toBe(false);

    expect(
      canApproveForPublication({
        contentStatus: "scaffold",
        aiReviewStatus: "not-reviewed",
        adminPublicationStatus: "pending",
        hasBlockingErrors: false,
      })
    ).toBe(false);
  });

  it("AI cannot auto-approve — pending admin blocks public", () => {
    expect(
      isPubliclyPublishable({
        contentStatus: "complete",
        aiReviewStatus: "recommended-for-approval",
        adminPublicationStatus: "pending",
        hasBlockingErrors: false,
      })
    ).toBe(false);
  });
});
