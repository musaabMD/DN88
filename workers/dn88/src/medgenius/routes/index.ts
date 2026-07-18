import { Hono, type Context } from "hono";
import { getAuthedUser } from "../../middleware/auth";
import type { Bindings } from "../../types";
import { resolvePlan, PLAN_LIMITS } from "../config/plans";
import {
  checkDocumentLimits,
  ensureUserProfile,
  getCreditSummary,
} from "../services/credits";
import { createDocumentUpload } from "../services/processing";
import {
  getDocument,
  listDocuments,
  getMarkdown,
} from "../services/documents";
import {
  getQuestion,
  getQuestionImages,
  listQuestions,
  serializeQuestion,
} from "../services/questions";
import { getUserCredits, handleTutorChat } from "../services/tutor";
import { semanticSearchQuery } from "../services/openrouter";

export const medgeniusRoutes = new Hono<{ Bindings: Bindings }>();

async function requireAuth(c: Context<{ Bindings: Bindings }>) {
  const result = await getAuthedUser(c);
  if ("error" in result) {
    return { error: result.error, status: result.status as 401 };
  }
  return { user: result.user };
}

medgeniusRoutes.get("/credits", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const credits = await getUserCredits(
    c.env,
    authResult.user.id,
    authResult.user.email,
    authResult.user.publicMetadata
  );

  return c.json(credits);
});

medgeniusRoutes.get("/documents", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const examId = c.req.query("examId") ?? undefined;
  const docs = await listDocuments(c.env.DB, authResult.user.id, examId);

  return c.json({
    documents: docs.map((d) => ({
      id: d.id,
      examId: d.exam_id,
      name: d.name,
      originalFilename: d.original_filename,
      pageCount: d.page_count,
      status: d.processing_status,
      progress: d.processing_progress,
      error: d.processing_error,
      processedAt: d.processed_at,
      createdAt: d.created_at,
    })),
  });
});

medgeniusRoutes.get("/documents/:id", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const doc = await getDocument(c.env.DB, authResult.user.id, c.req.param("id"));
  if (!doc) return c.json({ error: "Document not found" }, 404);

  return c.json({
    id: doc.id,
    examId: doc.exam_id,
    name: doc.name,
    pageCount: doc.page_count,
    status: doc.processing_status,
    progress: doc.processing_progress,
    error: doc.processing_error,
    processedAt: doc.processed_at,
    createdAt: doc.created_at,
  });
});

medgeniusRoutes.get("/documents/:id/markdown", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const doc = await getDocument(c.env.DB, authResult.user.id, c.req.param("id"));
  if (!doc?.r2_markdown_key) return c.json({ error: "Markdown not available" }, 404);

  const markdown = await getMarkdown(c.env.USER_CONTENT, doc.r2_markdown_key);
  if (!markdown) return c.json({ error: "Content not found" }, 404);

  return c.json({ markdown, pageCount: doc.page_count });
});

medgeniusRoutes.post("/documents/upload", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const plan = resolvePlan(authResult.user.publicMetadata);
  const user = await ensureUserProfile(
    c.env.DB,
    authResult.user.id,
    authResult.user.email,
    plan
  );

  const formData = await c.req.formData();
  const file = formData.get("file");
  const name = (formData.get("name") as string | null)?.trim();
  const examId = (formData.get("examId") as string | null)?.trim() || undefined;

  if (!(file instanceof File)) {
    return c.json({ error: "Missing file" }, 400);
  }
  if (!name) {
    return c.json({ error: "Missing document name" }, 400);
  }

  const limits = PLAN_LIMITS[plan];
  if (file.size > limits.maxUploadBytes) {
    return c.json(
      {
        error: `File too large. Max ${Math.round(limits.maxUploadBytes / 1024 / 1024)}MB on ${plan} plan.`,
        code: "LIMIT_EXCEEDED",
      },
      413
    );
  }

  const fileBytes = await file.arrayBuffer();
  const pageEstimate = Math.max(1, Math.ceil(file.size / 50_000));
  const limitCheck = await checkDocumentLimits(c.env.DB, user, pageEstimate);
  if (!limitCheck.ok) {
    return c.json({ error: limitCheck.error, code: limitCheck.code }, 402);
  }

  try {
    const result = await createDocumentUpload(c.env, {
      userId: authResult.user.id,
      examId,
      name,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      fileBytes,
    });

    if (result.duplicate) {
      return c.json({
        documentId: result.documentId,
        duplicate: true,
        message: "This file was already uploaded and processed.",
      });
    }

    const updatedUser = await ensureUserProfile(
      c.env.DB,
      authResult.user.id,
      authResult.user.email,
      plan
    );

    return c.json({
      documentId: result.documentId,
      duplicate: false,
      status: "pending",
      credits: getCreditSummary(updatedUser),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return c.json({ error: message }, 500);
  }
});

medgeniusRoutes.get("/questions", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const questions = await listQuestions(c.env.DB, authResult.user.id, {
    documentId: c.req.query("documentId") ?? undefined,
    topic: c.req.query("topic") ?? undefined,
    difficulty: c.req.query("difficulty") ?? undefined,
    bookmarked: c.req.query("bookmarked") === "true",
    incorrect: c.req.query("incorrect") === "true",
    limit: parseInt(c.req.query("limit") ?? "50", 10),
    offset: parseInt(c.req.query("offset") ?? "0", 10),
  });

  const serialized = await Promise.all(
    questions.map(async (q) => {
      const images = await getQuestionImages(c.env.DB, q.id);
      return serializeQuestion(q, images);
    })
  );

  return c.json({ questions: serialized });
});

