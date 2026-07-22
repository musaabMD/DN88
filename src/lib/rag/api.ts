import { getApiBaseUrl } from "@/lib/api";
import { extractDocumentLocally } from "./local-extraction";
import type { DocumentExtractionResult } from "./schemas";

async function ragFetch<T>(
  token: string | null,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}/api/rag${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token ?? ""}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? `RAG API error (${response.status})`);
  }

  return data;
}

export type RagHealth = {
  ok: boolean;
  triggerConfigured: boolean;
  openRouterConfigured?: boolean;
  extractionMode?: "local" | "worker" | "trigger" | "worker_or_trigger" | "none";
  projectRef: string;
};

export type RagPageResult = {
  pageNumber: number;
  regions: DocumentExtractionResult["regions"];
  questions: DocumentExtractionResult["questions"];
  evidence: DocumentExtractionResult["evidence"];
  notes: string[];
};

export type RagTriggerResult = {
  runId: string;
  publicAccessToken: string | null;
  taskId: string;
  userId: string;
};

export type RagRunResponse = {
  run: {
    id: string;
    status: string;
    output?: DocumentExtractionResult | unknown;
    error?: { message?: string } | string | null;
    createdAt?: string;
    updatedAt?: string;
    finishedAt?: string | null;
  };
};

export function fetchRagHealth(token: string | null) {
  return ragFetch<RagHealth>(token, "/health");
}

export function triggerRagTask(
  token: string | null,
  taskId: string,
  payload: unknown,
) {
  return ragFetch<RagTriggerResult>(token, `/tasks/${taskId}/trigger`, {
    method: "POST",
    body: JSON.stringify({ payload }),
  });
}

export function fetchRagRun(token: string | null, runId: string) {
  return ragFetch<RagRunResponse>(token, `/runs/${runId}`);
}

export function extractRagPageWorker(
  token: string | null,
  payload: {
    documentId: string;
    pageNumber: number;
    pageText?: string | null;
    pageImageUrl?: string | null;
    nearbyPageHints?: Array<{ pageNumber: number; textPreview: string }>;
  },
) {
  return ragFetch<RagPageResult>(token, "/extract-page", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function mergeRagPageResults(
  documentId: string,
  pageCount: number,
  pages: RagPageResult[],
): DocumentExtractionResult {
  const questions = pages.flatMap((p) => p.questions);
  const regions = pages.flatMap((p) => p.regions);
  const evidence = pages.flatMap((p) => p.evidence);
  const warnings = pages.flatMap((p) =>
    p.notes.map((n) => `page ${p.pageNumber}: ${n}`),
  );

  return {
    documentId,
    pageCount,
    questions,
    regions,
    evidence,
    ragReady: questions.map((q) => ({
      questionId: q.id,
      stem: q.versions.quizReady.stem || q.versions.normalized.stem,
      choices: q.versions.quizReady.choices,
      answerStatus: q.answer.status,
      origin: q.origin,
      pageNumbers: q.source.pageNumbers,
      usabilityStatus: q.usabilityStatus,
    })),
    warnings,
  };
}

export async function extractDocumentViaWorker(
  token: string | null,
  documentId: string,
  pages: Array<{
    pageNumber: number;
    pageText?: string | null;
    pageImageUrl?: string | null;
  }>,
  onProgress?: (done: number, total: number) => void,
): Promise<DocumentExtractionResult> {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const pageResults: RagPageResult[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index]!;
    onProgress?.(index + 1, sorted.length);

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

    const result = await extractRagPageWorker(token, {
      documentId,
      pageNumber: page.pageNumber,
      pageText: page.pageText,
      pageImageUrl: page.pageImageUrl,
      nearbyPageHints: nearby,
    });
    pageResults.push(result);
  }

  return mergeRagPageResults(documentId, sorted.length, pageResults);
}

function mergeDocumentResults(
  documentId: string,
  results: DocumentExtractionResult[],
): DocumentExtractionResult {
  if (results.length === 0) {
    return {
      documentId,
      pageCount: 0,
      questions: [],
      regions: [],
      evidence: [],
      ragReady: [],
      warnings: [],
    };
  }

  return {
    documentId,
    pageCount: Math.max(...results.map((r) => r.pageCount)),
    questions: results.flatMap((r) => r.questions),
    regions: results.flatMap((r) => r.regions),
    evidence: results.flatMap((r) => r.evidence),
    ragReady: results.flatMap((r) => r.ragReady),
    warnings: results.flatMap((r) => r.warnings),
  };
}

const TRIGGER_BATCH_SIZE = 8;

async function pollRagRunUntilDone(
  token: string | null,
  runId: string,
  timeoutMs = 3_600_000,
): Promise<DocumentExtractionResult> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const { run } = await fetchRagRun(token, runId);
    const status = run.status?.toUpperCase() ?? "";

    if (status === "COMPLETED" && run.output) {
      return run.output as DocumentExtractionResult;
    }

    if (
      status === "FAILED" ||
      status === "CRASHED" ||
      status === "CANCELED" ||
      status === "SYSTEM_FAILURE" ||
      status === "TIMED_OUT"
    ) {
      const message =
        typeof run.error === "string"
          ? run.error
          : run.error?.message ?? `Trigger run ${status}`;
      throw new Error(message);
    }

    await new Promise((resolve) => window.setTimeout(resolve, 2500));
  }

  throw new Error("Trigger run timed out waiting for completion");
}

