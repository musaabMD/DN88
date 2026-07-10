"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import type { PageSearchItem } from "@/lib/pages";
import { searchPagesApi } from "@/lib/pages/page-api";

type WikiLinkPickerProps = {
  open: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSelect: (item: PageSearchItem) => void;
};

/** Modal picker for linking selected text to an internal page. */
export function WikiLinkPicker({
  open,
  initialQuery = "",
  onClose,
  onSelect,
}: WikiLinkPickerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<PageSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void searchPagesApi(query, controller.signal)
      .then((response) => {
        setItems(response.items);
        setError(response.error ?? null);
        setSelectedIndex(0);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [open, query]);

  if (!open) return null;

  const choose = (item: PageSearchItem) => {
    onSelect(item);
    onClose();
  };

  return (
    <div className="wiki-link-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="wiki-link-picker"
        role="dialog"
        aria-label="Link to page"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wiki-link-picker-input-wrap">
          <Search size={16} strokeWidth={2} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            className="wiki-link-picker-input"
            placeholder="Search pages…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(items.length, 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((prev) => (prev + items.length - 1) % Math.max(items.length, 1));
              }
              if (event.key === "Enter" && items[selectedIndex]) {
                event.preventDefault();
                choose(items[selectedIndex]!);
              }
            }}
          />
        </div>

        {loading ? (
          <p className="wiki-link-picker-status">
            <Loader2 size={14} className="wiki-link-picker-spinner" aria-hidden />
            Searching…
          </p>
        ) : null}
        {error ? <p className="wiki-link-picker-error">{error}</p> : null}

        <ul className="wiki-link-picker-list">
          {items.map((item, index) => {
            const key = item.exists ? item.id : item.pendingId;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`wiki-link-picker-item ${
                    index === selectedIndex ? "is-selected" : ""
                  } ${item.exists ? "is-existing" : "is-missing"}`}
                  onClick={() => choose(item)}
                >
                  <FileText size={14} strokeWidth={2} aria-hidden />
                  <span>{item.exists ? item.title : `${item.title} (create page)`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