medgeniusRoutes.get("/questions/:id", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const question = await getQuestion(c.env.DB, authResult.user.id, c.req.param("id"));
  if (!question) return c.json({ error: "Question not found" }, 404);

  const images = await getQuestionImages(c.env.DB, question.id);
  return c.json(serializeQuestion(question, images));
});

medgeniusRoutes.get("/search", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const q = c.req.query("q")?.trim();
  if (!q) return c.json({ error: "Missing query" }, 400);

  if (!c.env.OPENROUTER_API_KEY) {
    const like = `%${q}%`;
    const result = await c.env.DB.prepare(
      `SELECT * FROM medgenius_questions
       WHERE user_id = ? AND (original_text LIKE ? OR cleaned_text LIKE ? OR topic LIKE ?)
       LIMIT 50`
    )
      .bind(authResult.user.id, like, like, like)
      .all();

    const questions = await Promise.all(
      (result.results as Array<{ id: string }>).map(async (row) => {
        const question = await getQuestion(c.env.DB, authResult.user.id, row.id);
        if (!question) return null;
        const images = await getQuestionImages(c.env.DB, question.id);
        return serializeQuestion(question, images);
      })
    );

    return c.json({ questions: questions.filter(Boolean) });
  }

  const allQuestions = await listQuestions(c.env.DB, authResult.user.id, { limit: 200 });
  const summaries = allQuestions.map((q) => q.cleaned_text ?? q.original_text);
  const ranked = await semanticSearchQuery(c.env.OPENROUTER_API_KEY, q, summaries);

  const questions = ranked
    .slice(0, 50)
    .map((idx) => allQuestions[idx])
    .filter(Boolean);

  const serialized = await Promise.all(
    questions.map(async (question) => {
      const images = await getQuestionImages(c.env.DB, question.id);
      return serializeQuestion(question, images);
    })
  );

  return c.json({ questions: serialized });
});

medgeniusRoutes.post("/ai/chat", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: {
    message?: string;
    conversationId?: string;
    contextType?: "general" | "document" | "question" | "topic" | "search";
    contextId?: string;
    questionText?: string;
    language?: "en" | "ar";
    mode?: "explain" | "easier" | "harder" | "evidence" | "eli5" | "visual";
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.message?.trim()) {
    return c.json({ error: "Missing message" }, 400);
  }

  let documentMarkdown: string | undefined;
  if (body.contextType === "document" && body.contextId) {
    const doc = await getDocument(c.env.DB, authResult.user.id, body.contextId);
    if (doc?.r2_markdown_key) {
      documentMarkdown = (await getMarkdown(c.env.USER_CONTENT, doc.r2_markdown_key)) ?? undefined;
    }
  }

  try {
    const result = await handleTutorChat(c.env, {
      userId: authResult.user.id,
      email: authResult.user.email,
      publicMetadata: authResult.user.publicMetadata,
      message: body.message.trim(),
      conversationId: body.conversationId,
      contextType: body.contextType,
      contextId: body.contextId,
      questionText: body.questionText,
      documentMarkdown,
      language: body.language,
      mode: body.mode,
    });

    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI chat failed";
    const status = message.includes("credit") || message.includes("limit") ? 402 : 500;
    return c.json({ error: message }, status);
  }
});

medgeniusRoutes.get("/flashcards", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const documentId = c.req.query("documentId");
  const query = documentId
    ? "SELECT * FROM medgenius_flashcards WHERE user_id = ? AND document_id = ? ORDER BY created_at DESC LIMIT 200"
    : "SELECT * FROM medgenius_flashcards WHERE user_id = ? ORDER BY created_at DESC LIMIT 200";

  const result = documentId
    ? await c.env.DB.prepare(query).bind(authResult.user.id, documentId).all()
    : await c.env.DB.prepare(query).bind(authResult.user.id).all();

  return c.json({
    flashcards: (result.results ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id,
        documentId: r.document_id,
        questionId: r.question_id,
        front: r.front,
        back: r.back,
        highYieldFact: r.high_yield_fact,
        memoryTrick: r.memory_trick,
        topic: r.topic,
      };
    }),
  });
});

