"use client";

import { useCallback, useEffect, useState } from "react";
import { getClerkToken } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import {
  addCollectionItem,
  createCollection,
  deleteCollection,
  fetchCollections,
} from "@/lib/medgenius/api";

export function CollectionsPanel({ documentId }: { documentId?: string }) {
  const clerkEnabled = useClerkEnabled();
  const [collections, setCollections] = useState<
    Array<{ id: string; name: string; itemCount: number }>
  >([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!clerkEnabled) return;
    setLoading(true);
    try {
      const token = await getClerkToken();
      if (!token) return;
      const { collections: list } = await fetchCollections(token);
      setCollections(list);
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [clerkEnabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!clerkEnabled) return null;

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const token = await getClerkToken();
      if (!token) return;
      await createCollection(token, trimmed);
      setName("");
      await refresh();
    } catch {
      /* ignore */
    }
  };

  const handleAddDoc = async (collectionId: string) => {
    if (!documentId) return;
    try {
      const token = await getClerkToken();
      if (!token) return;
      await addCollectionItem(token, collectionId, documentId);
      await refresh();
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (collectionId: string) => {
    try {
      const token = await getClerkToken();
      if (!token) return;
      await deleteCollection(token, collectionId);
      await refresh();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 mb-4">
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-3">
        Notebook collections
      </p>
      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New collection name"
          className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-semibold"
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-extrabold uppercase text-white"
        >
          Add
        </button>
      </div>
      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      <ul className="space-y-2">
        {collections.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
          >
            <span className="text-sm font-bold text-slate-800">
              {c.name} <span className="text-slate-400">({c.itemCount})</span>
            </span>
            <span className="flex gap-2">
              {documentId && (
                <button
                  type="button"
                  onClick={() => void handleAddDoc(c.id)}
                  className="text-xs font-extrabold text-indigo-600"
                >
                  Add doc
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleDelete(c.id)}
                className="text-xs font-extrabold text-red-500"
              >
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
