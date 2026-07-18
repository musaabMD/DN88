import type { DocumentRow } from "../types";

export async function findDuplicateDocument(
  db: D1Database,
  userId: string,
  fileHash: string
): Promise<DocumentRow | null> {
  return (
    (await db
      .prepare(
        "SELECT * FROM medgenius_documents WHERE user_id = ? AND file_hash = ? AND processing_status != 'failed' LIMIT 1"
      )
      .bind(userId, fileHash)
      .first<DocumentRow>()) ?? null
  );
}

export async function getDocument(
  db: D1Database,
  userId: string,
  documentId: string
): Promise<DocumentRow | null> {
  return (
    (await db
      .prepare("SELECT * FROM medgenius_documents WHERE id = ? AND user_id = ?")
      .bind(documentId, userId)
      .first<DocumentRow>()) ?? null
  );
}

export async function listDocuments(
  db: D1Database,
  userId: string,
  examId?: string
): Promise<DocumentRow[]> {
  const query = examId
    ? "SELECT * FROM medgenius_documents WHERE user_id = ? AND exam_id = ? ORDER BY created_at DESC LIMIT 200"
    : "SELECT * FROM medgenius_documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 200";

  const result = examId
    ? await db.prepare(query).bind(userId, examId).all<DocumentRow>()
    : await db.prepare(query).bind(userId).all<DocumentRow>();

  return result.results ?? [];
}

export async function updateDocumentStatus(
  db: D1Database,
  documentId: string,
  status: DocumentRow["processing_status"],
  progress: number,
  error?: string | null
): Promise<void> {
  await db
    .prepare(
      `UPDATE medgenius_documents SET
        processing_status = ?, processing_progress = ?, processing_error = ?,
        updated_at = datetime('now'),
        processed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE processed_at END
      WHERE id = ?`
    )
    .bind(status, progress, error ?? null, status, documentId)
    .run();
}

export async function storeMarkdown(
  bucket: R2Bucket,
  key: string,
  markdown: string
): Promise<void> {
  await bucket.put(key, markdown, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
  });
}

export async function getMarkdown(
  bucket: R2Bucket,
  key: string
): Promise<string | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;
  return obj.text();
}

export function buildR2Keys(userId: string, documentId: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = `users/${userId}/documents/${documentId}`;
  return {
    original: `${prefix}/original/${safeName}`,
    markdown: `${prefix}/content.md`,
    images: `${prefix}/images`,
  };
}
