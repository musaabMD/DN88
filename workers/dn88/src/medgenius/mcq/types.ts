export type ContentType =
  | "clean_mcq_bank"
  | "messy_mcq_recall"
  | "mixed_notes_and_mcqs"
  | "textbook"
  | "no_useful_mcqs";

export type ProcessingMode = "auto" | "extract" | "generate" | "extract_and_generate";

export type QualityMode = "fast" | "balanced" | "maximum";

export type IncompleteQuestionPolicy = "keep_for_review" | "exclude";

export type McqExtractionMode = "extracted" | "generated";

export type McqStatus =
  | "complete"
  | "incomplete_stem"
  | "incomplete_options"
  | "answer_missing"
  | "answer_ambiguous"
  | "conflicting_answer"
  | "not_an_mcq";

export type ProcessingOptions = {
  mode: ProcessingMode;
  quality: QualityMode;
  incompletePolicy: IncompleteQuestionPolicy;
};

export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  mode: "auto",
  quality: "balanced",
  incompletePolicy: "keep_for_review",
};

export function parseProcessingOptions(raw: string | null | undefined): ProcessingOptions {
  if (!raw) return DEFAULT_PROCESSING_OPTIONS;
  try {
    const parsed = JSON.parse(raw) as Partial<ProcessingOptions>;
    const mode = parsed.mode;
    const quality = parsed.quality;
    const incompletePolicy = parsed.incompletePolicy;

    return {
      mode:
        mode === "extract" ||
        mode === "generate" ||
        mode === "extract_and_generate" ||
        mode === "auto"
          ? mode
          : DEFAULT_PROCESSING_OPTIONS.mode,
      quality:
        quality === "fast" || quality === "balanced" || quality === "maximum"
          ? quality
          : DEFAULT_PROCESSING_OPTIONS.quality,
      incompletePolicy:
        incompletePolicy === "exclude" || incompletePolicy === "keep_for_review"
          ? incompletePolicy
          : DEFAULT_PROCESSING_OPTIONS.incompletePolicy,
    };
  } catch {
    return DEFAULT_PROCESSING_OPTIONS;
  }
}

export type McqOption = {
  label: string;
  text: string | null;
};

export type McqCorrectAnswer = {
  label: string;
  text: string | null;
  confidence: number;
  evidence: string;
};

export type McqQuality = {
  stemComplete: boolean;
  optionsComplete: boolean;
  answerExplicit: boolean;
  containsSourceUncertainty: boolean;
  needsReview: boolean;
  issues: string[];
};

export type McqSource = {
  page: number | null;
  chunkId: string;
  quote: string;
};

export type StructuredMcq = {
  id: string;
  mode: McqExtractionMode;
  status: McqStatus;
  stem: string;
  options: McqOption[];
  correctAnswer: McqCorrectAnswer | null;
  explanation: string | null;
  topic: string | null;
  source: McqSource;
  quality: McqQuality;
};

export type UnresolvedFragment = {
  text: string;
  reason: string;
  page: number | null;
  chunkId: string;
};

export type ChunkClassification = {
  contentType: ContentType;
  containsExistingMcqs: boolean;
  shouldUseVision: boolean;
  estimatedQuestionCount: number;
  reason: string;
};

export type ExtractionChunk = {
  chunkId: string;
  markdown: string;
  startPage: number | null;
  endPage: number | null;
  likelyMcqBlock: boolean;
};

export type ExtractionDocumentMeta = {
  contentType: ContentType;
  language: string;
  processingWarnings: string[];
};

export type ExtractionResult = {
  document: ExtractionDocumentMeta;
  questions: StructuredMcq[];
  unresolvedFragments: UnresolvedFragment[];
};
