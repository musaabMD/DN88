import { chatCompletion, parseLlmJsonContent } from "../medgenius/services/openrouter";
import {
  PAGE_EXTRACTION_JSON_SHAPE,
  RAG_EXTRACTION_SYSTEM_PROMPT,
} from "./prompts";

export type RagPageInput = {
  documentId: string;
  pageNumber: number;
  pageText?: string | null;
  pageImageUrl?: string | null;
  nearbyPageHints?: Array<{ pageNumber: number; textPreview: string }>;
};

export type RagPageResult = {
  pageNumber: number;
  regions: unknown[];
  questions: unknown[];
  evidence: unknown[];
  notes: string[];
};

function emptyPage(pageNumber: number, note: string): RagPageResult {
  return {
    pageNumber,
    regions: [],
    questions: [],
    evidence: [],
    notes: [note],
  };
}

export async function extractRagPage(
  apiKey: string,
  input: RagPageInput,
): Promise<RagPageResult> {
  if (!input.pageImageUrl && !input.pageText?.trim()) {
    return emptyPage(input.pageNumber, "No page image or text provided");
  }

  const userParts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: [
        `Document ID: ${input.documentId}`,
        `Page number: ${input.pageNumber}`,
        "",
        "Return JSON matching this shape:",
        PAGE_EXTRACTION_JSON_SHAPE,
        "",
        "Native PDF text for this page (may be incomplete):",
        input.pageText?.trim() || "(none)",
        "",
        input.nearbyPageHints?.length
          ? `Nearby page hints:\n${input.nearbyPageHints
              .map((h) => `- p${h.pageNumber}: ${h.textPreview.slice(0, 400)}`)
              .join("\n")}`
          : "Nearby page hints: (none)",
      ].join("\n"),
    },
  ];

  if (input.pageImageUrl) {
    userParts.push({
      type: "image_url",
      image_url: { url: input.pageImageUrl },
    });
  }

  const { content } = await chatCompletion(
    apiKey,
    [
      { role: "system", content: RAG_EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: userParts },
    ],
    {
      model: "google/gemini-2.0-flash-001",
      maxTokens: 8192,
      temperature: 0.1,
      jsonMode: true,
    },
  );

  const parsed = parseLlmJsonContent(content);
  const record =
    typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};

  const questions = Array.isArray(record.questions) ? record.questions : [];
  const regions = Array.isArray(record.regions) ? record.regions : [];
  const evidence = Array.isArray(record.evidence) ? record.evidence : [];
  const notes = Array.isArray(record.notes)
    ? record.notes.filter((n): n is string => typeof n === "string")
    : [];

  const stampedQuestions = questions.map((q, index) => {
    if (typeof q !== "object" || q === null) return q;
    const question = q as Record<string, unknown>;
    const source =
      typeof question.source === "object" && question.source !== null
        ? (question.source as Record<string, unknown>)
        : {};
    return {
      ...question,
      id:
        typeof question.id === "string"
          ? question.id
          : `q_${input.documentId}_${String(input.pageNumber).padStart(3, "0")}_${String(index + 1).padStart(2, "0")}`,
      source: {
        ...source,
        documentId:
          typeof source.documentId === "string" ? source.documentId : input.documentId,
        pageNumbers: Array.isArray(source.pageNumbers) && source.pageNumbers.length > 0
          ? source.pageNumbers
          : [input.pageNumber],
      },
    };
  });

  return {
    pageNumber: input.pageNumber,
    regions,
    questions: stampedQuestions,
    evidence,
    notes,
  };
}

export function mergeRagDocumentResult(
  documentId: string,
  pageCount: number,
  pages: RagPageResult[],
) {
  const questions = pages.flatMap((p) => p.questions);
  const regions = pages.flatMap((p) => p.regions);
  const evidence = pages.flatMap((p) => p.evidence);
  const warnings = pages.flatMap((p) =>
    p.notes.map((n) => `page ${p.pageNumber}: ${n}`),
  );

  const ragReady = questions
    .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
    .map((q) => {
      const versions =
        typeof q.versions === "object" && q.versions !== null
          ? (q.versions as Record<string, unknown>)
          : {};
      const quizReady =
        typeof versions.quizReady === "object" && versions.quizReady !== null
          ? (versions.quizReady as Record<string, unknown>)
          : {};
      const normalized =
        typeof versions.normalized === "object" && versions.normalized !== null
          ? (versions.normalized as Record<string, unknown>)
          : {};
      const answer =
        typeof q.answer === "object" && q.answer !== null
          ? (q.answer as Record<string, unknown>)
          : {};
      const source =
        typeof q.source === "object" && q.source !== null
          ? (q.source as Record<string, unknown>)
          : {};

      return {
        questionId: q.id,
        stem:
          (typeof quizReady.stem === "string" ? quizReady.stem : null) ??
          (typeof normalized.stem === "string" ? normalized.stem : ""),
        choices: Array.isArray(quizReady.choices) ? quizReady.choices : [],
        answerStatus: answer.status ?? "missing",
        origin: q.origin ?? "extracted",
        pageNumbers: Array.isArray(source.pageNumbers) ? source.pageNumbers : [],
        usabilityStatus: q.usabilityStatus ?? "needs_review",
      };
    });

  return {
    documentId,
    pageCount,
    questions,
    regions,
    evidence,
    ragReady,
    warnings,
  };
}
