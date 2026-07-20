/** JSON Schema definitions for OpenRouter structured output. */

export const CLASSIFICATION_SCHEMA = {
  type: "object",
  properties: {
    content_type: {
      type: "string",
      enum: [
        "clean_mcq_bank",
        "messy_mcq_recall",
        "mixed_notes_and_mcqs",
        "textbook",
        "no_useful_mcqs",
      ],
    },
    contains_existing_mcqs: { type: "boolean" },
    should_use_vision: { type: "boolean" },
    estimated_question_count: { type: "integer", minimum: 0 },
    reason: { type: "string" },
  },
  required: [
    "content_type",
    "contains_existing_mcqs",
    "should_use_vision",
    "estimated_question_count",
    "reason",
  ],
  additionalProperties: false,
} as const;

const optionSchema = {
  type: "object",
  properties: {
    label: { type: "string" },
    text: { type: ["string", "null"] },
  },
  required: ["label", "text"],
  additionalProperties: false,
} as const;

const correctAnswerSchema = {
  type: ["object", "null"],
  properties: {
    label: { type: "string" },
    text: { type: ["string", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    evidence: { type: "string" },
  },
  required: ["label", "text", "confidence", "evidence"],
  additionalProperties: false,
} as const;

const qualitySchema = {
  type: "object",
  properties: {
    stem_complete: { type: "boolean" },
    options_complete: { type: "boolean" },
    answer_explicit: { type: "boolean" },
    contains_source_uncertainty: { type: "boolean" },
    needs_review: { type: "boolean" },
    issues: { type: "array", items: { type: "string" } },
  },
  required: [
    "stem_complete",
    "options_complete",
    "answer_explicit",
    "contains_source_uncertainty",
    "needs_review",
    "issues",
  ],
  additionalProperties: false,
} as const;

const sourceSchema = {
  type: "object",
  properties: {
    page: { type: ["integer", "null"] },
    chunk_id: { type: "string" },
    quote: { type: "string" },
  },
  required: ["page", "chunk_id", "quote"],
  additionalProperties: false,
} as const;

const questionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    mode: { type: "string", enum: ["extracted", "generated"] },
    status: {
      type: "string",
      enum: [
        "complete",
        "incomplete_stem",
        "incomplete_options",
        "answer_missing",
        "answer_ambiguous",
        "conflicting_answer",
        "not_an_mcq",
      ],
    },
    stem: { type: "string" },
    options: { type: "array", items: optionSchema },
    correct_answer: correctAnswerSchema,
    explanation: { type: ["string", "null"] },
    topic: { type: ["string", "null"] },
    source: sourceSchema,
    quality: qualitySchema,
  },
  required: [
    "id",
    "mode",
    "status",
    "stem",
    "options",
    "correct_answer",
    "explanation",
    "topic",
    "source",
    "quality",
  ],
  additionalProperties: false,
} as const;

export const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    document: {
      type: "object",
      properties: {
        content_type: {
          type: "string",
          enum: [
            "clean_mcq_bank",
            "messy_mcq_recall",
            "mixed_notes_and_mcqs",
            "textbook",
            "no_useful_mcqs",
          ],
        },
        language: { type: "string" },
        processing_warnings: { type: "array", items: { type: "string" } },
      },
      required: ["content_type", "language", "processing_warnings"],
      additionalProperties: false,
    },
    questions: { type: "array", items: questionSchema },
    unresolved_fragments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          reason: { type: "string" },
          page: { type: ["integer", "null"] },
          chunk_id: { type: "string" },
        },
        required: ["text", "reason", "page", "chunk_id"],
        additionalProperties: false,
      },
    },
  },
  required: ["document", "questions", "unresolved_fragments"],
  additionalProperties: false,
} as const;

export const GENERATION_SCHEMA = EXTRACTION_SCHEMA;
