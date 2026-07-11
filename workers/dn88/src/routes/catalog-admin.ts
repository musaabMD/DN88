import { Hono } from "hono";
import type { ArticleRow, Bindings } from "../types";
import { requireAdmin } from "../middleware/auth";
import { canApprove, rowToPublishable } from "../services/publication";
import { logAudit, getCatalogState } from "../services/catalog-db";
import { runAiReview } from "@dn88/catalog";

type Env = { Bindings: Bindings };

export const catalogAdminRoutes = new Hono<Env>();

catalogAdminRoutes.get("/catalog/summary", async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);

  const counts = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN content_status = 'scaffold' THEN 1 ELSE 0 END) as scaffold,
      SUM(CASE WHEN content_status = 'partial' THEN 1 ELSE 0 END) as partial,
      SUM(CASE WHEN content_status = 'complete' THEN 1 ELSE 0 END) as complete,
      SUM(CASE WHEN ai_review_status = 'recommended-for-approval' THEN 1 ELSE 0 END) as recommended,
      SUM(CASE WHEN admin_publication_status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN admin_publication_status = 'pending' THEN 1 ELSE 0 END) as pending
     FROM articles`
  ).first<{
    total: number;
    scaffold: number;
    partial: number;
    complete: number;
    recommended: number;
    approved: number;
    pending: number;
  }>();

  const state = await getCatalogState(c.env.DB);

  return c.json({
    syncState: state.sync_state,
    counts: counts ?? {
      total: 0,
      scaffold: 0,
      partial: 0,
      complete: 0,
      recommended: 0,
      approved: 0,
      pending: 0,
    },
  });
});

catalogAdminRoutes.get("/articles", async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);

  const status = c.req.query("status");
  let query = `SELECT * FROM articles`;
  const binds: string[] = [];
  if (status) {
    query += ` WHERE admin_publication_status = ? OR ai_review_status = ? OR content_status = ?`;
    binds.push(status, status, status);
  }
  query += ` ORDER BY modified_at DESC LIMIT 200`;

  const stmt = c.env.DB.prepare(query);
  const rows =
    binds.length > 0
      ? await stmt.bind(...binds).all<ArticleRow>()
      : await stmt.all<ArticleRow>();

  return c.json({
    articles: (rows.results ?? []).map((row: ArticleRow) => ({
      id: row.id,
      publicSlug: row.public_slug,
      title: row.title,
      contentStatus: row.content_status,
      aiReviewStatus: row.ai_review_status,
      adminPublicationStatus: row.admin_publication_status,
      hasBlockingErrors: row.has_blocking_errors === 1,
      updatedAt: row.updated_at,
    })),
  });
});

catalogAdminRoutes.get("/articles/:id", async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);

  const id = c.req.param("id");
  const row = await c.env.DB.prepare(`SELECT * FROM articles WHERE id = ?`)
    .bind(id)
    .first<ArticleRow>();
  if (!row) return c.json({ error: "Not found" }, 404);

  const issues = await c.env.DB.prepare(
    `SELECT code, severity, message, section_id FROM validation_issues WHERE article_id = ?`
  )
    .bind(id)
    .all();

  const review = await c.env.DB.prepare(`SELECT * FROM ai_reviews WHERE article_id = ?`)
    .bind(id)
    .first();

  const sections = await c.env.DB.prepare(
    `SELECT section_id, heading, sort_order FROM article_sections WHERE article_id = ? ORDER BY sort_order`
  )
    .bind(id)
    .all();

  return c.json({
    article: row,
    sections: sections.results ?? [],
    validationIssues: issues.results ?? [],
    aiReview: review ?? null,
  });
});

catalogAdminRoutes.post("/articles/:id/approve", async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);

  const id = c.req.param("id");
  const row = await c.env.DB.prepare(`SELECT * FROM articles WHERE id = ?`)
    .bind(id)
    .first<ArticleRow>();
  if (!row) return c.json({ error: "Not found" }, 404);

  if (!canApprove(rowToPublishable(row))) {
    return c.json(
      {
        error:
          "Cannot approve: article must be complete, AI-recommended, and have no blocking errors",
      },
      400
    );
  }

  await c.env.DB.prepare(
    `UPDATE articles SET admin_publication_status = 'approved', modified_at = datetime('now') WHERE id = ?`
  )
    .bind(id)
    .run();

  const decisionId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO admin_decisions (id, article_id, status, decided_by, decided_at, note)
     VALUES (?, ?, 'approved', ?, datetime('now'), NULL)`
  )
    .bind(decisionId, id, auth.user.id)
    .run();

  await logAudit(c.env.DB, {
    id: crypto.randomUUID(),
    articleId: id,
    actorType: "admin",
    actorId: auth.user.id,
    action: "article.approved",
  });

  return c.json({ ok: true, status: "approved" });
});

