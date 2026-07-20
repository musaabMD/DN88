import { chatCompletionWithSchema } from "../services/openrouter";
import { chunkMarkdownByQuestionBoundaries, filterChunksForExtraction } from "./chunker";
import { structuredMcqsToExtracted } from "./convert";
import { ensurePageAwareMarkdown } from "./markdown-pages";
import {
  detectSuspiciousPages,
  pageNeedsVision,
  stripRepeatedHeadersAndUrls,
} from "./preprocess";
import {
  buildClassificationUserMessage,
  buildExtractionUserMessage,
  buildGenerationUserMessage,
  CLASSIFICATION_SYSTEM_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
} from "./prompts";
import { CLASSIFICATION_SCHEMA, EXTRACTION_SCHEMA, GENERATION_SCHEMA } from "./schemas";
import type { ExtractedQuestion } from "../types";
import type {
  ChunkClassification,
  ContentType,
  ExtractionChunk,
  ProcessingOptions,
  StructuredMcq,
} from "./types";
import {
  applyValidation,
  dedupeQuestions,
  parseClassification,
  parseExtractionResult,
  shouldIncludeQuestion,
} from "./validation";

const EXTRACTION_MODEL = "google/gemini-2.0-flash-001";

export type PipelineResult = {
  questions: ExtractedQuestion[];
  contentType: ContentType;
  warnings: string[];
  stats: {
    chunksProcessed: number;
    chunksSkipped: number;
    extracted: number;
    generated: number;
    needsReview: number;
    unresolvedFragments: number;
  };
};

export async function runMcqExtractionPipeline(
  apiKey: string,
  markdown: string,
  documentName: string,
  options: ProcessingOptions
): Promise<PipelineResult> {
  const pageAware = ensurePageAwareMarkdown(markdown);
  const cleaned = stripRepeatedHeadersAndUrls(pageAware);
  const chunks = filterChunksForExtraction(chunkMarkdownByQuestionBoundaries(cleaned));

  const warnings: string[] = [];
  const suspicious = detectSuspiciousPages(cleaned);
  if (suspicious.length > 0 && options.quality !== "fast") {
    const visionPages = suspicious.filter(pageNeedsVision).map((p) => p.page);
    if (visionPages.length > 0) {
      warnings.push(
        `Pages ${visionPages.join(", ")} may contain image-heavy MCQ content not fully captured in text. Consider reprocessing with maximum quality.`
      );
    }
  }

  let documentContentType: ContentType = "mixed_notes_and_mcqs";
  const allStructured: StructuredMcq[] = [];
  let unresolvedCount = 0;
  let chunksSkipped = 0;
  let extractedCount = 0;
  let generatedCount = 0;

  for (const chunk of chunks) {
    const classification =
      options.mode === "extract" && chunk.likelyMcqBlock
        ? {
            contentType: "messy_mcq_recall" as const,
            containsExistingMcqs: true,
            shouldUseVision: false,
            estimatedQuestionCount: 1,
            reason: "Regex-detected MCQ block in extract mode",
          }
        : await classifyChunk(apiKey, chunk);
    documentContentType = mergeContentType(documentContentType, classification.contentType);

    const action = resolveChunkAction(options.mode, classification);
    if (action === "skip") {
      chunksSkipped++;
      continue;
    }

    const structured =
      action === "generate"
        ? await generateFromChunk(apiKey, chunk, documentName)
        : await extractFromChunk(apiKey, chunk, documentName);

    unresolvedCount += structured.unresolvedFragments.length;

    for (const question of structured.questions) {
      const validated = applyValidation(question);
      if (!shouldIncludeQuestion(validated, options.incompletePolicy)) continue;
      allStructured.push(validated);
      if (validated.mode === "generated") generatedCount++;
      else extractedCount++;
    }
  }

  if (documentContentType === "no_useful_mcqs" && allStructured.length === 0) {
    return {
      questions: [],
      contentType: documentContentType,
      warnings,
      stats: {
        chunksProcessed: chunks.length - chunksSkipped,
        chunksSkipped,
        extracted: 0,
        generated: 0,
        needsReview: 0,
        unresolvedFragments: unresolvedCount,
      },
    };
  }

  const deduped = dedupeQuestions(allStructured);
  const questions = structuredMcqsToExtracted(deduped);
  const needsReview = deduped.filter((q) => q.quality.needsReview).length;

  return {
    questions,
    contentType: documentContentType,
    warnings,
    stats: {
      chunksProcessed: chunks.length - chunksSkipped,
      chunksSkipped,
      extracted: extractedCount,
      generated: generatedCount,
      needsReview,
      unresolvedFragments: unresolvedCount,
    },
  };
}

