"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocale } from "@/hooks/useLocale";
import { getHomeMessages, type HomeMessages } from "@/lib/i18n/home";
import type { AppLocale } from "@/lib/locale";

type HomeLocaleContextValue = {
  locale: AppLocale;
  toggleLocale: () => void;
  m: HomeMessages;
};

const HomeLocaleContext = createContext<HomeLocaleContextValue | null>(null);

export function HomeLocaleProvider({ children }: { children: ReactNode }) {
  const { locale, toggleLocale } = useLocale();
  const m = useMemo(() => getHomeMessages(locale), [locale]);

  return (
    <HomeLocaleContext.Provider value={{ locale, toggleLocale, m }}>
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
