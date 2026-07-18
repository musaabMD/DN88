"use client";

import { useEffect, useMemo, useState } from "react";
import { getSetById } from "@/lib/mock-data";
import type { ContentTab } from "@/lib/routes";
import type { StudySet } from "@/lib/set-content";
import {
  fetchLiveSetById,
  isLiveSetId,
} from "@/lib/qbank/live-data";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

export function useLiveSet(examId: string, tab: ContentTab, setId: string) {
  const clerkEnabled = useClerkEnabled();
  const isLive = isLiveSetId(setId);
  const shouldFetchLive = isLive && clerkEnabled && isClerkSignedIn();
  const mockSet = useMemo(() => getSetById(tab, setId), [tab, setId]);
  const [liveSet, setLiveSet] = useState<StudySet | undefined>(undefined);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetchLive) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        const live = token ? await fetchLiveSetById(token, examId, tab, setId) : undefined;
        if (!cancelled) {
          setLiveSet(live);
          setLoadedFor(setId);
        }
      } catch {
        if (!cancelled) {
          setLiveSet(undefined);
          setLoadedFor(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, setId, shouldFetchLive, tab]);

  const set =
    shouldFetchLive && loadedFor === setId && liveSet ? liveSet : mockSet;

  const loading = shouldFetchLive && loadedFor !== setId;

  return { set, loading };
}
