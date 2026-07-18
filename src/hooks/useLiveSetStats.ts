"use client";

import { useEffect, useState } from "react";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import { fetchLiveSetStats, type LiveSetStats } from "@/lib/qbank/live-stats";
import { isLiveSetId } from "@/lib/qbank/live-data";

export function useLiveSetStats(setId: string) {
  const clerkEnabled = useClerkEnabled();
  const shouldFetch = isLiveSetId(setId) && clerkEnabled && isClerkSignedIn();
  const [stats, setStats] = useState<LiveSetStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const token = await getClerkToken();
        if (!token) return;
        const live = await fetchLiveSetStats(token, setId);
        if (!cancelled) setStats(live);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setId, shouldFetch]);

  return { stats: shouldFetch ? stats : null, loading: shouldFetch && loading };
}
