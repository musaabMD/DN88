import { Hono, type Context } from "hono";
import { getAuthedUser } from "../../middleware/auth";
import type { Bindings } from "../../types";
import { resolvePlan, PLAN_LIMITS } from "../config/plans";
import {
  checkDocumentLimits,
  ensureUserProfile,
  getCreditSummary,
} from "../services/credits";
import { createDocumentUpload, extractQuestionsOnly, reprocessDocument } from "../services/processing";
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
import { syncClerkUserToMedGenius } from "../services/clerk-sync";
import {
  addToCollection,
  createCollection,
  deleteCollection,
  getCollectionQuestions,
  listCollections,
} from "../services/collections";
import {
  buildExamQuestionSet,
  completeSession,
  getDueSrsQuestions,
  listSessions,
  recordSrsReview,
} from "../services/sessions";
import {
  computeCreditCost,
  spendCredits,
  checkCredits,
} from "../services/credits";
import {
  detectAnswerConflicts,
  generateBoardQuestion,
} from "../services/conflicts";
import { sanitizeUserError } from "../services/user-errors";

export const medgeniusRoutes = new Hono<{ Bindings: Bindings }>();

async function requireAuth(c: Context<{ Bindings: Bindings }>) {
  const result = await getAuthedUser(c);
  if ("error" in result) {
    return { error: result.error, status: result.status as 401 };
  }

  const plan = resolvePlan(result.user.publicMetadata);
  await syncClerkUserToMedGenius(c.env.DB, {
    userId: result.user.id,
    email: result.user.email,
    publicMetadata: result.user.publicMetadata,
  });

  return { user: result.user, plan };
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
      error: d.processing_error ? sanitizeUserError(d.processing_error, "processing") : null,
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
    originalFilename: doc.original_filename,
    mimeType: doc.mime_type,
    pageCount: doc.page_count,
    status: doc.processing_status,
    progress: doc.processing_progress,
    error: doc.processing_error ? sanitizeUserError(doc.processing_error, "processing") : null,
    processedAt: doc.processed_at,
    createdAt: doc.created_at,
  });
});

medgeniusRoutes.get("/documents/:id/file", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const doc = await getDocument(c.env.DB, authResult.user.id, c.req.param("id"));
  if (!doc?.r2_original_key) return c.json({ error: "Original file not available" }, 404);

  const object = await c.env.USER_CONTENT.get(doc.r2_original_key);
  if (!object) return c.json({ error: "File not found" }, 404);

  const body = await object.arrayBuffer();
  const filename = doc.original_filename.replace(/[^\w.\-()+\s]/g, "_") || "document";
  const contentType =
    doc.mime_type && doc.mime_type !== "application/octet-stream"
      ? doc.mime_type
      : filename.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : "application/octet-stream";

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
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

medgeniusRoutes.get("/documents/:id/images/:filename", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const documentId = c.req.param("id");
  const filename = c.req.param("filename");
  if (!/^page-\d+-\d+\.[a-z0-9]+$/i.test(filename)) {
    return c.json({ error: "Invalid image path" }, 400);
  }

  const doc = await getDocument(c.env.DB, authResult.user.id, documentId);
  if (!doc) return c.json({ error: "Document not found" }, 404);

  const r2Key = `users/${authResult.user.id}/documents/${documentId}/images/${filename}`;
  const object = await c.env.USER_CONTENT.get(r2Key);
  if (!object) return c.json({ error: "Image not found" }, 404);

  const body = await object.arrayBuffer();
  const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

medgeniusRoutes.post("/documents/:id/reprocess", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const documentId = c.req.param("id");
  const doc = await getDocument(c.env.DB, authResult.user.id, documentId);
  if (!doc) return c.json({ error: "Document not found" }, 404);

  try {
    await reprocessDocument(c.env, documentId, authResult.user.id);
    return c.json({ documentId, status: "pending", message: "Document queued for reprocessing." });
  } catch (error) {
    const message = sanitizeUserError(
      error instanceof Error ? error.message : "Reprocess failed",
      "processing"
    );
    return c.json({ error: message }, 500);
  }
});

medgeniusRoutes.post("/documents/:id/extract-questions", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const documentId = c.req.param("id");
  const doc = await getDocument(c.env.DB, authResult.user.id, documentId);
  if (!doc) return c.json({ error: "Document not found" }, 404);

  try {
    const result = await extractQuestionsOnly(c.env, documentId, authResult.user.id);
    const message =
      result.stage === "parse"
        ? "Readable text missing — full reprocess started."
        : "MCQ extraction queued.";
    return c.json({ documentId, status: result.stage === "parse" ? "pending" : "extracting", stage: result.stage, message });
  } catch (error) {
    const message = sanitizeUserError(
      error instanceof Error ? error.message : "Extraction failed",
      "ai"
    );
    return c.json({ error: message }, 500);
  }
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

    if (result.reprocessed) {
      return c.json({
        documentId: result.documentId,
        duplicate: false,
        reprocessed: true,
        status: "pending",
        message: "Previous parse was invalid — reprocessing with document parser.",
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
    const message = sanitizeUserError(
      error instanceof Error ? error.message : "Upload failed",
      "upload"
    );
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
    const message = sanitizeUserError(
      error instanceof Error ? error.message : "AI chat failed",
      "ai"
    );
    const status = message.includes("plan limit") || message.includes("credit") ? 402 : 500;
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

medgeniusRoutes.get("/summaries", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const documentId = c.req.query("documentId");
  if (!documentId) return c.json({ error: "Missing documentId" }, 400);

  const result = await c.env.DB.prepare(
    "SELECT id, summary_type, content_markdown, created_at FROM medgenius_summaries WHERE user_id = ? AND document_id = ?"
  )
    .bind(authResult.user.id, documentId)
    .all();

  return c.json({
    summaries: (result.results ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id,
        type: r.summary_type,
        content: r.content_markdown,
        createdAt: r.created_at,
      };
    }),
  });
});

medgeniusRoutes.get("/collections", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);
  return c.json({ collections: await listCollections(c.env.DB, authResult.user.id) });
});

