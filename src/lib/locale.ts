const STORAGE_KEY = "drnote-locale";

/** Force English LTR and clear any stored Arabic preference. */
export function applyEnglishLocale(): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  document.documentElement.classList.remove("locale-ar");
  try {
    localStorage.setItem(STORAGE_KEY, "en");
  } catch {
    /* ignore */
  }
}
