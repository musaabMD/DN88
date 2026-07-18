import { chatCompletion } from "./openrouter";

export async function detectAnswerConflicts(
  db: D1Database,
  apiKey: string,
  userId: string,
  documentId: string
): Promise<number> {
  const questions = await db
    .prepare(
      `SELECT id, original_text, options_json, correct_answer, ai_confidence
       FROM medgenius_questions
       WHERE user_id = ? AND document_id = ? AND correct_answer IS NOT NULL`
    )
    .bind(userId, documentId)
    .all<{
      id: string;
      original_text: string;
      options_json: string;
      correct_answer: number;
      ai_confidence: number | null;
    }>();

  let conflicts = 0;

  for (const q of questions.results ?? []) {
    if (q.ai_confidence !== null && q.ai_confidence >= 0.7) continue;

    const options = JSON.parse(q.options_json) as string[];
    const result = await chatCompletion(
      apiKey,
      [
        {
          role: "system",
          content:
            'Verify MCQ answer. Return JSON: {"aiAnswer":0,"confidence":0.9,"needsReview":false}. aiAnswer is 0-based index.',
        },
        {
          role: "user",
          content: `Question: ${q.original_text}\nOptions:\n${options.map((o, i) => `${i}. ${o}`).join("\n")}\nRecall answer index: ${q.correct_answer}`,
        },
      ],
      { jsonMode: true, maxTokens: 256 }
    );

    try {
      const parsed = JSON.parse(result.content) as {
        aiAnswer?: number;
        confidence?: number;
        needsReview?: boolean;
      };

      const aiAnswer = parsed.aiAnswer;
      const confidence = parsed.confidence ?? 0.5;
      const needsReview =
        parsed.needsReview ||
        aiAnswer === undefined ||
        aiAnswer !== q.correct_answer ||
        confidence < 0.7;

      if (needsReview) {
        await db
          .prepare(
            `UPDATE medgenius_questions SET
              verification_status = ?,
              conflict_recall_answer = ?,
              conflict_ai_answer = ?,
              conflict_confidence = ?,
              updated_at = datetime('now')
            WHERE id = ?`
          )
          .bind(
            aiAnswer !== undefined && aiAnswer !== q.correct_answer ? "conflict" : "needs_review",
            q.correct_answer,
            aiAnswer ?? null,
            confidence,
            q.id
          )
          .run();
        conflicts++;
      }
    } catch {
      /* skip malformed AI response */
    }
  }

  return conflicts;
}

export async function generateBoardQuestion(
  apiKey: string,
  sourceQuestion: {
    text: string;
    options: string[];
    topic?: string | null;
    difficulty?: string | null;
  }
): Promise<string> {
  const result = await chatCompletion(
    apiKey,
    [
      {
        role: "system",
        content:
          'Generate a new board-style MCQ similar difficulty but different scenario. Return JSON: {"text":"...","options":["A","B","C","D","E"],"correctAnswer":0,"explanation":"..."}',
      },
      {
        role: "user",
        content: `Source: ${sourceQuestion.text}\nTopic: ${sourceQuestion.topic ?? "General"}\nDifficulty: ${sourceQuestion.difficulty ?? "medium"}`,
      },
    ],
    { jsonMode: true, maxTokens: 1024 }
  );

  return result.content;
}
