export const CLASSIFICATION_VERSION = "1.0.0";

export type ContentStatus = "scaffold" | "partial" | "complete";

const SCAFFOLD_MAX_WORDS = 80;
const PARTIAL_MAX_WORDS = 300;
const MIN_SECTIONS_FOR_COMPLETE = 3;

export type ClassificationInput = {
  wordCount: number;
  sectionCount: number;
  hasBlockingPlaceholders: boolean;
  hasPlaceholderMarkers: boolean;
  hasBlockingValidationErrors: boolean;
};

export function classifyContentStatus(input: ClassificationInput): ContentStatus {
  if (input.hasBlockingValidationErrors) return "scaffold";
  if (input.wordCount < SCAFFOLD_MAX_WORDS) return "scaffold";
  if (input.hasBlockingPlaceholders) return "partial";
  if (
    input.wordCount >= PARTIAL_MAX_WORDS &&
    input.sectionCount >= MIN_SECTIONS_FOR_COMPLETE &&
    !input.hasPlaceholderMarkers
  ) {
    return "complete";
  }
  return "partial";
}
