import {
  buildExam,
  createStudySession,
  fetchQuestions,
  type MedGeniusQuestion,
} from "@/lib/medgenius/api";
import type { QuizMode, QuizSearchParams } from "@/lib/routes";
import type { QuestionItem, StudySet } from "@/lib/set-content";
import { liveDocumentId } from "./live-data";

export type ExamSessionMeta = {
  timedSeconds?: number;
  deferExplanation: boolean;
  mode: QuizMode | "quiz";
};

export function mapApiQuestion(q: MedGeniusQuestion, index: number): QuestionItem {
  const options = q.options.length >= 2 ? q.options : ["A", "B", "C", "D"];
  const answer =
    q.correctAnswer !== null && q.correctAnswer >= 0 && q.correctAnswer < options.length
      ? q.correctAnswer
      : 0;

  const status =
    q.stats.incorrect > q.stats.correct
      ? ("incorrect" as const)
      : q.stats.correct > 0
        ? ("correct" as const)
        : ("unused" as const);

  return {
    id: index + 1,
    subject: q.topic ?? "General",
    text: q.cleanedText?.trim() || q.originalText,
    options,
    answer,
    tag: q.difficulty ?? "Review",
    status,
    explanation: q.explanation?.trim() || "Review your source material.",
    citations: [],
    questionId: q.id,
  };
}

function studyModeForQuiz(mode: QuizMode | undefined): string {
  switch (mode) {
    case "incorrect":
      return "incorrect";
    case "timed":
    case "mock":
      return "timed";
    case "quick":
    case "restart":
      return "random";
    default:
      return "quiz";
  }
}

function defaultLimit(mode: QuizMode | undefined, count?: number): number {
  if (count !== undefined && count > 0) return count;
  switch (mode) {
    case "quick":
      return 10;
    case "mock":
      return 40;
    case "timed":
      return 40;
    case "incorrect":
    case "flagged":
      return 50;
    default:
      return 200;
  }
}

async function sessionFromQuestions(
  token: string,
  params: {
    set: StudySet;
    examId: string;
    mode: string;
    documentId: string;
    questions: MedGeniusQuestion[];
  }
): Promise<{ sessionId: string; questions: QuestionItem[] }> {
  const mapped = params.questions.map(mapApiQuestion);
  const ids = mapped.map((q) => q.questionId).filter(Boolean) as string[];

  if (ids.length === 0) {
    throw new Error("No questions available for this mode.");
  }

  const created = await createStudySession(token, {
    mode: params.mode,
    title: params.set.title,
    documentId: params.documentId,
    examId: params.examId,
    questionIds: ids,
  });

  return { sessionId: created.sessionId, questions: mapped };
}

export async function prepareExamSession(
  token: string,
  params: { set: StudySet; examId: string; quizParams: QuizSearchParams }
): Promise<{ sessionId: string; questions: QuestionItem[]; meta: ExamSessionMeta }> {
  const documentId = liveDocumentId(params.set.id);
  const mode = params.quizParams.mode ?? "restart";
  const limit = defaultLimit(mode, params.quizParams.count);
  const meta: ExamSessionMeta = {
    deferExplanation: mode === "mock",
    mode,
    timedSeconds:
      params.quizParams.minutes !== undefined
        ? params.quizParams.minutes * 60
        : mode === "mock"
          ? Math.round(limit * 72)
          : undefined,
  };

  if (mode === "flagged") {
    const { questions } = await fetchQuestions(token, {
      documentId,
      bookmarked: true,
      limit,
    });
    const built = await sessionFromQuestions(token, {
      set: params.set,
      examId: params.examId,
      mode: "quiz",
      documentId,
      questions: questions.slice(0, limit),
    });
    return { ...built, meta };
  }

  if (mode === "resume") {
    const { questions } = await fetchQuestions(token, { documentId, limit: 200 });
    const start = Math.min(Math.max(params.set.done, 0), questions.length);
    const slice = questions.slice(start);
    const built = await sessionFromQuestions(token, {
      set: params.set,
      examId: params.examId,
      mode: "quiz",
      documentId,
      questions: slice,
    });
    return { ...built, meta: { ...meta, deferExplanation: false } };
  }

  const built = await buildExam(token, {
    mode: studyModeForQuiz(mode),
    documentId,
    examId: params.examId,
    limit,
    title: params.set.title,
  });

  return {
    sessionId: built.sessionId,
    questions: built.questions.filter(Boolean).map(mapApiQuestion),
    meta,
  };
}
