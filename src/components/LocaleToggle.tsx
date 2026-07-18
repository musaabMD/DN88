"use client";

import { LOCALE_FLAGS, LOCALE_LABELS, type AppLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type LocaleToggleProps = {
  locale: AppLocale;
  onToggle: () => void;
  className?: string;
  size?: "sm" | "md";
};

export function LocaleToggle({ locale, onToggle, className, size = "md" }: LocaleToggleProps) {
  const next: AppLocale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold leading-none transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60",
        size === "sm" ? "h-8 w-8 text-lg" : "h-9 w-9 text-xl",
        className,
      )}
      aria-label={locale === "ar" ? "Switch to English" : "Switch to Arabic"}
      title={`${LOCALE_LABELS[next]} (${LOCALE_FLAGS[next]})`}
    >
      <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
    </button>
  );
}
