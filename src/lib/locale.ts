export type AppLocale = "en" | "ar";

const STORAGE_KEY = "drnote-locale";

export const LOCALE_FLAGS: Record<AppLocale, string> = {
  en: "🇺🇸",
  ar: "🇸🇦",
};

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  ar: "العربية",
};

export function getStoredLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "en" || value === "ar" ? value : null;
}

export function getPreferredLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  const stored = getStoredLocale();
  if (stored) return stored;
  const lang = navigator.language.toLowerCase();
  return lang.startsWith("ar") ? "ar" : "en";
}

export function applyLocale(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  document.documentElement.classList.toggle("locale-ar", locale === "ar");
}

export function setLocale(locale: AppLocale): void {
  localStorage.setItem(STORAGE_KEY, locale);
  applyLocale(locale);
}

export function toggleLocale(): AppLocale {
  const next: AppLocale = getPreferredLocale() === "ar" ? "en" : "ar";
  setLocale(next);
  return next;
}

export const LOCALE_CHANGE_EVENT = "drnote-locale-change";
