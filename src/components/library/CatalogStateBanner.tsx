"use client";

import { useEffect, useState } from "react";
import type { CatalogState } from "@/lib/catalog/types";
import { fetchCatalogState } from "@/lib/catalog/api";

export function CatalogStateBanner() {
  const [state, setState] = useState<CatalogState | null>(null);

  useEffect(() => {
    void fetchCatalogState().then(setState);
  }, []);

  if (!state || state.syncState === "fresh") return null;

  const message =
    state.syncState === "stale"
      ? "Medical library content may be slightly outdated."
      : state.syncState === "unavailable"
        ? "Medical library is temporarily unavailable. Please check back soon."
        : null;

  if (!message) return null;

  const tone =
    state.syncState === "unavailable"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : "border-sky-300 bg-sky-50 text-sky-950";

  return (
    <div
      className={`mx-auto mb-4 max-w-5xl rounded-lg border px-4 py-2 text-sm ${tone}`}
      role="status"
    >
      {message}
    </div>
  );
}
