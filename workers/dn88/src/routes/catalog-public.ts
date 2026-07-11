import { Hono } from "hono";
import type { ArticleRow, Bindings, SectionRow } from "../types";
import { getCatalogState } from "../services/catalog-db";
import { publicArticleFilter } from "../services/publication";

type Env = { Bindings: Bindings };

export const catalogPublicRoutes = new Hono<Env>();

catalogPublicRoutes.get("/state", async (c) => {
  const state = await getCatalogState(c.env.DB);
  return c.json({
    syncState: state.sync_state,
    activeSnapshotId: state.active_snapshot_id,
    lastSuccessAt: state.last_success_at,
    lastFailureAt: state.last_failure_at,
    lastError: state.last_error,
  });
});

catalogPublicRoutes.get("/articles", async (c) => {
  const state = await getCatalogState(c.env.DB);
  if (state.sync_state === "unavailable") {
    return c.json({ articles: [], syncState: "unavailable" });
  }

  const rows = await c.env.DB.prepare(
    `SELECT id, public_slug, title, slug, specialty, subject, read_minutes, updated_at,
            content_status, ai_review_status, admin_publication_status, has_blocking_errors
     FROM articles ORDER BY title ASC`
  ).all<ArticleRow>();

  const articles = (rows.results ?? [])
    .filter(publicArticleFilter)
    .map((row: ArticleRow) => ({
      id: row.id,
      publicSlug: row.public_slug,
      title: row.title,
      slug: row.slug,
      specialty: row.specialty,
      subject: row.subject,
      readMinutes: row.read_minutes,
      updatedAt: row.updated_at,
    }));

  return c.json({ articles, syncState: state.sync_state });
});

catalogPublicRoutes.get("/articles/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = await c.env.DB.prepare(
    `SELECT * FROM articles WHERE public_slug = ? OR slug = ? OR id = ? LIMIT 1`
  )
    .bind(slug, slug, slug)
    .first<ArticleRow>();

  if (!row || !publicArticleFilter(row)) {
    return c.json({ error: "Article not found" }, 404);
  }

  const sections = await c.env.DB.prepare(
    `SELECT section_id, heading, body_markdown, sort_order
     FROM article_sections WHERE article_id = ? ORDER BY sort_order ASC`
  )
    .bind(row.id)
    .all<SectionRow>();

  const r2Object = await c.env.SNAPSHOTS.get(row.r2_article_key);
  let snapshotBody: Record<string, unknown> | null = null;
  if (r2Object) {
    try {
      snapshotBody = (await r2Object.json()) as Record<string, unknown>;
    } catch {
      snapshotBody = null;
    }
  }

  return c.json({
    id: row.id,
    publicSlug: row.public_slug,
    title: row.title,
    slug: row.slug,
    specialty: row.specialty,
    subject: row.subject,
    readMinutes: row.read_minutes,
    updatedAt: row.updated_at,
    preambleMarkdown: snapshotBody?.preambleMarkdown ?? null,
    sections: (sections.results ?? []).map((s: SectionRow) => ({
      id: s.section_id,
      heading: s.heading,
      bodyMarkdown: s.body_markdown,
      sortOrder: s.sort_order,
    })),
    commitSha: row.dl88_commit_sha,
  });
});

catalogPublicRoutes.get("/search", async (c) => {
  const q = c.req.query("q")?.trim().toLowerCase() ?? "";
  if (!q) return c.json({ results: [] });

  const rows = await c.env.DB.prepare(
    `SELECT id, public_slug, title, specialty, subject, read_minutes, updated_at,
            content_status, ai_review_status, admin_publication_status, has_blocking_errors
     FROM articles`
  ).all<ArticleRow>();

  const results = (rows.results ?? [])
    .filter(publicArticleFilter)
    .filter(
      (row: ArticleRow) =>
        row.title.toLowerCase().includes(q) ||
        row.public_slug.toLowerCase().includes(q) ||
        (row.subject ?? "").toLowerCase().includes(q)
    )
    .slice(0, 50)
    .map((row: ArticleRow) => ({
      id: row.id,
      publicSlug: row.public_slug,
      title: row.title,
      specialty: row.specialty,
      subject: row.subject,
      readMinutes: row.read_minutes,
    }));

  return c.json({ results });
});
