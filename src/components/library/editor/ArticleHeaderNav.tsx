"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  CircleDot,
  ClipboardList,
  CreditCard,
  FileText,
  Menu,
  MessageCircleQuestion,
  Play,
  Zap,
} from "lucide-react";
import type { StudyModeFilter } from "@/components/content/ArticleStudyModes";
import { cn } from "@/lib/utils";

export type ArticleViewMode =
  | "read"
  | "practice"
  | "hy"
  | "exam"
  | "flashcards"
  | "round"
  | "qa";

const VIEW_MENU_ITEMS: Array<{
  id: ArticleViewMode;
  label: string;
  icon: typeof FileText;
  studyMode: StudyModeFilter | null;
}> = [
  { id: "read", label: "Read", icon: FileText, studyMode: null },
  { id: "practice", label: "Practice", icon: BookOpen, studyMode: "questions" },
  { id: "hy", label: "HY", icon: Zap, studyMode: "hy" },
  { id: "exam", label: "Exam", icon: ClipboardList, studyMode: "exam" },
  { id: "flashcards", label: "Flashcards", icon: CreditCard, studyMode: "flashcards" },
  { id: "round", label: "Round", icon: CircleDot, studyMode: "round" },
  { id: "qa", label: "QA", icon: MessageCircleQuestion, studyMode: "qa" },
];

function viewModeFromStudyMode(studyMode: StudyModeFilter | null): ArticleViewMode {
  if (!studyMode) return "read";
  const match = VIEW_MENU_ITEMS.find((item) => item.studyMode === studyMode);
  return match?.id ?? "read";
}

export function ArticleHeaderNav({
  activeStudyMode,
  onStudyModeChange,
}: {
  activeStudyMode: StudyModeFilter | null;
  onStudyModeChange: (mode: StudyModeFilter | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeView = viewModeFromStudyMode(activeStudyMode);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const selectView = (item: (typeof VIEW_MENU_ITEMS)[number]) => {
    onStudyModeChange(item.studyMode);
    setMenuOpen(false);
  };

  const isPresentationMode = activeStudyMode === "presentation";

  return (
    <div ref={rootRef} className="article-header-nav">
      <button
        type="button"
        className={cn(
          "article-header-nav-btn",
          isPresentationMode && "is-active"
        )}
        aria-label={isPresentationMode ? "Exit presentation" : "Presentation mode"}
        aria-pressed={isPresentationMode}
        title={isPresentationMode ? "Exit presentation" : "Presentation"}
        onClick={() =>
          onStudyModeChange(isPresentationMode ? null : "presentation")
        }
      >
        <Play size={18} strokeWidth={2} />
      </button>

      <div className="relative">
        <button
          type="button"
          className={cn(
            "article-header-nav-btn",
            menuOpen && "is-active",
            !isPresentationMode && activeView !== "read" && "has-selection"
          )}
          aria-label="Change view"
          aria-expanded={menuOpen}
          title="Change view"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        {menuOpen ? (
          <div className="article-header-nav-menu" role="menu">
            {VIEW_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={cn(
                    "article-header-nav-menu-item",
                    isActive && "is-active"
                  )}
                  onClick={() => selectView(item)}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                  {isActive ? (
                    <Check size={14} strokeWidth={2.5} className="ml-auto" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
