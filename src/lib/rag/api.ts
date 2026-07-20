import { getApiBaseUrl } from "@/lib/api";
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
  projectRef: string;
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
