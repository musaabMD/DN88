import type { ExtractedQuestion } from "../types";
import type { StructuredMcq } from "./types";

const LABEL_TO_INDEX: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
};

export function structuredMcqToExtracted(question: StructuredMcq): ExtractedQuestion {
  const options = question.options.map((opt) => opt.text?.trim() ?? opt.label);

  let correctAnswer: number | undefined;
  let confidence = question.correctAnswer?.confidence;

  if (question.correctAnswer?.label) {
    const idx = LABEL_TO_INDEX[question.correctAnswer.label.toUpperCase()];
    if (idx !== undefined && idx < options.length) {
      correctAnswer = idx;
    }
  }

  const tags: string[] = [];
  if (question.mode === "generated") tags.push("generated");
  if (question.quality.containsSourceUncertainty) tags.push("uncertain_recall");
  if (question.quality.needsReview) tags.push("needs_review");
  if (question.status !== "complete") tags.push(question.status);

  if (
    question.status === "answer_ambiguous" ||
    question.status === "answer_missing" ||
    question.status === "conflicting_answer"
  ) {
    confidence = Math.min(confidence ?? 0.3, 0.4);
    if (question.status === "answer_missing") correctAnswer = undefined;
  }

  if (question.quality.needsReview && confidence !== undefined) {
    confidence = Math.min(confidence, 0.49);
  }

  return {
    originalText: question.stem,
    cleanedText: question.stem,
    options,
    correctAnswer,
    confidence,
    explanation: question.explanation ?? undefined,
    topic: question.topic ?? undefined,
    page: question.source.page ?? undefined,
    tags,
  };
}

export function structuredMcqsToExtracted(questions: StructuredMcq[]): ExtractedQuestion[] {
  return questions.map(structuredMcqToExtracted);
}

export function categorizeQuestions(questions: StructuredMcq[]): {
  quizReady: StructuredMcq[];
  needsReview: StructuredMcq[];
  incompleteRecall: StructuredMcq[];
  generatedFromNotes: StructuredMcq[];
  rejected: StructuredMcq[];
} {
  const quizReady: StructuredMcq[] = [];
  const needsReview: StructuredMcq[] = [];
  const incompleteRecall: StructuredMcq[] = [];
  const generatedFromNotes: StructuredMcq[] = [];
  const rejected: StructuredMcq[] = [];

  for (const q of questions) {
    if (q.status === "not_an_mcq") {
      rejected.push(q);
      continue;
    }
    if (q.mode === "generated") {
      generatedFromNotes.push(q);
      if (q.status === "complete" && !q.quality.needsReview) quizReady.push(q);
      else needsReview.push(q);
      continue;
    }
    if (
      q.status === "incomplete_stem" ||
      q.status === "incomplete_options" ||
      q.quality.containsSourceUncertainty
    ) {
      incompleteRecall.push(q);
      needsReview.push(q);
      continue;
    }
    if (q.quality.needsReview || q.status !== "complete") {
      needsReview.push(q);
      continue;
    }
    quizReady.push(q);
  }

  return { quizReady, needsReview, incompleteRecall, generatedFromNotes, rejected };
}
