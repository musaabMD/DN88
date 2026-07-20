import type {
  ChunkClassification,
  ContentType,
  ExtractionResult,
  McqCorrectAnswer,
  McqOption,
  McqQuality,
  McqSource,
  McqStatus,
  StructuredMcq,
  UnresolvedFragment,
} from "./types";

type RawClassification = {
  content_type: ContentType;
  contains_existing_mcqs: boolean;
  should_use_vision: boolean;
  estimated_question_count: number;
  reason: string;
};

type RawExtraction = {
  document?: {
    content_type?: ContentType;
    language?: string;
    processing_warnings?: string[];
  };
  questions?: RawQuestion[];
  unresolved_fragments?: RawFragment[];
};

type RawQuestion = {
  id?: string;
  mode?: "extracted" | "generated";
  status?: McqStatus;
  stem?: string;
  options?: Array<{ label?: string; text?: string | null }>;
  correct_answer?: {
    label?: string;
    text?: string | null;
    confidence?: number;
    evidence?: string;
  } | null;
  explanation?: string | null;
  topic?: string | null;
  source?: { page?: number | null; chunk_id?: string; quote?: string };
  quality?: {
    stem_complete?: boolean;
    options_complete?: boolean;
    answer_explicit?: boolean;
    contains_source_uncertainty?: boolean;
    needs_review?: boolean;
    issues?: string[];
  };
};

type RawFragment = {
  text?: string;
  reason?: string;
  page?: number | null;
  chunk_id?: string;
};

export function parseClassification(raw: unknown): ChunkClassification {
  const data = raw as RawClassification;
  return {
    contentType: data.content_type ?? "no_useful_mcqs",
    containsExistingMcqs: Boolean(data.contains_existing_mcqs),
    shouldUseVision: Boolean(data.should_use_vision),
    estimatedQuestionCount: Math.max(0, data.estimated_question_count ?? 0),
    reason: data.reason ?? "",
  };
}

export function parseExtractionResult(raw: unknown, chunkId: string): ExtractionResult {
  const data = raw as RawExtraction;
  const questions = (data.questions ?? [])
    .map((q, index) => parseQuestion(q, chunkId, index))
    .filter((q): q is StructuredMcq => q !== null);

  return {
    document: {
      contentType: data.document?.content_type ?? "mixed_notes_and_mcqs",
      language: data.document?.language ?? "en",
      processingWarnings: data.document?.processing_warnings ?? [],
    },
    questions,
    unresolvedFragments: (data.unresolved_fragments ?? []).map((f) => parseFragment(f, chunkId)),
  };
}

function parseQuestion(raw: RawQuestion, chunkId: string, index: number): StructuredMcq | null {
  const stem = raw.stem?.trim();
  if (!stem || stem.length < 8) return null;
  if (raw.status === "not_an_mcq") return null;

  const options: McqOption[] = (raw.options ?? []).map((opt, i) => ({
    label: opt.label ?? String.fromCharCode(65 + i),
    text: opt.text ?? null,
  }));

  const correctAnswer = parseCorrectAnswer(raw.correct_answer);
  const quality = parseQuality(raw.quality);
  const source: McqSource = {
    page: raw.source?.page ?? null,
    chunkId: raw.source?.chunk_id ?? chunkId,
    quote: raw.source?.quote ?? stem.slice(0, 200),
  };

  return {
    id: raw.id ?? `${chunkId}_q${String(index + 1).padStart(2, "0")}`,
    mode: raw.mode ?? "extracted",
    status: raw.status ?? "complete",
    stem,
    options,
    correctAnswer,
    explanation: raw.explanation ?? null,
    topic: raw.topic ?? null,
    source,
    quality,
  };
}

function parseCorrectAnswer(raw: RawQuestion["correct_answer"]): McqCorrectAnswer | null {
  if (!raw?.label) return null;
  return {
    label: raw.label,
    text: raw.text ?? null,
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0,
    evidence: raw.evidence ?? "",
  };
}

function parseQuality(raw: RawQuestion["quality"]): McqQuality {
  return {
    stemComplete: raw?.stem_complete ?? true,
    optionsComplete: raw?.options_complete ?? true,
    answerExplicit: raw?.answer_explicit ?? false,
    containsSourceUncertainty: raw?.contains_source_uncertainty ?? false,
    needsReview: raw?.needs_review ?? false,
    issues: raw?.issues ?? [],
  };
}

function parseFragment(raw: RawFragment, chunkId: string): UnresolvedFragment {
  return {
    text: raw.text ?? "",
    reason: raw.reason ?? "Could not reconstruct",
    page: raw.page ?? null,
    chunkId: raw.chunk_id ?? chunkId,
  };
}

export function validateQuestion(question: StructuredMcq): string[] {
  const issues: string[] = [...question.quality.issues];
  const labels = new Set(question.options.map((option) => option.label));

  if (question.correctAnswer?.label && !labels.has(question.correctAnswer.label)) {
    issues.push("Correct answer does not match an existing option");
  }

  if (question.options.length < 2) {
    issues.push("Fewer than two options");
  }

  if (question.stem.trim().length < 15) {
    issues.push("Stem may be incomplete");
  }

  const emptyOptions = question.options.filter((option) => !option.text?.trim());
  if (emptyOptions.length > 0) {
    issues.push(`${emptyOptions.length} options are missing`);
  }

  if (question.status === "answer_ambiguous" || question.status === "conflicting_answer") {
    issues.push(`Status: ${question.status}`);
  }

  return [...new Set(issues)];
}

export function applyValidation(question: StructuredMcq): StructuredMcq {
  const issues = validateQuestion(question);
  if (issues.length === 0) return question;

  return {
    ...question,
    quality: {
      ...question.quality,
      needsReview: true,
      issues: [...new Set([...question.quality.issues, ...issues])],
    },
  };
}

export function shouldIncludeQuestion(
  question: StructuredMcq,
  incompletePolicy: "keep_for_review" | "exclude"
): boolean {
  if (question.status === "not_an_mcq") return false;
  if (incompletePolicy === "keep_for_review") return true;
  return question.status === "complete" && !question.quality.needsReview;
}

export function dedupeQuestions(questions: StructuredMcq[]): StructuredMcq[] {
  const seen = new Map<string, StructuredMcq>();
  for (const q of questions) {
    const key = q.stem
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s?]/g, "")
      .trim()
      .slice(0, 240);
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, q);
      continue;
    }
    const existingScore = scoreQuestion(existing);
    const newScore = scoreQuestion(q);
    if (newScore > existingScore) seen.set(key, q);
  }
  return [...seen.values()];
}

function scoreQuestion(q: StructuredMcq): number {
  let score = 0;
  if (q.status === "complete") score += 10;
  if (q.correctAnswer) score += q.correctAnswer.confidence * 5;
  if (q.quality.optionsComplete) score += 3;
  if (!q.quality.needsReview) score += 2;
  return score;
}
