import { logger, task } from "@trigger.dev/sdk";
import {
  EXTRACTION_SYSTEM_PROMPT,
  PAGE_EXTRACTION_JSON_SHAPE,
} from "../src/lib/rag/prompts";
import {
  pageExtractionResultSchema,
  type PageExtractionResult,
} from "../src/lib/rag/schemas";
import { chatCompletionJson, parseLlmJson } from "./lib/openrouter";

export type ExtractPagePayload = {
  documentId: string;
  pageNumber: number;
  /** Native PDF text for this page, if available. */
  pageText?: string | null;
  /** Data URL or HTTPS URL of a high-resolution page render. */
  pageImageUrl?: string | null;
  /** Optional nearby-page hints for continuation / duplicates. */
  nearbyPageHints?: Array<{
    pageNumber: number;
    textPreview: string;
  }>;
};

function emptyPageResult(pageNumber: number, note: string): PageExtractionResult {
  return pageExtractionResultSchema.parse({
    pageNumber,
    regions: [],
    questions: [],
    evidence: [],
    notes: [note],
  });
}

export const extractPageTask = task({
  id: "extract-page",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: ExtractPagePayload): Promise<PageExtractionResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      logger.warn("OPENROUTER_API_KEY missing — returning empty page result");
      return emptyPageResult(
        payload.pageNumber,
        "OPENROUTER_API_KEY not configured in Trigger.dev environment",
      );
    }

    if (!payload.pageImageUrl && !payload.pageText?.trim()) {
      return emptyPageResult(
        payload.pageNumber,
        "No page image or text provided",
      );
    }

    const userParts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: [
          `Document ID: ${payload.documentId}`,
          `Page number: ${payload.pageNumber}`,
          "",
          "Return JSON matching this shape (fill with real extractions regions/questions):",
          PAGE_EXTRACTION_JSON_SHAPE,
          "",
          "Native PDF text for this page (may be incomplete):",
          payload.pageText?.trim() || "(none)",
          "",
          payload.nearbyPageHints?.length
            ? `Nearby page hints:\n${payload.nearbyPageHints
                .map((h) => `- p${h.pageNumber}: ${h.textPreview.slice(0, 400)}`)
                .join("\n")}`
            : "Nearby page hints: (none)",
        ].join("\n"),
      },
    ];

    if (payload.pageImageUrl) {
      userParts.push({
        type: "image_url",
        image_url: { url: payload.pageImageUrl },
      });
    }

    logger.info("Extracting page", {
      documentId: payload.documentId,
      pageNumber: payload.pageNumber,
      hasImage: Boolean(payload.pageImageUrl),
      textLength: payload.pageText?.length ?? 0,
    });

    const { content, model, tokensUsed } = await chatCompletionJson({
      apiKey,
      system: EXTRACTION_SYSTEM_PROMPT,
      user: userParts,
      maxTokens: 8192,
    });

    logger.info("Page extraction LLM response", { model, tokensUsed });

    const parsed = parseLlmJson(content);
    const withPage =
      typeof parsed === "object" && parsed !== null
        ? { pageNumber: payload.pageNumber, ...(parsed as object) }
        : { pageNumber: payload.pageNumber, regions: [], questions: [], evidence: [] };

    const result = pageExtractionResultSchema.safeParse(withPage);
    if (!result.success) {
      logger.error("Page extraction Zod validation failed", {
        issues: result.error.issues,
      });
      return emptyPageResult(
        payload.pageNumber,
        `Validation failed: ${result.error.issues
          .slice(0, 5)
          .map((i) => i.message)
          .join("; ")}`,
      );
    }

    // Stamp documentId onto every question that omitted it.
    const questions = result.data.questions.map((q) => ({
      ...q,
      source: {
        ...q.source,
        documentId: q.source.documentId || payload.documentId,
        pageNumbers:
          q.source.pageNumbers.length > 0
            ? q.source.pageNumbers
            : [payload.pageNumber],
      },
    }));

    return {
      ...result.data,
      questions,
    };
  },
});
