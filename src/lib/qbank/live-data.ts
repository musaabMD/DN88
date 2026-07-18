import type { ContentTab } from "@/lib/routes";
import type {
  FlashcardItem,
  NoteItem,
  QuestionItem,
  StudySet,
} from "@/lib/set-content";
import {
  fetchDocuments,
  fetchFlashcards,
  fetchQuestions,
  fetchSummaries,
  type MedGeniusDocument,
  type MedGeniusQuestion,
} from "@/lib/medgenius/api";
import { SETS_BY_TAB } from "@/lib/set-content";
import { mapApiQuestion } from "./exam-session";

const LIVE_SET_PREFIX = "doc:";

export function isLiveSetId(setId: string): boolean {
  return setId.startsWith(LIVE_SET_PREFIX);
}

export function liveDocumentId(setId: string): string {
  return setId.replace(/^doc:/, "");
}

export function liveSetId(documentId: string): string {
  return `${LIVE_SET_PREFIX}${documentId}`;
}

function mapQuestion(q: MedGeniusQuestion, index: number) {
  return mapApiQuestion(q, index);
}

function documentToStudySet(
  doc: MedGeniusDocument,
  tab: ContentTab,
  total: number
): StudySet {
  return {
    id: liveSetId(doc.id),
    title: doc.name,
    subject: doc.examId ?? "General",
    about:
      doc.status === "completed"
        ? `${doc.pageCount} pages · ready`
        : `${doc.pageCount || 1} pages · ${doc.status}`,
    total,
    done: 0,
    score: null,
    tag: doc.status === "completed" ? "Live" : "Processing",
    upvotes: 0,
    comments: 0,
  };
}

export async function fetchLiveSetsForTab(
  token: string | null,
  examId: string,
  tab: ContentTab
): Promise<StudySet[]> {
  if (!token || tab === "library") return [];

  const { documents } = await fetchDocuments(token, examId);
  const completed = documents.filter((d) => d.status === "completed");
  const processing = documents.filter((d) => d.status !== "completed" && d.status !== "failed");

  const sets: StudySet[] = [];

  for (const doc of [...completed, ...processing]) {
    let total = 0;
    if (tab === "questions") {
      const { questions } = await fetchQuestions(token, { documentId: doc.id, limit: 200 });
      total = questions.length;
    } else if (tab === "flashcards") {
      const { flashcards } = await fetchFlashcards(token, doc.id);
      total = flashcards.length;
    } else if (tab === "summary") {
      const { summaries } = await fetchSummaries(token, doc.id);
      total = summaries.length;
    } else if (tab === "images") {
      total = 0;
    }

    if (tab === "images") continue;
    if (total === 0 && doc.status !== "completed") {
      sets.push(documentToStudySet(doc, tab, 0));
      continue;
    }
    if (total > 0 || doc.status === "completed") {
      sets.push(documentToStudySet(doc, tab, Math.max(total, doc.pageCount || 1)));
    }
  }

  return sets;
}

export async function fetchLiveSessionItems(
  token: string | null,
  tab: ContentTab,
  setId: string
): Promise<QuestionItem[] | FlashcardItem[] | NoteItem[]> {
  if (!token || !isLiveSetId(setId)) return [];

  const documentId = liveDocumentId(setId);

  if (tab === "questions") {
    const { questions } = await fetchQuestions(token, { documentId, limit: 200 });
    return questions.map(mapQuestion);
  }

  if (tab === "flashcards") {
    const { flashcards } = await fetchFlashcards(token, documentId);
    return flashcards.map((card, index) => ({
      id: index + 1,
      deck: "Live",
      front: card.front,
      back: card.back,
      status: "new" as const,
    }));
  }

  if (tab === "summary") {
    const { summaries } = await fetchSummaries(token, documentId);
    return summaries.map((summary, index) => ({
      id: index + 1,
      author: "DrNote",
      specialty: summary.type,
      text: summary.content,
      tag: "Summary",
    }));
  }

  return [];
}

export async function fetchLiveSetById(
  token: string | null,
  examId: string,
  tab: ContentTab,
  setId: string
): Promise<StudySet | undefined> {
  if (!isLiveSetId(setId)) return undefined;
  const sets = await fetchLiveSetsForTab(token, examId, tab);
  return sets.find((set) => set.id === setId);
}

export function mergeSets(mockSets: StudySet[], liveSets: StudySet[]): StudySet[] {
  if (liveSets.length === 0) return mockSets;
  const liveIds = new Set(liveSets.map((set) => set.id));
  const demo = mockSets.filter((set) => !liveIds.has(set.id));
  return [...liveSets, ...demo];
}

export function defaultSetsForTab(tab: ContentTab): StudySet[] {
  return SETS_BY_TAB[tab] ?? [];
}
