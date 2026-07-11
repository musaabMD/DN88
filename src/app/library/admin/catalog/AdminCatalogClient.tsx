"use client";

import { useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useState } from "react";
import {
  adminApproveArticle,
  adminRejectArticle,
  adminRequestAiReview,
  fetchAdminArticles,
  fetchAdminSummary,
} from "@/lib/catalog/api";
import type { AdminArticleSummary } from "@/lib/catalog/types";
import { LibraryBrowseShell } from "@/components/library/LibraryBrowseShell";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

export default function AdminCatalogClient() {
  const clerkEnabled = useClerkEnabled();
  const { getToken, isSignedIn } = useAuth();
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [articles, setArticles] = useState<AdminArticleSummary[]>([]);
  const [filter, setFilter] = useState("pending");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in required");
      const [s, a] = await Promise.all([
        fetchAdminSummary(token),
        fetchAdminArticles(token, filter),
      ]);
      setSummary(s as Record<string, unknown>);
      setArticles(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [getToken, filter]);

  useEffect(() => {
    if (clerkEnabled && isSignedIn) void load();
  }, [clerkEnabled, isSignedIn, load]);

  async function act(
    id: string,
    action: "approve" | "reject" | "ai-review"
  ) {
    const token = await getToken();
    if (!token) return;
    try {
      if (action === "approve") await adminApproveArticle(token, id);
      if (action === "ai-review") await adminRequestAiReview(token, id);
      if (action === "reject") {
        const note = prompt("Rejection note (required):")?.trim();
        if (!note) return;
        await adminRejectArticle(token, id, note);
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    }
  }

  if (!clerkEnabled) {
    return (
      <LibraryBrowseShell>
        <p className="text-muted-foreground">
          Admin catalog requires Clerk on an allowed host (localhost or drnote.co).
        </p>
      </LibraryBrowseShell>
    );
  }

  if (!isSignedIn) {
    return (
      <LibraryBrowseShell>
        <p className="text-muted-foreground">Sign in with an admin account.</p>
      </LibraryBrowseShell>
    );
  }

  return (
    <LibraryBrowseShell>
      <LibraryPageHeader seed="admin" title="Catalog admin" meta="Publication workflow" />
      {error ? <p className="text-destructive">{error}</p> : null}
      {summary ? (
        <pre className="mb-4 overflow-auto rounded bg-muted p-3 text-xs">
          {JSON.stringify(summary, null, 2)}
        </pre>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {["pending", "recommended-for-approval", "approved", "complete"].map(
          (f) => (
            <button
              key={f}
              type="button"
              className={`rounded border px-3 py-1 text-sm ${filter === f ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          )
        )}
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.id} className="rounded-lg border p-4">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-muted-foreground">
                {a.contentStatus} · AI: {a.aiReviewStatus} · Admin:{" "}
                {a.adminPublicationStatus}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => act(a.id, "ai-review")}
                >
                  AI review
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => act(a.id, "approve")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => act(a.id, "reject")}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </LibraryBrowseShell>
  );
}
