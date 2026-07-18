"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContentTab } from "@/lib/routes";
import {
  getSessionItems,
  type FlashcardItem,
  type ImageItem,
  type NoteItem,
  type QuestionItem,
  type SessionItem,
} from "@/lib/set-content";
import {
  fetchLiveSessionItems,
  isLiveSetId,
} from "@/lib/qbank/live-data";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

export function useSessionItems(contentTab: ContentTab | string, contentSetId: string) {
  const clerkEnabled = useClerkEnabled();
  const isLive = isLiveSetId(contentSetId);
  const shouldFetchLive = isLive && clerkEnabled && isClerkSignedIn();
  const mockItems = useMemo(
    () => getSessionItems(contentTab, contentSetId),
    [contentTab, contentSetId]
  );
  const [liveItems, setLiveItems] = useState<SessionItem[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetchLive) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        const live = token
          ? await fetchLiveSessionItems(token, contentTab as ContentTab, contentSetId)
          : [];
        if (!cancelled) {
          setLiveItems(live.length > 0 ? (live as SessionItem[]) : null);
          setLoadedFor(contentSetId);
        }
      } catch {
        if (!cancelled) {
          setLiveItems(null);
          setLoadedFor(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contentSetId, contentTab, shouldFetchLive]);

  const items =
    shouldFetchLive && loadedFor === contentSetId && liveItems
      ? liveItems
      : mockItems;

  const loading = shouldFetchLive && loadedFor !== contentSetId;

  return {
    items,
    loading,
    questions: items as QuestionItem[],
    notes: items as NoteItem[],
    images: items as ImageItem[],
    flashcards: items as FlashcardItem[],
  };
}
