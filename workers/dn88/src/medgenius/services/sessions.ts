import type { StudyMode } from "../types";

export async function buildExamQuestionSet(
  db: D1Database,
  userId: string,
  params: {
    mode: StudyMode;
    documentId?: string;
    examId?: string;
    topic?: string;
    limit?: number;
  }
): Promise<string[]> {
  const limit = params.limit ?? 40;
  let query = "SELECT id FROM medgenius_questions WHERE user_id = ?";
  const binds: (string | number)[] = [userId];

  if (params.documentId) {
    query += " AND document_id = ?";
    binds.push(params.documentId);
  }
  if (params.topic) {
    query += " AND topic = ?";
    binds.push(params.topic);
  }

  switch (params.mode) {
    case "incorrect":
      query += " AND stats_incorrect > stats_correct";
      break;
    case "weak_topic":
      query += " AND stats_incorrect > 0";
      query += " ORDER BY stats_incorrect DESC";
      break;
    case "random":
    case "mixed":
    case "timed":
    case "quiz":
    case "custom":
    case "subject":
      query += " ORDER BY RANDOM()";
      break;
    default:
      query += " ORDER BY created_at DESC";
  }

  if (!query.includes("ORDER BY")) {
    query += " ORDER BY RANDOM()";
  }

  query += " LIMIT ?";
  binds.push(limit);

  const result = await db.prepare(query).bind(...binds).all<{ id: string }>();
  return (result.results ?? []).map((r) => r.id);
}

export async function completeSession(
  db: D1Database,
  userId: string,
  sessionId: string,
  params: { durationSec?: number; correctCount?: number; answeredCount?: number }
) {
  const session = await db
    .prepare("SELECT id FROM medgenius_study_sessions WHERE id = ? AND user_id = ?")
    .bind(sessionId, userId)
    .first();

  if (!session) throw new Error("Session not found");

  await db
    .prepare(
      `UPDATE medgenius_study_sessions SET
        status = 'completed',
        ended_at = datetime('now'),
        duration_sec = COALESCE(?, duration_sec),
        correct_count = COALESCE(?, correct_count),
        answered_count = COALESCE(?, answered_count)
      WHERE id = ?`
    )
    .bind(
      params.durationSec ?? null,
      params.correctCount ?? null,
      params.answeredCount ?? null,
      sessionId
    )
    .run();

  const today = new Date().toISOString().slice(0, 10);
  await db
    .prepare(
      `INSERT INTO medgenius_daily_stats (user_id, stat_date, questions_answered, questions_correct, study_time_sec)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, stat_date) DO UPDATE SET
         questions_answered = questions_answered + excluded.questions_answered,
         questions_correct = questions_correct + excluded.questions_correct,
         study_time_sec = study_time_sec + excluded.study_time_sec`
    )
    .bind(
      userId,
      today,
      params.answeredCount ?? 0,
      params.correctCount ?? 0,
      params.durationSec ?? 0
    )
    .run();
}

export async function listSessions(db: D1Database, userId: string, limit = 50) {
  const result = await db
    .prepare(
      "SELECT * FROM medgenius_study_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?"
    )
    .bind(userId, limit)
    .all();

  return result.results ?? [];
}

export async function getDueSrsQuestions(db: D1Database, userId: string, limit = 30) {
  const result = await db
    .prepare(
      `SELECT q.* FROM medgenius_questions q
       INNER JOIN medgenius_spaced_repetition srs ON srs.question_id = q.id
       WHERE srs.user_id = ? AND srs.next_review_at <= datetime('now')
       ORDER BY srs.next_review_at ASC
       LIMIT ?`
    )
    .bind(userId, limit)
    .all();

  return result.results ?? [];
}

export async function recordSrsReview(
  db: D1Database,
  userId: string,
  questionId: string,
  quality: number
) {
  const existing = await db
    .prepare(
      "SELECT * FROM medgenius_spaced_repetition WHERE user_id = ? AND question_id = ?"
    )
    .bind(userId, questionId)
    .first<{
      interval_days: number;
      ease_factor: number;
      repetitions: number;
    }>();

  let interval = existing?.interval_days ?? 1;
  let ease = existing?.ease_factor ?? 2.5;
  let reps = existing?.repetitions ?? 0;

  if (quality >= 3) {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 3 : interval * ease;
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    reps = 0;
    interval = 1;
  }

  const nextReview = new Date(Date.now() + interval * 86400000).toISOString();

  await db
    .prepare(
      `INSERT INTO medgenius_spaced_repetition
        (user_id, question_id, interval_days, ease_factor, repetitions, next_review_at, last_review_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, question_id) DO UPDATE SET
         interval_days = excluded.interval_days,
         ease_factor = excluded.ease_factor,
         repetitions = excluded.repetitions,
         next_review_at = excluded.next_review_at,
         last_review_at = datetime('now')`
    )
    .bind(userId, questionId, interval, ease, reps, nextReview)
    .run();
}
