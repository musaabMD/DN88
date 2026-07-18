import { getApiBaseUrl } from "@/lib/api";
import { sanitizeUserError } from "./errors";

export type CreditSummary = {
  plan: "free" | "starter" | "student" | "pro";
  creditsBalance: number;
  creditsUsedMonth: number;
  creditsMonthlyLimit: number;
  documentsCount: number;
  documentsLimit: number;
  pagesProcessed: number;
  pagesLimit: number;
  dailyAiTokens: number;
  dailyAiTokensLimit: number;
};

export type MedGeniusDocument = {
  id: string;
  examId: string | null;
  name: string;
  originalFilename?: string;
  pageCount: number;
  status: string;
  progress: number;
  error: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type MedGeniusQuestion = {
  id: string;
  documentId: string;
  originalText: string;
  cleanedText: string | null;
  options: string[];
  correctAnswer: number | null;
  aiConfidence: number | null;
  explanation: string | null;
  topic: string | null;
  subtopic: string | null;
  difficulty: string | null;
  sourcePage: number | null;
  tags: string[];
  verificationStatus: string;
  stats: { correct: number; incorrect: number; skipped: number };
  images: Array<Record<string, unknown>>;
};

export type AiChatResponse = {
  conversationId: string;
  messageId: string;
  reply: string;
  tokensUsed: number;
  creditsRemaining: number;
};

export class MedGeniusApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "MedGeniusApiError";
    this.status = status;
    this.code = code;
  }
}

