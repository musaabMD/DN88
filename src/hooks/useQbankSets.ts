"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContentTab } from "@/lib/routes";
import type { StudySet } from "@/lib/set-content";
import {
  defaultSetsForTab,
  fetchLiveSetsForTab,
  mergeSets,
} from "@/lib/qbank/live-data";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

export function useQbankSets(examId: string, tab: ContentTab) {
  const clerkEnabled = useClerkEnabled();
  const mock = useMemo(() => defaultSetsForTab(tab), [tab]);
  const shouldFetchLive =
    clerkEnabled && isClerkSignedIn() && tab !== "library";
  const cacheKey = `${examId}:${tab}`;
  const [liveSets, setLiveSets] = useState<StudySet[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!shouldFetchLive) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        const live = token ? await fetchLiveSetsForTab(token, examId, tab) : [];
        if (!cancelled) {
          setLiveSets(live);
          setLoadedFor(cacheKey);
        }
      } catch {
        if (!cancelled) {
          setLiveSets(null);
          setLoadedFor(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, examId, shouldFetchLive, tab]);

  const sets =
    shouldFetchLive && loadedFor === cacheKey && liveSets
      ? mergeSets(mock, liveSets)
      : mock;

  const loading = shouldFetchLive && loadedFor !== cacheKey;

  const refresh = useCallback(async () => {
    if (!shouldFetchLive) return;

    setRefreshing(true);
    try {
      const token = await getClerkToken();
      const live = token ? await fetchLiveSetsForTab(token, examId, tab) : [];
      setLiveSets(live);
      setLoadedFor(cacheKey);
    } catch {
      setLiveSets(null);
      setLoadedFor(null);
    } finally {
      setRefreshing(false);
    }
  }, [cacheKey, examId, shouldFetchLive, tab]);

  return { sets, loading: loading || refreshing, refresh };
}
