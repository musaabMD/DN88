import { Hono } from "hono";
import type { Bindings } from "../types";
import { verifySyncSecret, logAudit, setCatalogState } from "../services/catalog-db";

type Env = { Bindings: Bindings };

type ActivatePayload = {
  commitSha: string;
  manifest: {
    commitSha: string;
    articles: Array<{
      id: string;
      publicSlug: string;
      r2Key: string;
      sourceHash: string;
      contentStatus: string;
    }>;
    scaffold: number;
    partial: number;
    complete: number;
    invalid: number;
    discovered: number;
  };
  articles: Array<{
    id: string;
    publicSlug: string;
    title: string;
    slug: string;
    specialty: string;
    subspecialty?: string;
    subject: string;
    contentStatus: string;
    sourcePath: string;
    sourceHash: string;
    readMinutes: number;
    updatedAt: string;
    hasBlockingErrors: boolean;
    r2Key: string;
    sections: Array<{
      id: string;
      heading: string;
      bodyMarkdown: string;
      sortOrder: number;
    }>;
    allIssues: Array<{
      code: string;
      severity: string;
      message: string;
      sectionId?: string;
      sourcePath: string;
    }>;
  }>;
};

export const syncRoutes = new Hono<Env>();

syncRoutes.post("/activate", async (c) => {
  const secret = c.req.header("X-Catalog-Sync-Secret");
  if (!verifySyncSecret(c.env, secret)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let payload: ActivatePayload;
  try {
    payload = await c.req.json<ActivatePayload>();
  } catch {
    return c.json({ error: "Invalid payload" }, 400);
  }

  if (payload.manifest.complete === 0 && payload.articles.length > 0) {
    const prior = await c.env.DB.prepare(
      `SELECT COUNT(*) as n FROM articles WHERE content_status = 'complete'`
    ).first<{ n: number }>();
    if ((prior?.n ?? 0) > 0) {
      return c.json(
        { error: "Refusing activation: complete count would drop to zero" },
        400
      );
    }
  }

  const snapshotId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO catalog_sync_runs (id, started_at, finished_at, status, dl88_commit_sha,
          parser_version, discovered_count, invalid_count, scaffold_count, partial_count, complete_count, snapshot_key)
         VALUES (?, ?, ?, 'success', ?, '1.0.0', ?, ?, ?, ?, ?, ?)`
      ).bind(
        runId,
        now,
        now,
        payload.commitSha,
        payload.manifest.discovered,
        payload.manifest.invalid,
        payload.manifest.scaffold,
        payload.manifest.partial,
        payload.manifest.complete,
        `catalog/snapshots/${payload.commitSha}/manifest.json`
      ),
      c.env.DB.prepare(`UPDATE catalog_snapshots SET is_active = 0 WHERE is_active = 1`),
      c.env.DB.prepare(
        `INSERT INTO catalog_snapshots (id, commit_sha, activated_at, is_active, r2_manifest_key, metadata_json)
         VALUES (?, ?, ?, 1, ?, ?)`
      ).bind(
        snapshotId,
        payload.commitSha,
        now,
        `catalog/snapshots/${payload.commitSha}/manifest.json`,
        JSON.stringify(payload.manifest)
      ),
    ]);

    for (const article of payload.articles) {
      const existing = await c.env.DB.prepare(
        `SELECT source_hash, admin_publication_status FROM articles WHERE id = ?`
      )
        .bind(article.id)
        .first<{ source_hash: string; admin_publication_status: string }>();

      let adminStatus = "pending";
      let aiStatus = "not-reviewed";
      if (
        existing &&
        existing.source_hash === article.sourceHash &&
        existing.admin_publication_status === "approved"
      ) {
        adminStatus = "approved";
        const review = await c.env.DB.prepare(
          `SELECT status FROM ai_reviews WHERE article_id = ?`
        )
          .bind(article.id)
          .first<{ status: string }>();
        if (review?.status === "recommended-for-approval") {
          aiStatus = "recommended-for-approval";
        }
      } else if (
        existing &&
        existing.source_hash !== article.sourceHash &&
        existing.admin_publication_status === "approved"
      ) {
        await logAudit(c.env.DB, {
          id: crypto.randomUUID(),
          articleId: article.id,
          actorType: "system",
          action: "approval-invalidated-by-source-change",
        });
      }

      if (article.contentStatus !== "complete") {
        aiStatus = "not-reviewed";
      }

      await c.env.DB.prepare(
        `INSERT INTO articles (id, public_slug, title, slug, specialty, subspecialty, subject,
          content_status, ai_review_status, admin_publication_status, source_path, source_hash,
          dl88_commit_sha, read_minutes, updated_at, has_blocking_errors, r2_article_key, modified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
          public_slug = excluded.public_slug,
          title = excluded.title,
          slug = excluded.slug,
          specialty = excluded.specialty,
          subspecialty = excluded.subspecialty,
          subject = excluded.subject,
          content_status = excluded.content_status,
          ai_review_status = CASE
            WHEN excluded.content_status != 'complete' THEN 'not-reviewed'
            WHEN articles.source_hash != excluded.source_hash THEN 'not-reviewed'
            ELSE articles.ai_review_status
          END,
          admin_publication_status = CASE
            WHEN articles.source_hash != excluded.source_hash AND articles.admin_publication_status = 'approved' THEN 'pending'
            ELSE articles.admin_publication_status
          END,
          source_path = excluded.source_path,
          source_hash = excluded.source_hash,
          dl88_commit_sha = excluded.dl88_commit_sha,
          read_minutes = excluded.read_minutes,
          updated_at = excluded.updated_at,
          has_blocking_errors = excluded.has_blocking_errors,
          r2_article_key = excluded.r2_article_key,
          modified_at = datetime('now')`
      )
        .bind(
          article.id,
          article.publicSlug,
          article.title,
          article.slug,
          article.specialty,
          article.subspecialty ?? null,
          article.subject,
          article.contentStatus,
          aiStatus,
          adminStatus,
          article.sourcePath,
          article.sourceHash,
          payload.commitSha,
          article.readMinutes,
          article.updatedAt,
          article.hasBlockingErrors ? 1 : 0,
          article.r2Key
        )
        .run();

      await c.env.DB.prepare(`DELETE FROM article_sections WHERE article_id = ?`)
        .bind(article.id)
        .run();
      await c.env.DB.prepare(`DELETE FROM validation_issues WHERE article_id = ?`)
        .bind(article.id)
        .run();

      for (const section of article.sections) {
        await c.env.DB.prepare(
          `INSERT INTO article_sections (article_id, section_id, heading, body_markdown, sort_order)
           VALUES (?, ?, ?, ?, ?)`
        )
          .bind(
            article.id,
            section.id,
            section.heading,
            section.bodyMarkdown,
            section.sortOrder
          )
          .run();
      }

      for (const issue of article.allIssues) {
        await c.env.DB.prepare(
          `INSERT INTO validation_issues (id, article_id, code, severity, message, section_id, source_path)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            crypto.randomUUID(),
            article.id,
            issue.code,
            issue.severity,
            issue.message,
            issue.sectionId ?? null,
            issue.sourcePath
          )
          .run();
      }
    }

    await setCatalogState(c.env.DB, {
      syncState: "fresh",
      activeSnapshotId: snapshotId,
      lastSuccessAt: now,
      lastError: null,
    });

    return c.json({ ok: true, snapshotId, activated: payload.articles.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed";
    await setCatalogState(c.env.DB, {
      syncState: "stale",
      lastFailureAt: now,
      lastError: message,
    });
    return c.json({ error: message }, 500);
  }
});