medgeniusRoutes.post("/collections", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: { name?: string; description?: string; color?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.name?.trim()) return c.json({ error: "Missing name" }, 400);

  const collection = await createCollection(c.env.DB, authResult.user.id, {
    name: body.name.trim(),
    description: body.description,
    color: body.color,
  });
  return c.json(collection);
});

medgeniusRoutes.post("/collections/:id/items", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: { questionId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.questionId) return c.json({ error: "Missing questionId" }, 400);

  try {
    await addToCollection(c.env.DB, authResult.user.id, c.req.param("id"), body.questionId);
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Failed" }, 404);
  }
});

medgeniusRoutes.get("/collections/:id/questions", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const rows = await getCollectionQuestions(c.env.DB, authResult.user.id, c.req.param("id"));
  const questions = await Promise.all(
    rows.map(async (row) => {
      const q = row as import("../types").QuestionRow;
      const images = await getQuestionImages(c.env.DB, q.id);
      return serializeQuestion(q, images);
    })
  );
  return c.json({ questions });
});

medgeniusRoutes.delete("/collections/:id", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);
  await deleteCollection(c.env.DB, authResult.user.id, c.req.param("id"));
  return c.json({ ok: true });
});

medgeniusRoutes.get("/duplicates", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const result = await c.env.DB.prepare(
    `SELECT g.*, COUNT(q.id) as question_count
     FROM medgenius_duplicate_groups g
     LEFT JOIN medgenius_questions q ON q.duplicate_group_id = g.id
     WHERE g.user_id = ?
     GROUP BY g.id
     ORDER BY g.created_at DESC LIMIT 100`
  )
    .bind(authResult.user.id)
    .all();

  return c.json({ groups: result.results ?? [] });
});

medgeniusRoutes.post("/exam/build", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: {
    mode?: import("../types").StudyMode;
    documentId?: string;
    examId?: string;
    topic?: string;
    limit?: number;
    title?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const questionIds = await buildExamQuestionSet(c.env.DB, authResult.user.id, {
    mode: body.mode ?? "random",
    documentId: body.documentId,
    examId: body.examId,
    topic: body.topic,
    limit: body.limit ?? 40,
  });

  const sessionId = crypto.randomUUID();
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
      body.mode ?? "random",
      body.title ?? "Exam session",
      questionIds.length,
      JSON.stringify({ questionIds })
    )
    .run();

  const questions = await Promise.all(
    questionIds.map(async (id) => {
      const q = await getQuestion(c.env.DB, authResult.user.id, id);
      if (!q) return null;
      const images = await getQuestionImages(c.env.DB, q.id);
      return serializeQuestion(q, images);
    })
  );

  return c.json({
    sessionId,
    questionIds,
    questions: questions.filter(Boolean),
  });
});

medgeniusRoutes.get("/sessions", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);
  return c.json({ sessions: await listSessions(c.env.DB, authResult.user.id) });
});

medgeniusRoutes.post("/sessions/:id/complete", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: { durationSec?: number; correctCount?: number; answeredCount?: number };
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  try {
    await completeSession(c.env.DB, authResult.user.id, c.req.param("id"), body);
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Failed" }, 404);
  }
});

