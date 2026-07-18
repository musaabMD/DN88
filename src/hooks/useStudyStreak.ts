"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAnalytics } from "@/lib/medgenius/api";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

export type StudyStreakData = {
  streakDays: number;
  dailyGoal: number;
  dailyAnswered: number;
  readinessPct: number;
};

const EMPTY: StudyStreakData = {
  streakDays: 0,
  dailyGoal: 20,
  dailyAnswered: 0,
  readinessPct: 0,
};

const DAILY_GOAL = 20;

/** Derive streak and daily progress from MedGenius analytics API. */
export function useStudyStreak(enabled = true) {
  const clerkEnabled = useClerkEnabled();
  const shouldFetch = enabled && clerkEnabled && isClerkSignedIn();
  const [data, setData] = useState<StudyStreakData>(EMPTY);

  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        if (!token) return;
        const stats = await fetchAnalytics(token);
        if (cancelled) return;

        const dailyAnswered = stats.totalAnswered;
        const readinessPct = stats.accuracy;
        const streakDays =
          dailyAnswered >= DAILY_GOAL
            ? Math.max(1, Math.min(365, Math.floor(stats.totalStudySec / 3600) + 1))
            : dailyAnswered > 0
              ? 1
              : 0;

        setData({
          streakDays,
          dailyGoal: DAILY_GOAL,
          dailyAnswered: Math.min(dailyAnswered, DAILY_GOAL),
          readinessPct,
        });
      } catch {
        if (!cancelled) setData(EMPTY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldFetch]);

  return useMemo(() => (shouldFetch ? data : EMPTY), [shouldFetch, data]);
}
