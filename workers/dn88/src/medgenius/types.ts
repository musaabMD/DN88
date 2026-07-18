import type { PlanTier } from "./config/plans";

export type ProcessingStatus =
  | "pending"
  | "uploading"
  | "parsing"
  | "extracting"
  | "embedding"
  | "completed"
  | "failed";

export type ProcessingStage =
  | "parse"
  | "extract_questions"
  | "extract_topics"
  | "generate_embeddings"
  | "detect_duplicates"
  | "generate_flashcards";

export type VerificationStatus =
  | "unverified"
  | "needs_review"
  | "verified"
  | "conflict";

export type StudyMode =
  | "quiz"
  | "timed"
  | "subject"
  | "weak_topic"
  | "incorrect"
  | "mixed"
  | "custom"
  | "random";

export type MedGeniusUserRow = {
  user_id: string;
  email: string | null;
  plan: PlanTier;
  credits_balance: number;
  credits_used_month: number;
  credits_month_key: string;
  documents_count: number;
  pages_processed: number;
  daily_ai_tokens: number;
  daily_tokens_key: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  user_id: string;
  exam_id: string | null;
  name: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  file_hash: string;
  page_count: number;
  r2_original_key: string;
  r2_markdown_key: string | null;
  processing_status: ProcessingStatus;
  processing_progress: number;
  processing_error: string | null;
  context_dev_job_id: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionRow = {
  id: string;
  user_id: string;
  document_id: string;
  original_text: string;
  cleaned_text: string | null;
  options_json: string;
  correct_answer: number | null;
  ai_confidence: number | null;
  explanation: string | null;
  topic: string | null;
  subtopic: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  source_page: number | null;
  tags_json: string;
  duplicate_group_id: string | null;
  verification_status: VerificationStatus;
  conflict_recall_answer: number | null;
  conflict_ai_answer: number | null;
  conflict_confidence: number | null;
  bookmark_count: number;
  stats_correct: number;
  stats_incorrect: number;
  stats_skipped: number;
  vector_id: string | null;
  created_at: string;
  updated_at: string;
};

export type QueueMessage = {
  jobId: string;
  documentId: string;
  userId: string;
  stage: ProcessingStage;
};

export type ExtractedQuestion = {
  originalText: string;
  cleanedText?: string;
  options: string[];
  correctAnswer?: number;
  confidence?: number;
  explanation?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: "easy" | "medium" | "hard";
  page?: number;
  tags?: string[];
  images?: Array<{
    r2Key?: string;
    page?: number;
    type?: string;
    position?: number;
    alt?: string;
  }>;
};

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CreditCheckResult =
  | { ok: true; reserved: number }
  | { ok: false; error: string; code: "INSUFFICIENT_CREDITS" | "LIMIT_EXCEEDED" | "RATE_LIMITED" };