/** Uses Trigger.dev background jobs — batches pages internally for payload size. */
export async function extractDocumentViaTrigger(
  token: string | null,
  documentId: string,
  pages: Array<{
    pageNumber: number;
    pageText?: string | null;
    pageImageUrl?: string | null;
  }>,
  onProgress?: (done: number, total: number, status?: string) => void,
): Promise<DocumentExtractionResult> {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const batchResults: DocumentExtractionResult[] = [];
  let processedPages = 0;

  for (let offset = 0; offset < sorted.length; offset += TRIGGER_BATCH_SIZE) {
    const batch = sorted.slice(offset, offset + TRIGGER_BATCH_SIZE);
    onProgress?.(
      processedPages,
      sorted.length,
      `Trigger.dev processing pages ${batch[0]?.pageNumber ?? 1}–${batch[batch.length - 1]?.pageNumber ?? 1}…`,
    );

    const handle = await triggerRagTask(token, "process-document", {
      documentId,
      pages: batch,
      resumeFromPage: batch[0]?.pageNumber,
    });

    const result = await pollRagRunUntilDone(token, handle.runId);
    batchResults.push(result);
    processedPages += batch.length;
    onProgress?.(processedPages, sorted.length);
  }

  return mergeDocumentResults(documentId, batchResults);
}

export async function extractDocument(
  token: string | null,
  documentId: string,
  pages: Array<{
    pageNumber: number;
    pageText?: string | null;
    pageImageUrl?: string | null;
  }>,
  options: {
    preferTrigger: boolean;
    onProgress?: (done: number, total: number, status?: string) => void;
  },
): Promise<DocumentExtractionResult> {
  void token;
  void options.preferTrigger;
  options.onProgress?.(0, pages.length, "Extracting locally from PDF text…");
  const result = extractDocumentLocally(documentId, pages);
  options.onProgress?.(pages.length, pages.length, "Local extraction complete.");
  return result;
}

export const EXAMPLE_EXTRACTED_QUESTION = {
  id: "q_doc123_006_01",
  origin: "extracted" as const,
  source: {
    documentId: "doc123",
    pageNumbers: [6],
    regionIds: ["region_page6_stem", "region_page6_choices"],
    evidenceIds: ["evidence_recall", "evidence_screenshot"],
  },
  versions: {
    source: {
      stem: "Patient post partum distressed sob desaturated i think. Has +ve homan test What is the appropriate test for the preliminary diagnosis?",
      choices: [
        { id: "a", label: "A", text: "Venography" },
        { id: "b", label: "B", text: "D dimer" },
        { id: "c", label: "C", text: "Compression dopplar" },
      ],
    },
    normalized: {
      stem: "A postpartum patient is distressed, short of breath, and desaturated. She has a positive Homan sign. What is the appropriate preliminary diagnostic test?",
      choices: [
        { id: "a", label: "A", text: "Venography" },
        { id: "b", label: "B", text: "D-dimer" },
        { id: "c", label: "C", text: "Compression Doppler ultrasonography" },
      ],
    },
    quizReady: {
      stem: "A postpartum patient has calf symptoms suggestive of deep-vein thrombosis. What is the most appropriate initial diagnostic test?",
      choices: [
        { id: "a", label: "A", text: "Venography" },
        { id: "b", label: "B", text: "D-dimer" },
        { id: "c", label: "C", text: "Compression ultrasonography" },
      ],
    },
  },
  answer: {
    correctChoiceId: "c",
    sourceChoiceLabel: "D",
    status: "editor_confirmed" as const,
    rawAnswerText: "Answer: D",
    confidence: 0.91,
  },
  assets: [
    {
      id: "asset_page6_reference",
      role: "reference_material" as const,
      pageNumber: 6,
      boundingBox: { x: 45, y: 450, width: 1500, height: 430 },
      originalUrl: "/api/assets/asset_page6_reference",
      enhancedUrl: null,
      textTranscription: "A 32-year-old pregnant patient...",
    },
  ],
  completeness: {
    stemComplete: true,
    choicesComplete: true,
    imagePresentWhenRequired: true,
    answerPresent: true,
    missingParts: [] as string[],
    score: 0.93,
  },
  usabilityStatus: "needs_review" as const,
  confidence: {
    segmentation: 0.9,
    stem: 0.88,
    choices: 0.9,
    answer: 0.7,
    imageAssociation: 0.85,
    overall: 0.86,
  },
  warnings: [
    "Source recall and screenshot use different choice labels.",
    "Question wording was normalized using nearby screenshot evidence.",
  ],
  reviewStatus: "review_required" as const,
};