medgeniusRoutes.post("/sessions", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: {
    mode?: string;
    title?: string;
    documentId?: string;
    examId?: string;
    questionIds?: string[];
    config?: Record<string, unknown>;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const sessionId = crypto.randomUUID();
  const totalQuestions = body.questionIds?.length ?? 0;

  await c.env.DB.prepare(
    `INSERT INTO medgenius_study_sessions
      (id, user_id, document_id, exam_id, mode, title, total_questions, config_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      sessionId,
      authResult.user.id,
      body.documentId ?? null,
      body.examId ?? null,
      body.mode ?? "quiz",
      body.title ?? "Study session",
      totalQuestions,
      body.config ? JSON.stringify(body.config) : null
    )
    .run();

  return c.json({ sessionId, status: "in_progress" });
});

medgeniusRoutes.post("/sessions/:id/attempts", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: {
    questionId?: string;
    selectedAnswer?: number;
    timeSec?: number;
    confidence?: "low" | "medium" | "high";
    flagged?: boolean;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.questionId) return c.json({ error: "Missing questionId" }, 400);

  const question = await getQuestion(c.env.DB, authResult.user.id, body.questionId);
  if (!question) return c.json({ error: "Question not found" }, 404);

  const isCorrect =
    body.selectedAnswer !== undefined && body.selectedAnswer === question.correct_answer
      ? 1
      : body.selectedAnswer !== undefined
        ? 0
        : null;

  await c.env.DB.prepare(
    `INSERT INTO medgenius_study_attempts
      (id, session_id, question_id, selected_answer, is_correct, time_sec, confidence, flagged)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      c.req.param("id"),
      body.questionId,
      body.selectedAnswer ?? null,
      isCorrect,
      body.timeSec ?? null,
      body.confidence ?? null,
      body.flagged ? 1 : 0
    )
    .run();

  if (isCorrect === 1) {
    await c.env.DB.prepare(
      "UPDATE medgenius_questions SET stats_correct = stats_correct + 1 WHERE id = ?"
    )
      .bind(body.questionId)
      .run();
  } else if (isCorrect === 0) {
    await c.env.DB.prepare(
      "UPDATE medgenius_questions SET stats_incorrect = stats_incorrect + 1 WHERE id = ?"
    )
      .bind(body.questionId)
      .run();
  } else {
    await c.env.DB.prepare(
      "UPDATE medgenius_questions SET stats_skipped = stats_skipped + 1 WHERE id = ?"
    )
      .bind(body.questionId)
      .run();
  }

  return c.json({ ok: true, isCorrect: isCorrect === 1 });
});

medgeniusRoutes.post("/bookmarks", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: { questionId?: string; label?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.questionId) return c.json({ error: "Missing questionId" }, 400);

  const label = body.label ?? "bookmark";
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO medgenius_bookmarks (id, user_id, question_id, label) VALUES (?, ?, ?, ?)`
  )
    .bind(id, authResult.user.id, body.questionId, label)
    .run();

  await c.env.DB.prepare(
    "UPDATE medgenius_questions SET bookmark_count = bookmark_count + 1 WHERE id = ?"
  )
    .bind(body.questionId)
    .run();

  return c.json({ ok: true });
});

medgeniusRoutes.get("/analytics", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const stats = await c.env.DB.prepare(
    `SELECT
      COALESCE(SUM(questions_answered), 0) as totalAnswered,
      COALESCE(SUM(questions_correct), 0) as totalCorrect,
      COALESCE(SUM(study_time_sec), 0) as totalStudySec
     FROM medgenius_daily_stats WHERE user_id = ?`
  )
    .bind(authResult.user.id)
    .first<{ totalAnswered: number; totalCorrect: number; totalStudySec: number }>();

  const questionStats = await c.env.DB.prepare(
    `SELECT topic, SUM(stats_correct) as correct, SUM(stats_incorrect) as incorrect
     FROM medgenius_questions WHERE user_id = ? AND topic IS NOT NULL
     GROUP BY topic ORDER BY incorrect DESC LIMIT 10`
  )
    .bind(authResult.user.id)
    .all();

  return c.json({
    totalAnswered: stats?.totalAnswered ?? 0,
    totalCorrect: stats?.totalCorrect ?? 0,
    accuracy:
      stats && stats.totalAnswered > 0
        ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
        : 0,
    totalStudySec: stats?.totalStudySec ?? 0,
    weakTopics: questionStats.results ?? [],
  });
});