async function classifyChunk(
  apiKey: string,
  chunk: ExtractionChunk
): Promise<ChunkClassification> {
  if (!chunk.likelyMcqBlock && chunk.markdown.length < 500) {
    return {
      contentType: "no_useful_mcqs",
      containsExistingMcqs: false,
      shouldUseVision: false,
      estimatedQuestionCount: 0,
      reason: "Short prose fragment with no MCQ signals",
    };
  }

  try {
    const result = await chatCompletionWithSchema(
      apiKey,
      [
        { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildClassificationUserMessage({
            chunkId: chunk.chunkId,
            markdown: chunk.markdown,
          }),
        },
      ],
      { name: "chunk_classification", schema: CLASSIFICATION_SCHEMA, model: EXTRACTION_MODEL }
    );
    return parseClassification(result.parsed);
  } catch {
    return {
      contentType: chunk.likelyMcqBlock ? "messy_mcq_recall" : "textbook",
      containsExistingMcqs: chunk.likelyMcqBlock,
      shouldUseVision: false,
      estimatedQuestionCount: chunk.likelyMcqBlock ? 1 : 0,
      reason: "Classification fallback based on regex signals",
    };
  }
}

async function extractFromChunk(
  apiKey: string,
  chunk: ExtractionChunk,
  documentName: string
) {
  const result = await chatCompletionWithSchema(
    apiKey,
    [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildExtractionUserMessage({
          chunkId: chunk.chunkId,
          startPage: chunk.startPage,
          endPage: chunk.endPage,
          markdown: chunk.markdown,
        }),
      },
    ],
    {
      name: "mcq_extraction",
      schema: EXTRACTION_SCHEMA,
      model: EXTRACTION_MODEL,
      maxTokens: 8192,
    }
  );

  void documentName;
  return parseExtractionResult(result.parsed, chunk.chunkId);
}

async function generateFromChunk(
  apiKey: string,
  chunk: ExtractionChunk,
  documentName: string
) {
  const result = await chatCompletionWithSchema(
    apiKey,
    [
      { role: "system", content: GENERATION_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildGenerationUserMessage({
          chunkId: chunk.chunkId,
          startPage: chunk.startPage,
          endPage: chunk.endPage,
          markdown: chunk.markdown,
        }),
      },
    ],
    {
      name: "mcq_generation",
      schema: GENERATION_SCHEMA,
      model: EXTRACTION_MODEL,
      maxTokens: 8192,
    }
  );

  void documentName;
  return parseExtractionResult(result.parsed, chunk.chunkId);
}

type ChunkAction = "extract" | "generate" | "skip";

function resolveChunkAction(
  mode: ProcessingOptions["mode"],
  classification: ChunkClassification
): ChunkAction {
  const type = classification.contentType;

  if (type === "no_useful_mcqs") return "skip";

  if (mode === "extract") {
    return type === "textbook" ? "skip" : "extract";
  }

  if (mode === "generate") {
    return type === "textbook" || type === "mixed_notes_and_mcqs" ? "generate" : "skip";
  }

  if (mode === "extract_and_generate") {
    if (type === "textbook") return "generate";
    if (classification.containsExistingMcqs) return "extract";
    return "generate";
  }

  // auto
  switch (type) {
    case "clean_mcq_bank":
    case "messy_mcq_recall":
      return "extract";
    case "mixed_notes_and_mcqs":
      return classification.containsExistingMcqs ? "extract" : "skip";
    case "textbook":
      return "skip";
    default:
      return "skip";
  }
}

function mergeContentType(current: ContentType, next: ContentType): ContentType {
  if (current === next) return current;
  if (current === "mixed_notes_and_mcqs" || next === "mixed_notes_and_mcqs") {
    return "mixed_notes_and_mcqs";
  }
  if (current === "no_useful_mcqs") return next;
  if (next === "no_useful_mcqs") return current;
  return "mixed_notes_and_mcqs";
}
