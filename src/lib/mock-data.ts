import { EXAMS } from "@/lib/exams";
import {
  getSessionItems,
  LIBRARY_ARTICLES,
  resolveSessionSetId,
  resolveSessionTab,
  sessionItemCount,
  SETS_BY_TAB,
  type StudySet,
} from "@/lib/set-content";

export type {
  FlashcardItem,
  ImageItem,
  LibraryArticle,
  NoteItem,
  QuestionItem,
  SessionItem,
  StudySet,
} from "@/lib/set-content";

export {
  FLASHCARD_SETS,
  filterLibraryArticles,
  getLibraryArticleById,
  getSessionItems,
  IMAGE_SETS,
  LIBRARY_ARTICLES,
  LIBRARY_SETS,
  QUESTION_SETS,
  resolveSessionSetId,
  resolveSessionTab,
  sessionItemCount,
  SETS_BY_TAB,
  SUMMARY_SETS,
  TAB_ITEM_LABEL,
  TAB_SET_LABEL,
} from "@/lib/set-content";

export function getSetById(tab: string, setId: string): StudySet | undefined {
  return (SETS_BY_TAB[tab] ?? []).find((set) => set.id === setId);
}

export function getAllSetStaticParams(): Array<{
  examId: string;
  tab: string;
  setId: string;
}> {
  return EXAMS.flatMap((exam) =>
    Object.entries(SETS_BY_TAB).flatMap(([tab, sets]) =>
      sets.map((set) => ({ examId: exam.id, tab, setId: set.id }))
    )
  );
}

export function getAllArticleStaticParams(): Array<{
  articleId: string;
}> {
  return LIBRARY_ARTICLES.map((article) => ({
    articleId: article.id,
  }));
}

/** Only pre-render topic routes that have a published article (Cloudflare Pages file limit). */
export function getPublishedTopicStaticParams(): Array<{ topicId: string }> {
  return LIBRARY_ARTICLES.map((article) => ({ topicId: article.id }));
}

export type QuizSetScreenData = {
  title: string;
  category: string;
  items: number;
  progress: number;
  best: number;
  incorrectCount: number;
  flaggedCount: number;
  itemLabel: string;
  contentTab: string;
};

export function toQuizSetScreenData(
  set: StudySet,
  tab: string
): QuizSetScreenData {
  const contentTab = resolveSessionTab(tab, set);
  const contentSetId = resolveSessionSetId(tab, set);
  const items = sessionItemCount(contentTab, contentSetId);
  const progress = set.total > 0 ? Math.round((set.done / set.total) * 100) : 0;

  const itemLabels: Record<string, string> = {
    questions: "questions",
    summary: "notes",
    images: "images",
    flashcards: "cards",
    library: "items",
  };

  return {
    title: set.title,
    category: set.subject,
    items,
    progress,
    best: set.score ?? 0,
    incorrectCount:
      contentTab === "questions"
        ? Math.min(3, items - set.done)
        : Math.min(2, items - set.done),
    flaggedCount: set.id === "q1" || set.sourceSetId === "q1" ? 2 : Math.min(1, set.done),
    itemLabel: itemLabels[contentTab] ?? "items",
    contentTab,
  };
}

export type SessionReportData = {
  durationSec: number;
  subjects: Array<{ subject: string; correct: number; total: number }>;
  missedCards: Array<{ id: string; prompt: string; subject: string }>;
  streakBest: number;
};

export function getSessionReportData(
  set: StudySet,
  tab: string
): SessionReportData {
  const contentTab = resolveSessionTab(tab, set);
  const contentSetId = resolveSessionSetId(tab, set);
  const items = getSessionItems(contentTab, contentSetId);
  const count = items.length > 0 ? items.length : 1;

  if (contentSetId === "q1" && contentTab === "questions") {
    return {
      durationSec: 305,
      subjects: [
        { subject: "Sulfonylureas", correct: 6, total: 8 },
        { subject: "Metformin & Biguanides", correct: 7, total: 7 },
        { subject: "SGLT2 Inhibitors", correct: 3, total: 6 },
      ],
      missedCards: [
        {
          id: "c1",
          prompt: "First-line agent contraindicated in eGFR < 30",
          subject: "Metformin & Biguanides",
        },
      ],
      streakBest: 9,
    };
  }

  const score = set.score ?? 72;
  const correct = Math.round((score / 100) * count);
  const missed = Math.max(count - correct, 0);

  const subjects =
    contentTab === "questions"
      ? (items as import("@/lib/set-content").QuestionItem[]).reduce<
          Record<string, { correct: number; total: number }>
        >((acc, q) => {
          const entry = acc[q.subject] ?? { correct: 0, total: 0 };
          entry.total += 1;
          if (q.status !== "incorrect") entry.correct += 1;
          acc[q.subject] = entry;
          return acc;
        }, {})
      : { [set.subject]: { correct, total: count } };

  const missedCards =
    contentTab === "questions"
      ? (items as import("@/lib/set-content").QuestionItem[])
          .filter((q) => q.status === "incorrect")
          .map((q) => ({
            id: String(q.id),
            prompt: q.text,
            subject: q.subject,
          }))
      : missed > 0
        ? [
            {
              id: "m1",
              prompt: `Review ${missed} missed ${contentTab === "flashcards" ? "card" : "item"}${missed === 1 ? "" : "s"}`,
              subject: set.subject,
            },
          ]
        : [];

  return {
    durationSec: Math.max(count * 45, 120),
    subjects: Object.entries(subjects).map(([subject, stats]) => ({
      subject,
      ...stats,
    })),
    missedCards,
    streakBest: Math.min(correct, 5),
  };
}
