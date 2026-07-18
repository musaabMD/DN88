"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getClerkToken } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import { fetchCredits, type CreditSummary } from "./api";

type CreditsContextValue = {
  credits: CreditSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  applyRemaining: (remaining: number) => void;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

async function loadCredits(): Promise<CreditSummary> {
  const token = await getClerkToken();
  return fetchCredits(token);
}

export function MedGeniusCreditsProvider({ children }: { children: ReactNode }) {
  const clerkEnabled = useClerkEnabled();
  const [credits, setCredits] = useState<CreditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!clerkEnabled) {
      setCredits(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await loadCredits();
      setCredits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credits");
    } finally {
      setLoading(false);
    }
  }, [clerkEnabled]);

  useEffect(() => {
    if (!clerkEnabled) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadCredits();
        if (!cancelled) setCredits(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load credits");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clerkEnabled]);

  const applyRemaining = useCallback((remaining: number) => {
    setCredits((prev) =>
      prev ? { ...prev, creditsBalance: remaining } : prev
    );
  }, []);

  const value = useMemo(
    () => ({ credits, loading, error, refresh, applyRemaining }),
    [credits, loading, error, refresh, applyRemaining]
  );

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

export function useMedGeniusCreditsContext(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    return {
      credits: null,
      loading: false,
      error: null,
      refresh: async () => {},
      applyRemaining: () => {},
    };
  }
  return ctx;
}
