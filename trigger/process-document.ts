import { logger, task } from "@trigger.dev/sdk";
import {
  documentExtractionResultSchema,
  type DocumentExtractionResult,
  type PageExtractionResult,
} from "../src/lib/rag/schemas";
import { extractPageTask } from "./extract-page";

export type ProcessDocumentPayload = {
  documentId: string;
  pages: Array<{
    pageNumber: number;
    pageText?: string | null;
    pageImageUrl?: string | null;
  }>;
  /** Resume from this 1-based page index (inclusive). */
  resumeFromPage?: number;
};

function toRagReady(result: DocumentExtractionResult["questions"]) {
  return result.map((q) => ({
    questionId: q.id,
    stem: q.versions.quizReady.stem || q.versions.normalized.stem,
    choices: q.versions.quizReady.choices,
    answerStatus: q.answer.status,
    origin: q.origin,
    pageNumbers: q.source.pageNumbers,
    usabilityStatus: q.usabilityStatus,
  }));
}

function mergePageResults(
  documentId: string,
  pageCount: number,
  pages: PageExtractionResult[],
): DocumentExtractionResult {
  const questions = pages.flatMap((p) => p.questions);
  const regions = pages.flatMap((p) => p.regions);
  const evidence = pages.flatMap((p) => p.evidence);
  const warnings = pages.flatMap((p) =>
    p.notes.map((n) => `page ${p.pageNumber}: ${n}`),
  );

  return documentExtractionResultSchema.parse({
    documentId,
    pageCount,
    questions,
    regions,
    evidence,
    ragReady: toRagReady(questions),
    warnings,
  });
}

/**
 * Incremental document extraction pipeline.
 * Processes pages one-by-one so large PDFs can resume after failure.
 */
export const processDocumentTask = task({
  id: "process-document",
  maxDuration: 3600,
  run: async (payload: ProcessDocumentPayload): Promise<DocumentExtractionResult> => {
    const sorted = [...payload.pages].sort((a, b) => a.pageNumber - b.pageNumber);
    const startPage = payload.resumeFromPage ?? sorted[0]?.pageNumber ?? 1;
    const toProcess = sorted.filter((p) => p.pageNumber >= startPage);

    logger.info("Starting document extraction", {
      documentId: payload.documentId,
      pageCount: sorted.length,
      resumeFromPage: startPage,
      processing: toProcess.length,
    });

    const pageResults: PageExtractionResult[] = [];

    for (const page of toProcess) {
      const nearby = sorted
        .filter(
          (p) =>
            p.pageNumber !== page.pageNumber &&
            Math.abs(p.pageNumber - page.pageNumber) <= 1,
        )
        .map((p) => ({
          pageNumber: p.pageNumber,
          textPreview: (p.pageText ?? "").slice(0, 500),
        }));

      logger.info("Processing page", {
        documentId: payload.documentId,
        pageNumber: page.pageNumber,
      });

      const result = await extractPageTask.triggerAndWait({
        documentId: payload.documentId,
        pageNumber: page.pageNumber,
        pageText: page.pageText,
        pageImageUrl: page.pageImageUrl,
        nearbyPageHints: nearby,
      });

      if (!result.ok) {
        throw new Error(
          `extract-page failed for page ${page.pageNumber}: ${result.error}`,
        );
      }

      pageResults.push(result.output);
    }

    const merged = mergePageResults(
      payload.documentId,
      sorted.length,
      pageResults,
    );

    logger.info("Document extraction complete", {
      documentId: payload.documentId,
      questions: merged.questions.length,
      regions: merged.regions.length,
      warnings: merged.warnings.length,
    });

    return merged;
  },
});
