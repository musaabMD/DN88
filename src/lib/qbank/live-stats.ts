import { fetchQuestions } from "@/lib/medgenius/api";
import { isLiveSetId, liveDocumentId } from "./live-data";

export type LiveSetStats = {
  items: number;
  progress: number;
  best: number;
  incorrectCount: number;
  flaggedCount: number;
  readinessPct: number;
};

export async function fetchLiveSetStats(
  token: string,
  setId: string
): Promise<LiveSetStats | null> {
  if (!isLiveSetId(setId)) return null;

  const documentId = liveDocumentId(setId);
  const [all, incorrect, bookmarked] = await Promise.all([
    fetchQuestions(token, { documentId, limit: 200 }),
    fetchQuestions(token, { documentId, incorrect: true, limit: 200 }),
    fetchQuestions(token, { documentId, bookmarked: true, limit: 200 }),
  ]);

  const questions = all.questions;
  let attempted = 0;
  let correct = 0;

  for (const q of questions) {
    const tries = q.stats.correct + q.stats.incorrect;
    attempted += tries > 0 ? 1 : 0;
    if (q.stats.correct > q.stats.incorrect) correct += 1;
  }

  const total = questions.length;
  const progress = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const best =
    attempted > 0 ? Math.round((correct / Math.max(attempted, 1)) * 100) : 0;
  const readinessPct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    items: total,
    progress,
    best,
    incorrectCount: incorrect.questions.length,
    flaggedCount: bookmarked.questions.length,
    readinessPct,
  };
}
