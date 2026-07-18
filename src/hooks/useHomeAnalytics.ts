"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAnalytics, fetchDueSrs } from "@/lib/medgenius/api";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

export type HomeAnalytics = {
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  totalStudySec: number;
  weakTopics: Array<{ topic: string; correct: number; incorrect: number }>;
  srsDue: number;
};

const EMPTY: HomeAnalytics = {
  totalAnswered: 0,
  totalCorrect: 0,
  accuracy: 0,
  totalStudySec: 0,
  weakTopics: [],
  srsDue: 0,
};

export function useHomeAnalytics(enabled: boolean) {
  const clerkEnabled = useClerkEnabled();
  const shouldFetch = enabled && clerkEnabled && isClerkSignedIn();
  const [analytics, setAnalytics] = useState<HomeAnalytics | null>(null);

  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        if (!token) return;
        const [stats, due] = await Promise.all([
          fetchAnalytics(token),
          fetchDueSrs(token),
        ]);
        if (cancelled) return;
        setAnalytics({
          totalAnswered: stats.totalAnswered,
          totalCorrect: stats.totalCorrect,
          accuracy: stats.accuracy,
          totalStudySec: stats.totalStudySec,
          weakTopics: stats.weakTopics,
          srsDue: due.questions.length,
        });
      } catch {
        if (!cancelled) setAnalytics(EMPTY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldFetch]);

  return useMemo(() => analytics ?? EMPTY, [analytics]);
}
