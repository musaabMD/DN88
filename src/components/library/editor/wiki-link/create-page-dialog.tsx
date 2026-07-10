"use client";

import { useState } from "react";
import { createPageApi } from "@/lib/pages/page-api";

type CreatePageDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onCreated: (page: { id: string; title: string; slug: string }) => void;
};

/** Shown when the user clicks a missing internal wiki link. */
export function CreatePageDialog({
  open,
  title,
  onClose,
  onCreated,
}: CreatePageDialogProps) {
  const [pageTitle, setPageTitle] = useState(title);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleCreate = async () => {
    const trimmed = pageTitle.trim();
    if (!trimmed) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { page } = await createPageApi({ title: trimmed });
      onCreated(page);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wiki-link-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="wiki-link-picker wiki-link-create-dialog"
        role="dialog"
        aria-label="Create page"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="wiki-link-create-title">Create page</h2>
        <p className="wiki-link-create-copy">
          This internal link points to a page that does not exist yet.
        </p>
        <label className="wiki-link-create-label">
          Page title
          <input
            type="text"
            className="wiki-link-picker-input wiki-link-create-input"
            value={pageTitle}
            onChange={(event) => setPageTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate();
              if (event.key === "Escape") onClose();
            }}
            disabled={loading}
          />
        </label>
        {error ? <p className="wiki-link-picker-error">{error}</p> : null}
        <div className="wiki-link-create-actions">
          <button type="button" className="wiki-link-create-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="wiki-link-create-btn wiki-link-create-btn-primary"
            onClick={() => void handleCreate()}
            disabled={loading}
          >
            {loading ? "Creating…" : "Create page"}
          </button>
        </div>
      </div>
    </div>
  );
}