medgeniusRoutes.get("/srs/due", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  const rows = await getDueSrsQuestions(c.env.DB, authResult.user.id);
  const questions = await Promise.all(
    rows.map(async (row) => {
      const q = row as import("../types").QuestionRow;
      const images = await getQuestionImages(c.env.DB, q.id);
      return serializeQuestion(q, images);
    })
  );
  return c.json({ questions });
});

medgeniusRoutes.post("/srs/review", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  let body: { questionId?: string; quality?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.questionId) return c.json({ error: "Missing questionId" }, 400);

  await recordSrsReview(
    c.env.DB,
    authResult.user.id,
    body.questionId,
    body.quality ?? 3
  );
  return c.json({ ok: true });
});

medgeniusRoutes.post("/questions/generate", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  if (!PLAN_LIMITS[authResult.plan].aiGeneratedQuestions) {
    return c.json({ error: "AI question generation requires Pro plan", code: "LIMIT_EXCEEDED" }, 402);
  }
  if (!c.env.OPENROUTER_API_KEY) {
    return c.json({ error: "AI not configured" }, 503);
  }

  let body: { questionId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.questionId) return c.json({ error: "Missing questionId" }, 400);

  const source = await getQuestion(c.env.DB, authResult.user.id, body.questionId);
  if (!source) return c.json({ error: "Question not found" }, 404);

  const user = await c.env.DB.prepare("SELECT * FROM medgenius_users WHERE user_id = ?")
    .bind(authResult.user.id)
    .first<import("../types").MedGeniusUserRow>();
  if (!user) return c.json({ error: "User not found" }, 404);

  const cost = computeCreditCost("aiGeneratedQuestion");
  const check = await checkCredits(c.env.DB, user, cost);
  if (!check.ok) return c.json({ error: check.error, code: check.code }, 402);

  const json = await generateBoardQuestion(c.env.OPENROUTER_API_KEY, {
    text: source.cleaned_text ?? source.original_text,
    options: JSON.parse(source.options_json) as string[],
    topic: source.topic,
    difficulty: source.difficulty,
  });

  await spendCredits(c.env.DB, authResult.user.id, cost, "ai_generated_question", {
    type: "question",
    id: body.questionId,
  });

  let generated: {
    text?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
  };
  try {
    generated = JSON.parse(json) as typeof generated;
  } catch {
    return c.json({ error: "Failed to parse generated question" }, 500);
  }

  if (!generated.text || !generated.options?.length) {
    return c.json({ error: "AI returned invalid question" }, 500);
  }

  const newId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO medgenius_questions (
      id, user_id, document_id, original_text, cleaned_text, options_json,
      correct_answer, explanation, topic, difficulty, verification_status, tags_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', '["ai-generated"]')`
  )
    .bind(
      newId,
      authResult.user.id,
      source.document_id,
      generated.text ?? "",
      generated.text ?? "",
      JSON.stringify(generated.options ?? []),
      generated.correctAnswer ?? null,
      generated.explanation ?? null,
      source.topic,
      source.difficulty
    )
    .run();

  const created = await getQuestion(c.env.DB, authResult.user.id, newId);
  if (!created) return c.json({ error: "Failed to save question" }, 500);

  return c.json(serializeQuestion(created, []));
});

medgeniusRoutes.post("/documents/:id/detect-conflicts", async (c) => {
  const authResult = await requireAuth(c);
  if ("error" in authResult) return c.json({ error: authResult.error }, authResult.status);

  if (!c.env.OPENROUTER_API_KEY) {
    return c.json({ error: "AI not configured" }, 503);
  }

  const doc = await getDocument(c.env.DB, authResult.user.id, c.req.param("id"));
  if (!doc) return c.json({ error: "Document not found" }, 404);

  const user = await c.env.DB.prepare("SELECT * FROM medgenius_users WHERE user_id = ?")
    .bind(authResult.user.id)
    .first<import("../types").MedGeniusUserRow>();
  if (!user) return c.json({ error: "User not found" }, 404);

  const cost = computeCreditCost("conflictDetection");
  const check = await checkCredits(c.env.DB, user, cost);
  if (!check.ok) return c.json({ error: check.error, code: check.code }, 402);

  await spendCredits(c.env.DB, authResult.user.id, cost, "conflict_detection", {
    type: "document",
    id: doc.id,
  });

  const conflicts = await detectAnswerConflicts(
    c.env.DB,
    c.env.OPENROUTER_API_KEY,
    authResult.user.id,
    doc.id
  );

  return c.json({ conflictsFound: conflicts });
});
