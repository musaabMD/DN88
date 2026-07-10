"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { PageSearchItem } from "@/lib/pages";
import { searchPagesApi } from "@/lib/pages/page-api";

export type WikiLinkAutocompleteRef = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

type WikiLinkAutocompleteProps = {
  items: PageSearchItem[];
  command: (item: PageSearchItem) => void;
  query: string;
  loading?: boolean;
  error?: string | null;
};

export const WikiLinkAutocomplete = forwardRef<
  WikiLinkAutocompleteRef,
  WikiLinkAutocompleteProps
>(function WikiLinkAutocomplete(
  { items: initialItems, command, query, loading: externalLoading, error },
  ref
) {
  const [items, setItems] = useState<PageSearchItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setSelectedIndex(0);
  }, [initialItems]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFetchError(null);

    void searchPagesApi(query, controller.signal)
      .then((response) => {
        setItems(response.items);
        setFetchError(response.error ?? null);
        setSelectedIndex(0);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFetchError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + items.length - 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        return true;
      }
      return false;
    },
  }));

  const showLoading = loading || externalLoading;
  const displayError = error ?? fetchError;

  return (
    <div className="wiki-link-autocomplete" role="listbox" aria-label="Link to page">
      {showLoading ? (
        <p className="wiki-link-autocomplete-status">Searching pages…</p>
      ) : null}
      {displayError ? (
        <p className="wiki-link-autocomplete-error" role="alert">
          {displayError}
        </p>
      ) : null}
      {!showLoading && items.length === 0 ? (
        <p className="wiki-link-autocomplete-status">No pages found</p>
      ) : null}
      <ul className="wiki-link-autocomplete-list">
        {items.map((item, index) => {
          const key = item.exists ? item.id : item.pendingId;
          const label = item.exists ? item.title : `${item.title} (create)`;
          return (
            <li key={key}>
              <button
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                className={`wiki-link-autocomplete-item ${
                  index === selectedIndex ? "is-selected" : ""
                } ${item.exists ? "is-existing" : "is-missing"}`}
                onClick={() => selectItem(index)}
              >
                <span>{label}</span>
                {!item.exists ? (
                  <span className="wiki-link-autocomplete-badge">New page</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
