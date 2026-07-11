import type { Bindings } from "../types";

type D1 = Bindings["DB"];

export async function logAudit(
  db: D1,
  event: {
    id: string;
    articleId?: string;
    actorType: "system" | "ai" | "admin";
    actorId?: string;
    action: string;
    detail?: unknown;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audit_events (id, article_id, actor_type, actor_id, action, detail_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      event.id,
      event.articleId ?? null,
      event.actorType,
      event.actorId ?? null,
      event.action,
      event.detail ? JSON.stringify(event.detail) : null
    )
    .run();
}

export async function getCatalogState(db: D1) {
  const row = await db
    .prepare(
      `SELECT sync_state, active_snapshot_id, last_success_at, last_failure_at, last_error
       FROM catalog_state WHERE id = 1`
    )
    .first<{
      sync_state: string;
      active_snapshot_id: string | null;
      last_success_at: string | null;
      last_failure_at: string | null;
      last_error: string | null;
    }>();
  return (
    row ?? {
      sync_state: "unavailable",
      active_snapshot_id: null,
      last_success_at: null,
      last_failure_at: null,
      last_error: null,
    }
  );
}

export async function setCatalogState(
  db: D1,
  patch: {
    syncState: string;
    activeSnapshotId?: string | null;
    lastSuccessAt?: string | null;
    lastFailureAt?: string | null;
    lastError?: string | null;
  }
): Promise<void> {
  await db
    .prepare(
      `UPDATE catalog_state SET
        sync_state = ?,
        active_snapshot_id = COALESCE(?, active_snapshot_id),
        last_success_at = COALESCE(?, last_success_at),
        last_failure_at = COALESCE(?, last_failure_at),
        last_error = ?
       WHERE id = 1`
    )
    .bind(
      patch.syncState,
      patch.activeSnapshotId ?? null,
      patch.lastSuccessAt ?? null,
      patch.lastFailureAt ?? null,
      patch.lastError ?? null
    )
    .run();
}

export function verifySyncSecret(
  env: Bindings,
  header: string | undefined
): boolean {
  const secret = env.CATALOG_SYNC_SECRET?.trim();
  if (!secret) return false;
  return header === secret || header === `Bearer ${secret}`;
}
