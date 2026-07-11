import { createHash } from "node:crypto";
import type { ParsedArticle, ValidationIssue } from "../models/article.js";
import {
  classifyContentStatus,
  CLASSIFICATION_VERSION,
  type ContentStatus,
} from "../classify/content-status.js";
import {
  detectPlaceholders,
  hasBlockingPlaceholders,
} from "../classify/placeholders.js";
import {
  computePublicSlug,
  resolveSpecialtyFromPath,
  resolveSpecialtyLabel,
} from "../classify/specialty-registry.js";
import { countMeaningfulWords, computeReadMinutes } from "../parse/word-count.js";
import { validateAssets } from "../validate/assets.js";

export { CLASSIFICATION_VERSION };

export type EnrichedArticle = ParsedArticle & {
  contentStatus: ContentStatus;
  wordCount: number;
  readMinutes: number;
  publicSlug: string;
  specialtyLabel: string;
  subject: string;
  sourceHash: string;
  hasBlockingErrors: boolean;
  allIssues: ValidationIssue[];
};

export function hashSourceContent(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function enrichArticle(
  article: ParsedArticle,
  rawContent: string,
  extraIssues: ValidationIssue[] = []
): EnrichedArticle {
  const fullMarkdown = [
    article.preambleMarkdown ?? "",
    ...article.sections.map((s) => s.bodyMarkdown),
  ].join("\n\n");

  const placeholders = detectPlaceholders(fullMarkdown);
  const assetIssues = validateAssets(fullMarkdown, article.sourcePath);
  const allIssues = [...extraIssues, ...assetIssues];

  const blockingErrors = allIssues.filter((i) => i.severity === "error");
  const pathSpecialty = resolveSpecialtyFromPath(article.sourcePath);
  const specialtyLabel = resolveSpecialtyLabel(article.specialty);
  const subject = pathSpecialty ?? specialtyLabel;

  const wordCount = countMeaningfulWords(fullMarkdown);
  const contentStatus = classifyContentStatus({
    wordCount,
    sectionCount: article.sections.length,
    hasBlockingPlaceholders: hasBlockingPlaceholders(fullMarkdown),
    hasPlaceholderMarkers: placeholders.length > 0,
    hasBlockingValidationErrors: blockingErrors.length > 0,
  });

  return {
    ...article,
    contentStatus,
    wordCount,
    readMinutes: computeReadMinutes(wordCount),
    publicSlug: computePublicSlug(article.specialty, article.slug),
    specialtyLabel,
    subject,
    sourceHash: hashSourceContent(rawContent),
    hasBlockingErrors: blockingErrors.length > 0,
    allIssues,
  };
}
