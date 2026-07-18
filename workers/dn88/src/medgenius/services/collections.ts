export async function listCollections(db: D1Database, userId: string) {
  const result = await db
    .prepare(
      "SELECT * FROM medgenius_collections WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100"
    )
    .bind(userId)
    .all();

  return (result.results ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      color: r.color,
      itemCount: r.item_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

export async function createCollection(
  db: D1Database,
  userId: string,
  params: { name: string; description?: string; color?: string }
) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO medgenius_collections (id, user_id, name, description, color)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, userId, params.name, params.description ?? null, params.color ?? null)
    .run();

  return { id, name: params.name };
}

export async function addToCollection(
  db: D1Database,
  userId: string,
  collectionId: string,
  questionId: string
) {
  const collection = await db
    .prepare("SELECT id FROM medgenius_collections WHERE id = ? AND user_id = ?")
    .bind(collectionId, userId)
    .first();

  if (!collection) throw new Error("Collection not found");

  await db
    .prepare(
      `INSERT OR IGNORE INTO medgenius_collection_items (collection_id, question_id)
       VALUES (?, ?)`
    )
    .bind(collectionId, questionId)
    .run();

  await db
    .prepare(
      `UPDATE medgenius_collections SET
        item_count = (SELECT COUNT(*) FROM medgenius_collection_items WHERE collection_id = ?),
        updated_at = datetime('now')
      WHERE id = ?`
    )
    .bind(collectionId, collectionId)
    .run();
}

export async function getCollectionQuestions(
  db: D1Database,
  userId: string,
  collectionId: string
) {
  const result = await db
    .prepare(
      `SELECT q.* FROM medgenius_questions q
       INNER JOIN medgenius_collection_items ci ON ci.question_id = q.id
       INNER JOIN medgenius_collections c ON c.id = ci.collection_id
       WHERE c.id = ? AND c.user_id = ?
       ORDER BY ci.sort_order, ci.added_at DESC`
    )
    .bind(collectionId, userId)
    .all();

  return result.results ?? [];
}

export async function deleteCollection(
  db: D1Database,
  userId: string,
  collectionId: string
) {
  await db
    .prepare("DELETE FROM medgenius_collections WHERE id = ? AND user_id = ?")
    .bind(collectionId, userId)
    .run();
}
