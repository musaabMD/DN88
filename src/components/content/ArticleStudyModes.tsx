"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { examTabPath, type ContentTab } from "@/lib/routes";

export type StudyModeFilter =
  | "summary"
  | "flashcards"
  | "quiz"
  | "presentation"
  | "lastmin"
  | "er"
  | "hy";

const STUDY_MODES: Array<{
  id: StudyModeFilter;
  shortLabel: string;
  icon: typeof FileText;
  tab?: ContentTab;
}> = [
  { id: "summary", shortLabel: "Summary", icon: FileText, tab: "summary" },
  { id: "flashcards", shortLabel: "Cards", icon: CreditCard, tab: "flashcards" },
  { id: "quiz", shortLabel: "Quiz", icon: BookOpen, tab: "questions" },
  { id: "presentation", shortLabel: "Present", icon: Monitor },
  { id: "lastmin", shortLabel: "Last Min", icon: Timer },
  { id: "er", shortLabel: "ER", icon: Stethoscope },
  { id: "hy", shortLabel: "HY", icon: Zap },
];

export function ArticleStudyModes({
  examId,
  activeModes,
  onToggleMode,
}: {
  examId: string;
  activeModes: Set<StudyModeFilter>;
  onToggleMode: (mode: StudyModeFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleModeClick = (mode: (typeof STUDY_MODES)[number]) => {
    if (mode.tab) {
      router.push(examTabPath(examId, mode.tab));
      setOpen(false);
      return;
    }
    onToggleMode(mode.id);
  };

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
                  onClick={() => handleModeClick(mode)}
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

export function shouldShowSection(
  sectionId: string,
  activeModes: Set<StudyModeFilter>
): boolean {
  if (activeModes.size === 0) return true;

  const onlyHy = activeModes.has("hy") && activeModes.size === 1;
  const onlyEr = activeModes.has("er") && activeModes.size === 1;
  const onlyLastMin = activeModes.has("lastmin") && activeModes.size === 1;

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
