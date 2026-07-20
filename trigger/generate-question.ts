import { logger, task } from "@trigger.dev/sdk";
import { GENERATION_SYSTEM_PROMPT } from "../src/lib/rag/prompts";
import {
  generatedQuestionSchema,
  type GeneratedQuestion,
} from "../src/lib/rag/schemas";
import { chatCompletionJson, parseLlmJson } from "./lib/openrouter";

export type GenerateQuestionPayload = {
  documentId: string;
  generationReason:
    | "no_question_present"
    | "missing_choices"
    | "question_unusable"
    | "user_requested_generation";
  sourcePageNumbers: number[];
  sourceRegionIds: string[];
  sourceAssetIds: string[];
  sourceText: string;
  sourceImageUrls?: string[];
};

export const generateQuestionTask = task({
  id: "generate-question",
  run: async (payload: GenerateQuestionPayload): Promise<GeneratedQuestion> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured in Trigger.dev environment");
    }

    const userParts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: [
          `Document ID: ${payload.documentId}`,
          `Generation reason: ${payload.generationReason}`,
          `Source pages: ${payload.sourcePageNumbers.join(", ")}`,
          `Source region IDs: ${payload.sourceRegionIds.join(", ") || "(none)"}`,
          `Source asset IDs: ${payload.sourceAssetIds.join(", ") || "(none)"}`,
          "",
          "Source material:",
          payload.sourceText,
          "",
          "Return JSON with keys: origin, generationReason, sourcePageNumbers,",
          "sourceRegionIds, sourceAssetIds, stem, choices, correctChoiceId,",
          "explanation, groundingConfidence, reviewStatus.",
          'origin must be "generated". reviewStatus must be "required".',
        ].join("\n"),
      },
    ];

    for (const url of payload.sourceImageUrls ?? []) {
      userParts.push({ type: "image_url", image_url: { url } });
    }

    logger.info("Generating MCQ from reference material", {
      documentId: payload.documentId,
      reason: payload.generationReason,
      pages: payload.sourcePageNumbers,
    });

    const { content, model, tokensUsed } = await chatCompletionJson({
      apiKey,
      system: GENERATION_SYSTEM_PROMPT,
      user: userParts,
      maxTokens: 4096,
    });

    logger.info("Generation LLM response", { model, tokensUsed });

    const parsed = parseLlmJson(content);
    const candidate =
      typeof parsed === "object" && parsed !== null
        ? {
            origin: "generated" as const,
            generationReason: payload.generationReason,
            sourcePageNumbers: payload.sourcePageNumbers,
            sourceRegionIds: payload.sourceRegionIds,
            sourceAssetIds: payload.sourceAssetIds,
            reviewStatus: "required" as const,
            ...(parsed as object),
          }
        : null;

    const result = generatedQuestionSchema.safeParse(candidate);
    if (!result.success) {
      throw new Error(
        `Generated question validation failed: ${result.error.issues
          .map((i) => i.message)
          .join("; ")}`,
      );
    }

    return result.data;
  },
});