catalogAdminRoutes.post("/articles/:id/reject", async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);

  const id = c.req.param("id");
  let note = "";
  try {
    const body = await c.req.json<{ note?: string }>();
    note = body.note?.trim() ?? "";
  } catch {
    return c.json({ error: "Invalid body" }, 400);
  }
  if (!note) return c.json({ error: "Reject note is required" }, 400);

  await c.env.DB.prepare(
    `UPDATE articles SET admin_publication_status = 'rejected', modified_at = datetime('now') WHERE id = ?`
  )
    .bind(id)
    .run();

  await c.env.DB.prepare(
    `INSERT INTO admin_decisions (id, article_id, status, decided_by, decided_at, note)
     VALUES (?, ?, 'rejected', ?, datetime('now'), ?)`
  )
    .bind(crypto.randomUUID(), id, auth.user.id, note)
    .run();

  await logAudit(c.env.DB, {
    id: crypto.randomUUID(),
    articleId: id,
    actorType: "admin",
    actorId: auth.user.id,
    action: "article.rejected",
    detail: { note },
  });

  return c.json({ ok: true, status: "rejected" });
});

catalogAdminRoutes.post("/articles/:id/unpublish", async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);

  const id = c.req.param("id");
  await c.env.DB.prepare(
    `UPDATE articles SET admin_publication_status = 'unpublished', modified_at = datetime('now') WHERE id = ?`
  )
    .bind(id)
    .run();

  await logAudit(c.env.DB, {
    id: crypto.randomUUID(),
    articleId: id,
    actorType: "admin",
    actorId: auth.user.id,
    action: "article.unpublished",
  });

  return c.json({ ok: true, status: "unpublished" });
});

catalogAdminRoutes.post("/articles/:id/ai-review", async (c) => {
  const auth = await requireAdmin(c);
  if ("error" in auth) return c.json({ error: auth.error }, auth.status);

  const id = c.req.param("id");
  const row = await c.env.DB.prepare(`SELECT * FROM articles WHERE id = ?`)
    .bind(id)
    .first<ArticleRow>();
  if (!row) return c.json({ error: "Not found" }, 404);

  if (row.content_status !== "complete" || row.has_blocking_errors === 1) {
    return c.json({ error: "Article not eligible for AI review" }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE articles SET ai_review_status = 'reviewing', modified_at = datetime('now') WHERE id = ?`
  )
    .bind(id)
    .run();

  const r2Object = await c.env.SNAPSHOTS.get(row.r2_article_key);
  if (!r2Object) {
    return c.json({ error: "Article snapshot not found in R2" }, 404);
  }

  const snapshot = (await r2Object.json()) as {
    title: string;
    specialty: string;
    sections: Array<{ heading: string; bodyMarkdown: string }>;
  };

  try {
    const review = await runAiReview(snapshot, {
      apiKey: c.env.OPENAI_API_KEY,
    });

    await c.env.DB.prepare(
      `INSERT INTO ai_reviews (article_id, status, summary, strengths_json, concerns_json,
        required_changes_json, safety_flags_json, evidence_flags_json, model, review_version, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(article_id) DO UPDATE SET
        status = excluded.status,
        summary = excluded.summary,
        strengths_json = excluded.strengths_json,
        concerns_json = excluded.concerns_json,
        required_changes_json = excluded.required_changes_json,
        safety_flags_json = excluded.safety_flags_json,
        evidence_flags_json = excluded.evidence_flags_json,
        model = excluded.model,
        review_version = excluded.review_version,
        reviewed_at = datetime('now')`
    )
      .bind(
        id,
        review.status,
        review.summary,
        JSON.stringify(review.strengths),
        JSON.stringify(review.concerns),
        JSON.stringify(review.requiredChanges),
        JSON.stringify(review.safetyFlags),
        JSON.stringify(review.evidenceFlags),
        c.env.OPENAI_API_KEY ? "openai" : "skipped",
        "1.0.0"
      )
      .run();

    const aiStatus =
      review.status === "recommended-for-approval"
        ? "recommended-for-approval"
        : review.status === "not-for-publication"
          ? "not-for-publication"
          : "changes-required";

    await c.env.DB.prepare(
      `UPDATE articles SET ai_review_status = ?, modified_at = datetime('now') WHERE id = ?`
    )
      .bind(aiStatus, id)
      .run();

    await logAudit(c.env.DB, {
      id: crypto.randomUUID(),
      articleId: id,
      actorType: "ai",
      action: "ai.review.completed",
      detail: { status: review.status },
    });

    return c.json({ ok: true, review });
  } catch (error) {
    await c.env.DB.prepare(
      `UPDATE articles SET ai_review_status = 'not-reviewed', modified_at = datetime('now') WHERE id = ?`
    )
      .bind(id)
      .run();
    const message = error instanceof Error ? error.message : "AI review failed";
    return c.json({ error: message }, 502);
  }
});
