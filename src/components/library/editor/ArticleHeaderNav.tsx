"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ClipboardList,
  CreditCard,
  Eye,
  Glasses,
  Library,
  Menu,
  Zap,
} from "lucide-react";
import type { StudyModeFilter } from "@/components/content/ArticleStudyModes";
import { LIBRARY_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type ArticleViewMode =
  | "view"
  | "library"
  | "questions"
  | "hy"
  | "exam"
  | "flashcards";

const VIEW_MENU_ITEMS: Array<{
  id: ArticleViewMode;
  label: string;
  icon: typeof Eye;
  studyMode: StudyModeFilter | null;
  navigates?: boolean;
}> = [
  { id: "view", label: "View", icon: Eye, studyMode: null },
  { id: "library", label: "Library", icon: Library, studyMode: null, navigates: true },
  { id: "questions", label: "Questions", icon: BookOpen, studyMode: "questions" },
  { id: "hy", label: "HY", icon: Zap, studyMode: "hy" },
  { id: "exam", label: "Exam", icon: ClipboardList, studyMode: "presentation" },
  { id: "flashcards", label: "Flashcards", icon: CreditCard, studyMode: "flashcards" },
];

function viewModeFromStudyMode(studyMode: StudyModeFilter | null): ArticleViewMode {
  if (!studyMode) return "view";
  const match = VIEW_MENU_ITEMS.find((item) => item.studyMode === studyMode);
  return match?.id ?? "view";
}

export function ArticleHeaderNav({
  activeStudyMode,
  onStudyModeChange,
}: {
  activeStudyMode: StudyModeFilter | null;
  onStudyModeChange: (mode: StudyModeFilter | null) => void;
}) {
  const router = useRouter();
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
    if (item.navigates) {
      router.push(LIBRARY_PATH);
      setMenuOpen(false);
      return;
    }
    onStudyModeChange(item.studyMode);
    setMenuOpen(false);
  };

  return (
    <div ref={rootRef} className="article-header-nav">
      <button
        type="button"
        className={cn(
          "article-header-nav-btn",
          activeView === "view" && "is-active"
        )}
        aria-label="View mode"
        title="View"
        onClick={() => onStudyModeChange(null)}
      >
        <Glasses size={18} strokeWidth={2} />
      </button>

      <div className="relative">
        <button
          type="button"
          className={cn(
            "article-header-nav-btn",
            menuOpen && "is-active",
            activeView !== "view" && activeView !== "library" && "has-selection"
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