async function medgeniusFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit
): Promise<T> {
  if (!token) {
    throw new MedGeniusApiError("Sign in required", 401, "AUTH_REQUIRED");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/medgenius${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as T & { error?: string; code?: string };

  if (!response.ok) {
    const kind =
      response.status === 402
        ? "credits"
        : path.includes("upload")
          ? "upload"
          : path.includes("ai/chat")
            ? "ai"
            : "default";
    throw new MedGeniusApiError(
      sanitizeUserError(payload.error ?? "Request failed", kind),
      response.status,
      payload.code
    );
  }

  return payload;
}

export async function fetchCredits(token: string | null): Promise<CreditSummary> {
  return medgeniusFetch<CreditSummary>("/credits", token);
}

export async function fetchDocuments(
  token: string | null,
  examId?: string
): Promise<{ documents: MedGeniusDocument[] }> {
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : "";
  return medgeniusFetch(`/documents${query}`, token);
}

export async function uploadDocument(
  token: string | null,
  params: { file: File; name: string; examId?: string }
): Promise<{
  documentId: string;
  duplicate: boolean;
  status?: string;
  message?: string;
  credits?: CreditSummary;
}> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("name", params.name);
  if (params.examId) formData.append("examId", params.examId);

  return medgeniusFetch("/documents/upload", token, {
    method: "POST",
    body: formData,
  });
}

export async function fetchDocumentStatus(
  token: string | null,
  documentId: string
): Promise<MedGeniusDocument> {
  return medgeniusFetch(`/documents/${documentId}`, token);
}

export async function fetchQuestions(
  token: string | null,
  params?: {
    documentId?: string;
    topic?: string;
    bookmarked?: boolean;
    incorrect?: boolean;
    limit?: number;
  }
): Promise<{ questions: MedGeniusQuestion[] }> {
  const search = new URLSearchParams();
  if (params?.documentId) search.set("documentId", params.documentId);
  if (params?.topic) search.set("topic", params.topic);
  if (params?.bookmarked) search.set("bookmarked", "true");
  if (params?.incorrect) search.set("incorrect", "true");
  if (params?.limit) search.set("limit", String(params.limit));
  const q = search.toString();
  return medgeniusFetch(`/questions${q ? `?${q}` : ""}`, token);
}

export async function searchQuestions(
  token: string | null,
  query: string
): Promise<{ questions: MedGeniusQuestion[] }> {
  return medgeniusFetch(`/search?q=${encodeURIComponent(query)}`, token);
}

export async function sendAiChat(
  token: string | null,
  params: {
    message: string;
    conversationId?: string;
    contextType?: "general" | "document" | "question" | "topic" | "search";
    contextId?: string;
    questionText?: string;
    language?: "en" | "ar";
    mode?: "explain" | "easier" | "harder" | "evidence" | "eli5" | "visual";
  }
): Promise<AiChatResponse> {
  return medgeniusFetch("/ai/chat", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function fetchFlashcards(
  token: string | null,
  documentId?: string
): Promise<{
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
    highYieldFact?: string;
    memoryTrick?: string;
    topic?: string;
  }>;
}> {
  const q = documentId ? `?documentId=${encodeURIComponent(documentId)}` : "";
  return medgeniusFetch(`/flashcards${q}`, token);
}

export async function fetchAnalytics(token: string | null): Promise<{
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  totalStudySec: number;
  weakTopics: Array<{ topic: string; correct: number; incorrect: number }>;
}> {
  return medgeniusFetch("/analytics", token);
}

export async function recordAttempt(
  token: string | null,
  sessionId: string,
  params: {
    questionId: string;
    selectedAnswer?: number;
    timeSec?: number;
    flagged?: boolean;
  }
): Promise<{ ok: boolean; isCorrect: boolean }> {
  return medgeniusFetch(`/sessions/${sessionId}/attempts`, token, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createStudySession(
  token: string | null,
  params: {
    mode?: string;
    title?: string;
    documentId?: string;
    examId?: string;
    questionIds?: string[];
  }
): Promise<{ sessionId: string; status: string }> {
  return medgeniusFetch("/sessions", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function bookmarkQuestion(
  token: string | null,
  questionId: string,
  label = "bookmark"
): Promise<{ ok: boolean }> {
  return medgeniusFetch("/bookmarks", token, {
    method: "POST",
    body: JSON.stringify({ questionId, label }),
  });
}

export async function buildExam(
  token: string | null,
  params: {
    mode?: string;
    documentId?: string;
    examId?: string;
    topic?: string;
    limit?: number;
    title?: string;
  }
): Promise<{
  sessionId: string;
  questionIds: string[];
  questions: MedGeniusQuestion[];
}> {
  return medgeniusFetch("/exam/build", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function fetchCollections(token: string | null) {
  return medgeniusFetch<{ collections: Array<{ id: string; name: string; itemCount: number }> }>(
    "/collections",
    token
  );
}

export async function fetchSummaries(token: string | null, documentId: string) {
  return medgeniusFetch<{ summaries: Array<{ id: string; type: string; content: string }> }>(
    `/summaries?documentId=${encodeURIComponent(documentId)}`,
    token
  );
}

export async function fetchDueSrs(token: string | null) {
  return medgeniusFetch<{ questions: MedGeniusQuestion[] }>("/srs/due", token);
}

export async function recordSrsReview(
  token: string | null,
  questionId: string,
  quality = 3
): Promise<{ ok: boolean }> {
  return medgeniusFetch("/srs/review", token, {
    method: "POST",
    body: JSON.stringify({ questionId, quality }),
  });
}

export async function completeStudySession(
  token: string | null,
  sessionId: string,
  params: { durationSec?: number; correctCount?: number; answeredCount?: number }
): Promise<{ ok: boolean }> {
  return medgeniusFetch(`/sessions/${sessionId}/complete`, token, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function fetchStudySessions(token: string | null) {
  return medgeniusFetch<{
    sessions: Array<{
      id: string;
      mode: string;
      title: string;
      status: string;
      total_questions: number;
      correct_count: number;
      answered_count: number;
      duration_sec: number;
      started_at: string;
    }>;
  }>("/sessions", token);
}

export async function createCollection(
  token: string | null,
  name: string
): Promise<{ id: string; name: string }> {
  return medgeniusFetch("/collections", token, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function addCollectionItem(
  token: string | null,
  collectionId: string,
  documentId: string
): Promise<{ ok: boolean }> {
  return medgeniusFetch(`/collections/${collectionId}/items`, token, {
    method: "POST",
    body: JSON.stringify({ documentId }),
  });
}

export async function fetchCollectionQuestions(
  token: string | null,
  collectionId: string
): Promise<{ questions: MedGeniusQuestion[] }> {
  return medgeniusFetch(`/collections/${collectionId}/questions`, token);
}

export async function deleteCollection(
  token: string | null,
  collectionId: string
): Promise<{ ok: boolean }> {
  return medgeniusFetch(`/collections/${collectionId}`, token, { method: "DELETE" });
}

export async function fetchDocumentMarkdown(
  token: string | null,
  documentId: string
): Promise<{ markdown: string; pageCount: number }> {
  return medgeniusFetch(`/documents/${documentId}/markdown`, token);
}
