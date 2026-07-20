import type { ExtractedQuestion, QuestionRow } from "../types";

export async function insertQuestions(
  db: D1Database,
  userId: string,
  documentId: string,
  questions: ExtractedQuestion[]
): Promise<number> {
  let inserted = 0;

  for (const q of questions) {
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO medgenius_questions (
          id, user_id, document_id, original_text, cleaned_text, options_json,
          correct_answer, ai_confidence, explanation, topic, subtopic, difficulty,
          source_page, tags_json, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        userId,
        documentId,
        q.originalText,
        q.cleanedText ?? null,
        JSON.stringify(q.options ?? []),
        q.correctAnswer ?? null,
        q.confidence ?? null,
        q.explanation ?? null,
        q.topic ?? null,
        q.subtopic ?? null,
        q.difficulty ?? null,
        q.page ?? null,
        JSON.stringify(q.tags ?? []),
        q.tags?.includes("needs_review") ||
        (q.confidence !== undefined && q.confidence < 0.5)
          ? "needs_review"
          : "unverified"
      )
      .run();

    if (q.images?.length) {
      for (let i = 0; i < q.images.length; i++) {
        const img = q.images[i];
        if (!img?.r2Key) continue;
        await db
          .prepare(
            `INSERT INTO medgenius_question_images
              (id, question_id, document_id, r2_key, page_number, image_type, position, alt_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(),
            id,
            documentId,
            img.r2Key,
            img.page ?? null,
            img.type ?? null,
            img.position ?? i,
            img.alt ?? null
          )
          .run();
      }
    }

    inserted++;
  }

  return inserted;
}

export function mergeExtractedQuestions(
  ...lists: ExtractedQuestion[][]
): ExtractedQuestion[] {
  const merged = new Map<string, ExtractedQuestion>();
  for (const list of lists) {
    for (const q of list) {
      const key = q.originalText.trim().toLowerCase().slice(0, 240);
      if (key && !merged.has(key)) merged.set(key, q);
    }
  }
  return [...merged.values()];
}

export function parseExtractedQuestions(jsonContent: string): ExtractedQuestion[] {
  try {
    const parsed = JSON.parse(jsonContent) as {
      questions?: ExtractedQuestion[];
    };
    if (!Array.isArray(parsed.questions)) return [];
    return parsed.questions.filter((q) => {
      const text = q.originalText?.trim();
      if (!text || text.length < 8) return false;
      if (Array.isArray(q.options) && q.options.length >= 2) return true;
      // recall / short-answer items without options
      return text.includes("?") || text.length >= 20;
    });
  } catch {
    return [];
  }
}

export async function listQuestions(
  db: D1Database,
  userId: string,
  filters?: {
    documentId?: string;
    topic?: string;
    difficulty?: string;
    verificationStatus?: string;
    bookmarked?: boolean;
    incorrect?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<QuestionRow[]> {
  const conditions = ["user_id = ?"];
  const binds: (string | number)[] = [userId];

  if (filters?.documentId) {
    conditions.push("document_id = ?");
    binds.push(filters.documentId);
  }
  if (filters?.topic) {
    conditions.push("topic = ?");
    binds.push(filters.topic);
  }
  if (filters?.difficulty) {
    conditions.push("difficulty = ?");
    binds.push(filters.difficulty);
  }
  if (filters?.verificationStatus) {
    conditions.push("verification_status = ?");
    binds.push(filters.verificationStatus);
  }

  if (filters?.incorrect) {
    conditions.push("stats_incorrect > stats_correct");
  }

  let query = `SELECT q.* FROM medgenius_questions q`;

  if (filters?.bookmarked) {
    query += " INNER JOIN medgenius_bookmarks b ON b.question_id = q.id AND b.user_id = q.user_id";
  }

  query += ` WHERE ${conditions.join(" AND ")}`;

  query += " ORDER BY q.created_at DESC LIMIT ? OFFSET ?";
  binds.push(filters?.limit ?? 50, filters?.offset ?? 0);

  const result = await db.prepare(query).bind(...binds).all<QuestionRow>();
  return result.results ?? [];
}

export async function getQuestion(
  db: D1Database,
  userId: string,
  questionId: string
): Promise<QuestionRow | null> {
  return (
    (await db
      .prepare("SELECT * FROM medgenius_questions WHERE id = ? AND user_id = ?")
      .bind(questionId, userId)
      .first<QuestionRow>()) ?? null
  );
}

export function serializeQuestion(row: QuestionRow, images?: Array<Record<string, unknown>>) {
  return {
    id: row.id,
    documentId: row.document_id,
    originalText: row.original_text,
    cleanedText: row.cleaned_text,
    options: JSON.parse(row.options_json) as string[],
    correctAnswer: row.correct_answer,
    aiConfidence: row.ai_confidence,
    explanation: row.explanation,
    topic: row.topic,
    subtopic: row.subtopic,
    difficulty: row.difficulty,
    sourcePage: row.source_page,
    tags: JSON.parse(row.tags_json) as string[],
    duplicateGroupId: row.duplicate_group_id,
    verificationStatus: row.verification_status,
    conflict: row.verification_status === "conflict"
      ? {
          recallAnswer: row.conflict_recall_answer,
          aiAnswer: row.conflict_ai_answer,
          confidence: row.conflict_confidence,
        }
      : null,
    stats: {
      correct: row.stats_correct,
      incorrect: row.stats_incorrect,
      skipped: row.stats_skipped,
    },
    images: images ?? [],
  };
}

export async function getQuestionImages(
  db: D1Database,
  questionId: string
): Promise<Array<Record<string, unknown>>> {
  const result = await db
    .prepare(
      "SELECT id, r2_key, page_number, image_type, position, alt_text FROM medgenius_question_images WHERE question_id = ? ORDER BY position"
    )
    .bind(questionId)
    .all<{
      id: string;
      r2_key: string;
      page_number: number | null;
      image_type: string | null;
      position: number;
      alt_text: string | null;
    }>();

  return (result.results ?? []).map((img) => ({
    id: img.id,
    r2Key: img.r2_key,
    page: img.page_number,
    type: img.image_type,
    position: img.position,
    alt: img.alt_text,
  }));
}

export async function detectDuplicateGroups(
  db: D1Database,
  userId: string,
  documentId: string
): Promise<number> {
  const questions = await db
    .prepare(
      "SELECT id, topic, cleaned_text, original_text FROM medgenius_questions WHERE user_id = ? AND document_id = ?"
    )
    .bind(userId, documentId)
    .all<{ id: string; topic: string | null; cleaned_text: string | null; original_text: string }>();

  const rows = questions.results ?? [];
  const byTopic = new Map<string, typeof rows>();

  for (const row of rows) {
    const key = (row.topic ?? "general").toLowerCase().trim();
    const group = byTopic.get(key) ?? [];
    group.push(row);
    byTopic.set(key, group);
  }

  let groupsCreated = 0;

  for (const [, group] of byTopic) {
    if (group.length < 2) continue;

    const groupId = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO medgenius_duplicate_groups (id, user_id, topic, question_count) VALUES (?, ?, ?, ?)"
      )
      .bind(groupId, userId, group[0]?.topic ?? "general", group.length)
      .run();

    for (const q of group) {
      await db
        .prepare("UPDATE medgenius_questions SET duplicate_group_id = ? WHERE id = ?")
        .bind(groupId, q.id)
        .run();
    }

    groupsCreated++;
  }

  return groupsCreated;
}
