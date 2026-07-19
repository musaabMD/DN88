export type PlanTier = "free" | "starter" | "student" | "pro";

export type PlanLimits = {
  monthlyCredits: number;
  maxDocuments: number;
  maxPages: number;
  dailyAiTokens: number;
  maxUploadBytes: number;
  priorityProcessing: boolean;
  aiQuestionVerification: boolean;
  aiGeneratedQuestions: boolean;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    monthlyCredits: 10_000,
    maxDocuments: 10,
    maxPages: 500,
    dailyAiTokens: 8_000,
    maxUploadBytes: 10 * 1024 * 1024,
    priorityProcessing: false,
    aiQuestionVerification: false,
    aiGeneratedQuestions: false,
  },
  starter: {
    monthlyCredits: 1_000,
    maxDocuments: 5,
    maxPages: 100,
    dailyAiTokens: 15_000,
    maxUploadBytes: 25 * 1024 * 1024,
    priorityProcessing: false,
    aiQuestionVerification: false,
    aiGeneratedQuestions: false,
  },
  student: {
    monthlyCredits: 50_000,
    maxDocuments: 100,
    maxPages: 5_000,
    dailyAiTokens: 100_000,
    maxUploadBytes: 50 * 1024 * 1024,
    priorityProcessing: false,
    aiQuestionVerification: false,
    aiGeneratedQuestions: false,
  },
  pro: {
    monthlyCredits: 200_000,
    maxDocuments: 10_000,
    maxPages: 100_000,
    dailyAiTokens: 500_000,
    maxUploadBytes: 100 * 1024 * 1024,
    priorityProcessing: true,
    aiQuestionVerification: true,
    aiGeneratedQuestions: true,
  },
};

/** Credit costs per operation — never allow spending beyond balance */
export const CREDIT_COSTS = {
  pageParse: 10,
  questionExtract: 3,
  embeddingChunk: 1,
  duplicateDetection: 15,
  flashcardGenerate: 20,
  summaryGenerate: 30,
  aiChatBase: 5,
  aiChatPer1kTokens: 8,
  questionCleanup: 10,
  topicExtraction: 25,
  aiGeneratedQuestion: 40,
  conflictDetection: 12,
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;

export function resolvePlan(metadata: Record<string, unknown> | undefined): PlanTier {
  const plan = metadata?.plan;
  if (plan === "pro" || plan === "student" || plan === "starter" || plan === "free") {
    return plan;
  }
  const subscription = metadata?.subscription;
  if (subscription === "pro") return "pro";
  if (subscription === "student") return "student";
  return "free";
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentDayKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}
