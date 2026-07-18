"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { getHomeMessages, type HomeMessages } from "@/lib/i18n/home";
import { getHomeContent, type HomeContent } from "@/lib/i18n/home-content";
import { applyEnglishLocale } from "@/lib/locale";

type HomeLocaleContextValue = {
  m: HomeMessages;
  content: HomeContent;
};

const HomeLocaleContext = createContext<HomeLocaleContextValue | null>(null);

export function HomeLocaleProvider({ children }: { children: ReactNode }) {
  const m = useMemo(() => getHomeMessages(), []);
  const content = useMemo(() => getHomeContent(), []);

  useEffect(() => {
    applyEnglishLocale();
  }, []);

  return (
    <HomeLocaleContext.Provider value={{ m, content }}>
      {children}
    </HomeLocaleContext.Provider>
  );
}

export function useHomeLocale(): HomeLocaleContextValue {
  const ctx = useContext(HomeLocaleContext);
  if (!ctx) {
    throw new Error("useHomeLocale must be used within HomeLocaleProvider");
  }
  return ctx;
}
