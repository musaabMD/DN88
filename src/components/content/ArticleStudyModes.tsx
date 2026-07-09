"use client";

import { useState } from "react";
import {
  BookOpen,
  CreditCard,
  FileText,
  Filter,
  Monitor,
  Stethoscope,
  Timer,
  X,
  Zap,
} from "lucide-react";

export type StudyModeFilter =
  | "summary"
  | "flashcards"
  | "questions"
  | "presentation"
  | "lastmin"
  | "er"
  | "hy";

/** Modes that switch the article view (mutually exclusive). */
export const PRIMARY_VIEW_MODES: StudyModeFilter[] = [
  "summary",
  "flashcards",
  "questions",
  "presentation",
];

/** Modes that filter which sections appear in article view. */
export const SECTION_FILTER_MODES: StudyModeFilter[] = ["lastmin", "er", "hy"];

const STUDY_MODES: Array<{
  id: StudyModeFilter;
  shortLabel: string;
  icon: typeof FileText;
}> = [
  { id: "summary", shortLabel: "Summary", icon: FileText },
  { id: "flashcards", shortLabel: "Cards", icon: CreditCard },
  { id: "questions", shortLabel: "Questions", icon: BookOpen },
  { id: "presentation", shortLabel: "Present", icon: Monitor },
  { id: "lastmin", shortLabel: "Last Min", icon: Timer },
  { id: "er", shortLabel: "ER", icon: Stethoscope },
  { id: "hy", shortLabel: "HY", icon: Zap },
];

export function ArticleStudyModes({
  activeModes,
  onToggleMode,
}: {
  activeModes: Set<StudyModeFilter>;
  onToggleMode: (mode: StudyModeFilter) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border-2 border-b-4 shadow-lg transition-colors active:translate-y-0.5 active:border-b-2 ${
          open || activeModes.size > 0
            ? "border-slate-700 bg-slate-700 text-white"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
        aria-label="Study mode filters"
        aria-expanded={open}
      >
        <Filter size={20} strokeWidth={2.5} />
      </button>

      {open ? (
        <div className="fixed bottom-20 right-6 z-40 w-64 rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Study modes
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STUDY_MODES.map((mode) => {
              const Icon = mode.icon;
              const active = activeModes.has(mode.id);
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onToggleMode(mode.id);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-center transition-colors ${
                    active
                      ? "border-slate-700 bg-slate-700 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  <span className="text-[10px] font-extrabold leading-tight">
                    {mode.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function getPrimaryViewMode(
  activeModes: Set<StudyModeFilter>
): StudyModeFilter | null {
  for (const mode of PRIMARY_VIEW_MODES) {
    if (activeModes.has(mode)) return mode;
  }
  return null;
}

export function shouldShowSection(
  sectionId: string,
  activeModes: Set<StudyModeFilter>
): boolean {
  const primary = getPrimaryViewMode(activeModes);
  if (primary && primary !== "presentation") return false;

  const sectionFilters = SECTION_FILTER_MODES.filter((m) => activeModes.has(m));
  if (sectionFilters.length === 0) return true;

  const onlyHy = activeModes.has("hy") && sectionFilters.length === 1;
  const onlyEr = activeModes.has("er") && sectionFilters.length === 1;
  const onlyLastMin = activeModes.has("lastmin") && sectionFilters.length === 1;

  if (onlyHy) {
    return (
      sectionId === "overview" ||
      sectionId === "diagnosis" ||
      sectionId === "treatment" ||
      sectionId === "clinical-features"
    );
  }
  if (onlyEr) {
    return (
      sectionId.includes("clinical") ||
      sectionId.includes("diagnosis") ||
      sectionId.includes("treatment")
    );
  }
  if (onlyLastMin) {
    return sectionId === "overview" || sectionId === "treatment";
  }
  return true;
}
