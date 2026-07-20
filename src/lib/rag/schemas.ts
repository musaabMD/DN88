import { z } from "zod";

export const boundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type BoundingBox = z.infer<typeof boundingBoxSchema>;

export const regionTypeSchema = z.enum([
  "question_stem",
  "answer_choices",
  "answer_key",
  "question_image",
  "reference_image",
  "explanation",
  "editor_comment",
  "heading",
  "watermark",
  "link",
  "table",
  "chart",
  "non_question_content",
  "unknown",
]);

export type RegionType = z.infer<typeof regionTypeSchema>;

export const pageRegionSchema = z.object({
  id: z.string(),
  pageNumber: z.number().int().positive(),
  type: regionTypeSchema,
  text: z.string().nullable(),
  boundingBox: boundingBoxSchema,
  confidence: z.number().min(0).max(1),
  associatedQuestionId: z.string().nullable(),
});

export type PageRegion = z.infer<typeof pageRegionSchema>;

export const questionAssetRoleSchema = z.enum([
  "required_to_answer",
  "part_of_question",
  "answer_explanation",
  "reference_material",
  "decorative",
  "watermark",
  "unrelated",
  "uncertain",
]);

export type QuestionAssetRole = z.infer<typeof questionAssetRoleSchema>;

export const choiceSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  text: z.string(),
});

export type Choice = z.infer<typeof choiceSchema>;

export const answerStatusSchema = z.enum([
  "explicit",
  "editor_confirmed",
  "inferred",
  "conflicting",
  "missing",
  "uncertain",
]);

export type AnswerStatus = z.infer<typeof answerStatusSchema>;

export const usabilityStatusSchema = z.enum([
  "quiz_ready",
  "needs_review",
  "incomplete",
  "reference_only",
  "not_a_question",
]);

export type UsabilityStatus = z.infer<typeof usabilityStatusSchema>;

export const questionOriginSchema = z.enum([
  "extracted",
  "reconstructed",
  "generated",
]);

export type QuestionOrigin = z.infer<typeof questionOriginSchema>;

export const questionEvidenceSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  pageNumber: z.number().int().positive(),
  evidenceType: z.enum([
    "typed_recall",
    "screenshot_question",
    "answer_key",
    "editor_correction",
    "explanation",
    "reference",
  ]),
  text: z.string().nullable(),
  assetId: z.string().nullable(),
  boundingBox: boundingBoxSchema,
  confidence: z.number().min(0).max(1),
});

export type QuestionEvidence = z.infer<typeof questionEvidenceSchema>;

export const completenessSchema = z.object({
  stemComplete: z.boolean(),
  choicesComplete: z.boolean(),
  imagePresentWhenRequired: z.boolean(),
  answerPresent: z.boolean(),
  missingParts: z.array(z.string()),
  score: z.number().min(0).max(1),
});

export const questionSchema = z.object({
  id: z.string(),
  origin: questionOriginSchema,
  source: z.object({
    documentId: z.string(),
    pageNumbers: z.array(z.number().int().positive()),
    regionIds: z.array(z.string()),
    evidenceIds: z.array(z.string()),
  }),
  versions: z.object({
    source: z.object({
      stem: z.string().nullable(),
      choices: z.array(choiceSchema),
    }),
    normalized: z.object({
      stem: z.string(),
      choices: z.array(choiceSchema),
    }),
    quizReady: z.object({
      stem: z.string(),
      choices: z.array(choiceSchema),
    }),
  }),
  answer: z.object({
    correctChoiceId: z.string().nullable(),
    sourceChoiceLabel: z.string().nullable(),
    status: answerStatusSchema,
    rawAnswerText: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  assets: z.array(
    z.object({
      id: z.string(),
      role: questionAssetRoleSchema,
      pageNumber: z.number(),
      boundingBox: boundingBoxSchema,
      originalUrl: z.string(),
      enhancedUrl: z.string().nullable(),
      textTranscription: z.string().nullable(),
    }),
  ),
  completeness: completenessSchema,
  usabilityStatus: usabilityStatusSchema,
  confidence: z.object({
    segmentation: z.number().min(0).max(1),
    stem: z.number().min(0).max(1),
    choices: z.number().min(0).max(1),
    answer: z.number().min(0).max(1),
    imageAssociation: z.number().min(0).max(1),
    overall: z.number().min(0).max(1),
  }),
  warnings: z.array(z.string()),
  reviewStatus: z.enum([
    "unreviewed",
    "approved",
    "edited",
    "rejected",
    "review_required",
  ]),
});

export type CanonicalQuestion = z.infer<typeof questionSchema>;

export const generatedQuestionSchema = z.object({
  origin: z.literal("generated"),
  generationReason: z.enum([
    "no_question_present",
    "missing_choices",
    "question_unusable",
    "user_requested_generation",
  ]),
  sourcePageNumbers: z.array(z.number().int().positive()),
  sourceRegionIds: z.array(z.string()),
  sourceAssetIds: z.array(z.string()),
  stem: z.string(),
  choices: z.array(choiceSchema),
  correctChoiceId: z.string(),
  explanation: z.string(),
  groundingConfidence: z.number().min(0).max(1),
  reviewStatus: z.literal("required"),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export const pageExtractionResultSchema = z.object({
  pageNumber: z.number().int().positive(),
  regions: z.array(pageRegionSchema),
  questions: z.array(questionSchema),
  evidence: z.array(questionEvidenceSchema),
  notes: z.array(z.string()).default([]),
});

export type PageExtractionResult = z.infer<typeof pageExtractionResultSchema>;

export const documentExtractionResultSchema = z.object({
  documentId: z.string(),
  pageCount: z.number().int().nonnegative(),
  questions: z.array(questionSchema),
  regions: z.array(pageRegionSchema),
  evidence: z.array(questionEvidenceSchema),
  ragReady: z.array(
    z.object({
      questionId: z.string(),
      stem: z.string(),
      choices: z.array(choiceSchema),
      answerStatus: answerStatusSchema,
      origin: questionOriginSchema,
      pageNumbers: z.array(z.number().int().positive()),
      usabilityStatus: usabilityStatusSchema,
    }),
  ),
  warnings: z.array(z.string()),
});

export type DocumentExtractionResult = z.infer<
  typeof documentExtractionResultSchema
>;
