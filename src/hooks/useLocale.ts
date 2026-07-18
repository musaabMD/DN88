"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyLocale,
  getPreferredLocale,
  LOCALE_CHANGE_EVENT,
  setLocale,
  type AppLocale,
} from "@/lib/locale";

export function useLocale() {
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useEffect(() => {
    const current = getPreferredLocale();
    setLocaleState(current);
    applyLocale(current);

    const onChange = (event: Event) => {
      const next = (event as CustomEvent<AppLocale>).detail;
      if (next === "en" || next === "ar") {
        setLocaleState(next);
      }
    };

    window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  }, []);

  const changeLocale = useCallback((next: AppLocale) => {
    setLocale(next);
    setLocaleState(next);
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: next }));
  }, []);

  const toggleLocale = useCallback(() => {
    changeLocale(locale === "ar" ? "en" : "ar");
  }, [changeLocale, locale]);

  return { locale, changeLocale, toggleLocale };
}
