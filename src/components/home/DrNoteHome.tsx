"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  ChevronRight,
  CreditCard,
  FileQuestion,
  FileText,
  Flame,
  Flag,
  Image as ImageIcon,
  MessageSquare,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Star,
  Timer,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { EXAMS, type Exam } from "@/lib/exams";
import {
  getSessionItems,
  SETS_BY_TAB,
  TAB_ITEM_LABEL,
  type FlashcardItem,
  type NoteItem,
  type QuestionItem,
  type SessionItem,
  type StudySet,
} from "@/lib/set-content";
import type { ContentTab } from "@/lib/routes";

const C = {
  green: "#58CC02",
  greenDark: "#46A302",
  blue: "#1CB0F6",
  blueDark: "#1899D6",
  purple: "#CE82FF",
  purpleDark: "#A855F7",
  red: "#FF4B4B",
  redDark: "#EA2B2B",
  yellow: "#FFC800",
  yellowDark: "#E5B400",
  orange: "#FF9600",
  orangeDark: "#E58600",
  border: "#E5E5E5",
  text: "#4B4B4B",
  sub: "#AFAFAF",
  bg: "#FFFFFF",
  surface: "#F7F7F7",
};

const styles = `
.dn-root {
  min-height: 100vh;
  background: ${C.bg};
  color: ${C.text};
  font-family: var(--font-nunito, "Nunito"), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.dn-shell {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px 96px;
}
.dn-header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
}
.dn-brand {
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}
.dn-header-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dn-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  font-size: 13px;
  font-weight: 800;
  background: ${C.surface};
}
.dn-stat-flame { color: ${C.orange}; }
.dn-stat-star { color: ${C.yellow}; }
.dn-hero {
  border-radius: 24px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.surface};
  padding: 28px 20px;
  text-align: center;
  margin-bottom: 20px;
}
.dn-hero h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.dn-hero p {
  margin: 8px auto 0;
  max-width: 280px;
  font-size: 14px;
  font-weight: 700;
  color: ${C.sub};
}
.dn-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.bg};
}
.dn-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  color: ${C.text};
}
.dn-search input::placeholder { color: ${C.sub}; }
.dn-section-title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${C.sub};
}
.dn-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  margin-bottom: 10px;
  border-radius: 16px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.bg};
  text-align: left;
  cursor: pointer;
  transition: transform 0.1s ease;
}
.dn-card:active {
  transform: translateY(3px);
  border-bottom-width: 2px;
}
.dn-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border-bottom: 4px solid rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.dn-card-body { flex: 1; min-width: 0; }
.dn-card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dn-card-meta {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: ${C.sub};
}
.dn-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 16px;
}
.dn-tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.bg};
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
}
.dn-tab-active {
  background: ${C.blue};
  border-color: ${C.blueDark};
  color: white;
}
.dn-progress-wrap {
  border-radius: 16px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  padding: 14px;
  margin-bottom: 16px;
  background: ${C.bg};
}
.dn-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.dn-progress-bar {
  margin-top: 10px;
  height: 14px;
  border-radius: 999px;
  background: ${C.border};
  overflow: hidden;
}
.dn-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}
.dn-tile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.dn-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 108px;
  padding: 16px 10px;
  border-radius: 16px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.bg};
  cursor: pointer;
}
.dn-tile:active {
  transform: translateY(3px);
  border-bottom-width: 2px;
}
.dn-tile-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}
.dn-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 18px;
  border-radius: 16px;
  border: 2px solid transparent;
  border-bottom-width: 4px;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: white;
  cursor: pointer;
}
.dn-btn:active {
  transform: translateY(3px);
  border-bottom-width: 0;
}
.dn-btn:disabled {
  opacity: 0.45;
  pointer-events: none;
}
.dn-btn-green { background: ${C.green}; border-color: ${C.greenDark}; }
.dn-btn-blue { background: ${C.blue}; border-color: ${C.blueDark}; }
.dn-btn-purple { background: ${C.purple}; border-color: ${C.purpleDark}; }
.dn-btn-orange { background: ${C.orange}; border-color: ${C.orangeDark}; }
.dn-btn-ghost {
  background: ${C.surface};
  border-color: ${C.border};
  color: ${C.text};
}
.dn-back {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.dn-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.dn-topbar-title {
  flex: 1;
  min-width: 0;
}
.dn-topbar-title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dn-topbar-title p {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: ${C.sub};
}
.dn-quiz-q {
  border-radius: 20px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.bg};
  padding: 16px;
  margin-bottom: 12px;
}
.dn-quiz-q p {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
}
.dn-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 8px;
  border-radius: 14px;
  border: 2px solid ${C.border};
  background: ${C.bg};
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.dn-option-correct {
  border-color: ${C.green};
  background: #E5F8D0;
  color: #2B6E00;
}
.dn-option-wrong {
  border-color: ${C.red};
  background: #FFE5E5;
  color: #A80000;
}
.dn-flashcard {
  min-height: 220px;
  border-radius: 20px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.bg};
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.45;
  cursor: pointer;
  margin-bottom: 14px;
}
.dn-rating-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.dn-rating {
  padding: 10px 6px;
  border-radius: 12px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
}
.dn-note {
  border-radius: 16px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  background: ${C.bg};
  padding: 14px 16px;
  margin-bottom: 10px;
}
.dn-note h3 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 900;
}
.dn-note p {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.55;
  color: ${C.text};
}
.dn-image-card {
  border-radius: 16px;
  border: 2px solid ${C.border};
  border-bottom-width: 4px;
  overflow: hidden;
  margin-bottom: 12px;
  background: ${C.bg};
}
.dn-image-placeholder {
  height: 160px;
  background: linear-gradient(135deg, ${C.blue}22, ${C.purple}22);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dn-image-caption {
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 700;
}
.dn-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}
.dn-modal {
  width: 100%;
  max-width: 420px;
  border-radius: 24px 24px 20px 20px;
  background: ${C.bg};
  padding: 20px;
}
.dn-modal h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 900;
}
.dn-modal p {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 700;
  color: ${C.sub};
}
.dn-field {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 2px solid ${C.border};
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}
.dn-chat {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: ${C.bg};
  display: flex;
  flex-direction: column;
}
.dn-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 2px solid ${C.border};
}
.dn-chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.dn-chat-msg {
  max-width: 88%;
  padding: 12px 14px;
  border-radius: 16px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
}
.dn-chat-msg-user {
  margin-left: auto;
  background: ${C.blue};
  color: white;
}
.dn-chat-msg-bot {
  background: ${C.surface};
  border: 2px solid ${C.border};
}
.dn-chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 2px solid ${C.border};
}
.dn-chat-input input {
  flex: 1;
  border-radius: 14px;
  border: 2px solid ${C.border};
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 700;
}
.dn-toast {
  position: fixed;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  z-index: 80;
  padding: 12px 18px;
  border-radius: 999px;
  background: ${C.text};
  color: white;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}
.dn-empty {
  text-align: center;
  padding: 40px 16px;
  border-radius: 16px;
  border: 2px dashed ${C.border};
  color: ${C.sub};
  font-weight: 700;
}
.dn-slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.dn-slider-row input[type="range"] {
  flex: 1;
}
.dn-fab {
  position: fixed;
  right: 16px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  border: 2px solid ${C.purpleDark};
  border-bottom-width: 4px;
  background: ${C.purple};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
}
`;

type TabId = ContentTab;

type Screen =
  | { kind: "home" }
  | { kind: "exam"; examId: string; tab: TabId }
  | { kind: "study"; examId: string; tab: TabId; setId: string }
  | { kind: "read"; examId: string; setId: string; itemId: number }
  | { kind: "quiz"; examId: string; setId: string; mode: "practice" | "review" | "timed" }
  | { kind: "review"; examId: string; setId: string }
  | { kind: "summary"; examId: string; setId: string }
  | { kind: "flashcards"; examId: string; setId: string }
  | { kind: "custom"; examId: string; setId: string };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const TAB_META: Record<
  TabId,
  { label: string; icon: LucideIcon; color: string; edge: string }
> = {
  questions: { label: "Questions", icon: FileQuestion, color: C.blue, edge: C.blueDark },
  summary: { label: "Notes", icon: FileText, color: C.purple, edge: C.purpleDark },
  images: { label: "Images", icon: ImageIcon, color: C.orange, edge: C.orangeDark },
  flashcards: { label: "Cards", icon: CreditCard, color: C.green, edge: C.greenDark },
  library: { label: "Library", icon: BookOpen, color: C.yellow, edge: C.yellowDark },
};

const STUDY_TABS: TabId[] = ["questions", "summary", "images", "flashcards"];

function examTileColor(name: string): { bg: string; edge: string } {
  const palette = [
    { bg: C.blue, edge: C.blueDark },
    { bg: C.purple, edge: C.purpleDark },
    { bg: C.orange, edge: C.orangeDark },
    { bg: C.green, edge: C.greenDark },
    { bg: C.yellow, edge: C.yellowDark },
    { bg: C.red, edge: C.redDark },
  ];
  const idx = name.charCodeAt(0) % palette.length;
  return palette[idx] ?? palette[0]!;
}

function progressColor(pct: number): string {
  if (pct >= 85) return C.green;
  if (pct >= 60) return C.yellow;
  return C.red;
}

function getSet(tab: TabId, setId: string): StudySet | undefined {
  return (SETS_BY_TAB[tab] ?? []).find((set) => set.id === setId);
}

function FlashToast({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="dn-toast">{message}</div>;
}

function Home({
  query,
  onQueryChange,
  onSelectExam,
  onFlash,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSelectExam: (exam: Exam) => void;
  onFlash: (message: string) => void;
}) {
  const filtered = EXAMS.filter((exam) =>
    exam.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <>
      <div className="dn-hero">
        <h1>Pick your exam</h1>
        <p>Browse questions, notes, images, and flashcards — Duolingo-style.</p>
        <div className="dn-search">
          <Search size={18} strokeWidth={2.5} color={C.sub} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search exams"
            aria-label="Search exams"
          />
        </div>
      </div>

      <p className="dn-section-title">Medical exams</p>
      {filtered.map((exam) => {
        const colors = examTileColor(exam.name);
        return (
          <button
            key={exam.id}
            type="button"
            className="dn-card"
            onClick={() => {
              onSelectExam(exam);
              onFlash(`Opened ${exam.name}`);
            }}
          >
            <div
              className="dn-card-icon"
              style={{ background: colors.bg, borderColor: colors.edge }}
            >
              <span style={{ fontWeight: 900, fontSize: 18 }}>{exam.name.charAt(0)}</span>
            </div>
            <div className="dn-card-body">
              <p className="dn-card-title">{exam.name}</p>
              <p className="dn-card-meta">Tap to browse study sets</p>
            </div>
            <ChevronRight size={20} strokeWidth={3} color={C.sub} />
          </button>
        );
      })}

      {filtered.length === 0 ? (
        <div className="dn-empty">No exams match your search.</div>
      ) : null}
    </>
  );
}

function ExamPage({
  exam,
  tab,
  query,
  onQueryChange,
  onTabChange,
  onOpenSet,
  onAddFile,
  onBack,
}: {
  exam: Exam;
  tab: TabId;
  query: string;
  onQueryChange: (value: string) => void;
  onTabChange: (tab: TabId) => void;
  onOpenSet: (set: StudySet) => void;
  onAddFile: () => void;
  onBack: () => void;
}) {
  const sets = SETS_BY_TAB[tab] ?? [];
  const filtered = sets.filter((set) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      set.title.toLowerCase().includes(q) ||
      set.subject.toLowerCase().includes(q) ||
      set.tag.toLowerCase().includes(q)
    );
  });

  const doneTotal = sets.reduce((sum, set) => sum + set.done, 0);
  const itemTotal = sets.reduce((sum, set) => sum + set.total, 0);
  const pct = itemTotal > 0 ? Math.round((doneTotal / itemTotal) * 100) : 0;

  return (
    <>
      <div className="dn-topbar">
        <button type="button" className="dn-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="dn-topbar-title">
          <h2>{exam.name}</h2>
          <p>{TAB_META[tab].label} browser</p>
        </div>
        <button type="button" className="dn-back" onClick={onAddFile} aria-label="Add file">
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="dn-progress-wrap">
        <div className="dn-progress-label">
          <span style={{ color: C.sub }}>{TAB_ITEM_LABEL[tab] ?? "items"}</span>
          <span>
            <span style={{ color: progressColor(pct) }}>{pct}%</span>
            <span style={{ color: C.sub }}> complete</span>
          </span>
        </div>
        <div className="dn-progress-bar">
          <div
            className="dn-progress-fill"
            style={{ width: `${pct}%`, background: progressColor(pct) }}
          />
        </div>
      </div>

      <div className="dn-search" style={{ marginBottom: 16 }}>
        <Search size={18} strokeWidth={2.5} color={C.sub} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={`Search ${TAB_META[tab].label.toLowerCase()} sets`}
          aria-label="Search sets"
        />
      </div>

      <div className="dn-tabs">
        {STUDY_TABS.map((tabId) => {
          const meta = TAB_META[tabId];
          const Icon = meta.icon;
          const active = tabId === tab;
          return (
            <button
              key={tabId}
              type="button"
              className={`dn-tab${active ? " dn-tab-active" : ""}`}
              onClick={() => onTabChange(tabId)}
            >
              <Icon size={14} strokeWidth={2.5} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <p className="dn-section-title">{filtered.length} sets</p>
      {filtered.map((set) => {
        const mastery = set.score ?? 0;
        const meta = TAB_META[tab];
        const Icon = meta.icon;
        return (
          <button
            key={set.id}
            type="button"
            className="dn-card"
            onClick={() => onOpenSet(set)}
          >
            <div
              className="dn-card-icon"
              style={{ background: meta.color, borderColor: meta.edge }}
            >
              <Icon size={22} strokeWidth={2.5} />
            </div>
            <div className="dn-card-body">
              <p className="dn-card-title">{set.title}</p>
              <p className="dn-card-meta">
                {set.subject} · {set.total} {TAB_ITEM_LABEL[tab] ?? "items"} · {set.tag}
              </p>
            </div>
            <span style={{ fontWeight: 900, color: mastery > 0 ? C.text : C.sub }}>
              {mastery}%
            </span>
          </button>
        );
      })}

      {filtered.length === 0 ? (
        <div className="dn-empty">No sets match your search.</div>
      ) : null}
    </>
  );
}

function Study({
  exam,
  set,
  onBack,
  onQuiz,
  onReview,
  onRead,
  onSummary,
  onFlashcards,
  onCustom,
  onChat,
}: {
  exam: Exam;
  set: StudySet;
  onBack: () => void;
  onQuiz: () => void;
  onReview: () => void;
  onRead: () => void;
  onSummary: () => void;
  onFlashcards: () => void;
  onCustom: () => void;
  onChat: () => void;
}) {
  const pct = set.total > 0 ? Math.round((set.done / set.total) * 100) : 0;

  return (
    <>
      <div className="dn-topbar">
        <button type="button" className="dn-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="dn-topbar-title">
          <h2>{set.title}</h2>
          <p>
            {exam.name} · {set.subject}
          </p>
        </div>
        <button type="button" className="dn-back" onClick={onChat} aria-label="Open chat">
          <MessageSquare size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="dn-progress-wrap">
        <div className="dn-progress-label">
          <span style={{ color: C.sub }}>Progress</span>
          <span style={{ color: progressColor(pct) }}>
            {set.done}/{set.total}
          </span>
        </div>
        <div className="dn-progress-bar">
          <div
            className="dn-progress-fill"
            style={{ width: `${pct}%`, background: progressColor(pct) }}
          />
        </div>
      </div>

      <p className="dn-section-title">Study modes</p>
      <div className="dn-tile-grid">
        <button type="button" className="dn-tile" onClick={onQuiz}>
          <Play size={28} strokeWidth={2.5} color={C.blue} />
          <span className="dn-tile-label">Quiz</span>
        </button>
        <button type="button" className="dn-tile" onClick={onReview}>
          <RotateCcw size={28} strokeWidth={2.5} color={C.red} />
          <span className="dn-tile-label">Review</span>
        </button>
        <button type="button" className="dn-tile" onClick={onRead}>
          <BookOpen size={28} strokeWidth={2.5} color={C.orange} />
          <span className="dn-tile-label">Read</span>
        </button>
        <button type="button" className="dn-tile" onClick={onSummary}>
          <FileText size={28} strokeWidth={2.5} color={C.purple} />
          <span className="dn-tile-label">Summary</span>
        </button>
        <button type="button" className="dn-tile" onClick={onFlashcards}>
          <CreditCard size={28} strokeWidth={2.5} color={C.green} />
          <span className="dn-tile-label">Flashcards</span>
        </button>
        <button type="button" className="dn-tile" onClick={onCustom}>
          <SlidersHorizontal size={28} strokeWidth={2.5} color={C.yellow} />
          <span className="dn-tile-label">Custom</span>
        </button>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        <button type="button" className="dn-btn dn-btn-blue" onClick={onQuiz}>
          <Zap size={18} strokeWidth={2.5} />
          Quick quiz
        </button>
        <button type="button" className="dn-btn dn-btn-ghost" onClick={onChat}>
          <Sparkles size={18} strokeWidth={2.5} />
          Ask AI tutor
        </button>
      </div>
    </>
  );
}

function AddFile({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}) {
  const [title, setTitle] = useState("");

  if (!open) return null;

  return (
    <div className="dn-overlay" onClick={onClose}>
      <div className="dn-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add study file</h3>
        <p>Upload a PDF or paste a note title to add it to your exam library.</p>
        <input
          className="dn-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Cardiology review PDF"
        />
        <button
          type="button"
          className="dn-btn dn-btn-green"
          onClick={() => {
            if (title.trim()) {
              onSubmit(title.trim());
              setTitle("");
              onClose();
            }
          }}
        >
          <Upload size={18} strokeWidth={2.5} />
          Add file
        </button>
      </div>
    </div>
  );
}

function Read({
  note,
  onBack,
}: {
  note: NoteItem;
  onBack: () => void;
}) {
  return (
    <>
      <div className="dn-topbar">
        <button type="button" className="dn-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="dn-topbar-title">
          <h2>Read</h2>
          <p>{note.specialty}</p>
        </div>
      </div>
      <div className="dn-note">
        <h3>{note.author}</h3>
        <p>{note.text}</p>
      </div>
    </>
  );
}

function Quiz({
  questions,
  mode,
  onBack,
  onDone,
  onChat,
}: {
  questions: QuestionItem[];
  mode: "practice" | "review" | "timed";
  onBack: () => void;
  onDone: () => void;
  onChat: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(mode === "timed" ? 300 : 0);

  useEffect(() => {
    if (mode !== "timed") return undefined;
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode]);

  const q = questions[index];
  if (!q) {
    return (
      <div className="dn-empty">
        No questions in this set.
        <div style={{ marginTop: 16 }}>
          <button type="button" className="dn-btn dn-btn-ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const answered = selected !== null;
  const isLast = index >= questions.length - 1;

  return (
    <>
      <div className="dn-topbar">
        <button type="button" className="dn-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="dn-topbar-title">
          <h2>{mode === "timed" ? "Timed quiz" : mode === "review" ? "Review quiz" : "Quiz"}</h2>
          <p>
            Question {index + 1} of {questions.length}
            {mode === "timed" ? ` · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : ""}
          </p>
        </div>
        <button type="button" className="dn-back" onClick={onChat} aria-label="Chat">
          <Bot size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="dn-quiz-q">
        <p>{q.text}</p>
        {q.options.map((opt, i) => {
          const isCorrect = answered && i === q.answer;
          const isWrong = answered && selected === i && i !== q.answer;
          return (
            <button
              key={opt}
              type="button"
              className={`dn-option${isCorrect ? " dn-option-correct" : ""}${isWrong ? " dn-option-wrong" : ""}`}
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
            >
              <span style={{ fontWeight: 900 }}>{["A", "B", "C", "D"][i]}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div className="dn-note">
            <h3>Explanation</h3>
            <p>{q.explanation}</p>
          </div>
          <button
            type="button"
            className="dn-btn dn-btn-green"
            onClick={() => {
              if (isLast) {
                onDone();
                return;
              }
              setIndex((i) => i + 1);
              setSelected(null);
            }}
          >
            {isLast ? "Finish" : "Next question"}
          </button>
        </div>
      ) : null}
    </>
  );
}

function Review({
  items,
  onBack,
  onStart,
}: {
  items: SessionItem[];
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <>
      <div className="dn-topbar">
        <button type="button" className="dn-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="dn-topbar-title">
          <h2>Review</h2>
          <p>{items.length} items flagged or missed</p>
        </div>
      </div>

      <div className="dn-note">
        <h3>Spaced review queue</h3>
        <p>
          Focus on incorrect and flagged items. Review mode pulls from your weakest cards
          first.
        </p>
      </div>

      <button type="button" className="dn-btn dn-btn-orange" onClick={onStart}>
        <Flag size={18} strokeWidth={2.5} />
        Start review session
      </button>
    </>
  );
}

function Summary({
  notes,
  onBack,
  onOpenNote,
}: {
  notes: NoteItem[];
  onBack: () => void;
  onOpenNote: (note: NoteItem) => void;
}) {
  return (
    <>
      <div className="dn-topbar">
        <button type="button" className="dn-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="dn-topbar-title">
          <h2>Summary</h2>
          <p>{notes.length} notes</p>
        </div>
      </div>

      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          className="dn-note"
          style={{ width: "100%", cursor: "pointer", textAlign: "left" }}
          onClick={() => onOpenNote(note)}
        >
          <h3>{note.author}</h3>
          <p>{note.text.slice(0, 160)}{note.text.length > 160 ? "…" : ""}</p>
        </button>
      ))}

      {notes.length === 0 ? <div className="dn-empty">No summary notes yet.</div> : null}
    </>
  );
}

function Flashcards({
  cards,
  onBack,
  onFlash,
}: {
  cards: FlashcardItem[];
  onBack: () => void;
  onFlash: (message: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];
  if (!card) {
    return (
      <div className="dn-empty">
        No flashcards in this set.
        <div style={{ marginTop: 16 }}>
          <button type="button" className="dn-btn dn-btn-ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const rate = (label: string) => {
    onFlash(`Rated ${label}`);
    setFlipped(false);
    setIndex((i) => (i + 1 < cards.length ? i + 1 : 0));
  };

  return (
    <>
      <div className="dn-topbar">
        <button type="button" className="dn-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="dn-topbar-title">
          <h2>Flashcards</h2>
          <p>
            Card {index + 1} of {cards.length}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="dn-flashcard"
        onClick={() => setFlipped((f) => !f)}
      >
        {flipped ? card.back : card.front}
      </button>

      {flipped ? (
        <div className="dn-rating-row">
          {(["Again", "Hard", "Good", "Easy"] as const).map((label, i) => (
            <button
              key={label}
              type="button"
              className="dn-rating"
              style={{
                color: [C.red, C.orange, C.green, C.blue][i],
              }}
              onClick={() => rate(label)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: C.sub, fontWeight: 700, fontSize: 13 }}>
          Tap card to flip
        </p>
      )}
    </>
  );
}

function Custom({
  maxCount,
  onBack,
  onStart,
}: {
  maxCount: number;
  onBack: () => void;
  onStart: (count: number, minutes: number) => void;
}) {
  const [count, setCount] = useState(Math.min(10, maxCount));
  const [minutes, setMinutes] = useState(5);

  return (
    <>
      <div className="dn-topbar">
        <button type="button" className="dn-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="dn-topbar-title">
          <h2>Custom session</h2>
          <p>Build your own quiz</p>
        </div>
      </div>

      <div className="dn-note">
        <h3>Question count</h3>
        <div className="dn-slider-row">
          <span style={{ fontWeight: 800, color: C.sub }}>1</span>
          <input
            type="range"
            min={1}
            max={Math.max(1, maxCount)}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <span style={{ fontWeight: 800, color: C.sub }}>{maxCount}</span>
        </div>
        <p style={{ textAlign: "center", fontWeight: 900, fontSize: 24 }}>{count}</p>
      </div>

      <div className="dn-note">
        <h3>Timer (minutes)</h3>
        <div className="dn-slider-row">
          <Timer size={18} strokeWidth={2.5} color={C.sub} />
          <input
            type="range"
            min={1}
            max={60}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
          <span style={{ fontWeight: 900 }}>{minutes}m</span>
        </div>
      </div>

      <button
        type="button"
        className="dn-btn dn-btn-purple"
        onClick={() => onStart(count, minutes)}
      >
        <Play size={18} strokeWidth={2.5} />
        Start custom quiz
      </button>
    </>
  );
}

function ChatPanel({
  open,
  context,
  messages,
  onClose,
  onSend,
}: {
  open: boolean;
  context: string;
  messages: ChatMessage[];
  onClose: () => void;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  if (!open) return null;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="dn-chat">
      <div className="dn-chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DrNoteLogo size="sm" />
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 14 }}>AI tutor</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 11, color: C.sub }}>
              {context.slice(0, 48)}{context.length > 48 ? "…" : ""}
            </p>
          </div>
        </div>
        <button type="button" className="dn-back" onClick={onClose} aria-label="Close chat">
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="dn-chat-body">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`dn-chat-msg ${msg.role === "user" ? "dn-chat-msg-user" : "dn-chat-msg-bot"}`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="dn-chat-input">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about this topic…"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button type="button" className="dn-btn dn-btn-blue" style={{ width: "auto" }} onClick={send}>
          <Send size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export function DrNoteHome() {
  const [screen, setScreen] = useState<Screen>({ kind: "home" });
  const [homeQuery, setHomeQuery] = useState("");
  const [examQuery, setExamQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I can help you break down questions, mnemonics, and high-yield facts.",
    },
  ]);

  const flashTimerRef = useRef<number | null>(null);

  const showFlash = useCallback((message: string) => {
    setFlash(message);
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      setFlash(null);
      flashTimerRef.current = null;
    }, 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const currentExam = useMemo(() => {
    if (screen.kind === "home") return null;
    return EXAMS.find((e) => e.id === screen.examId) ?? null;
  }, [screen]);

  const currentSet = useMemo(() => {
    if (
      screen.kind === "study" ||
      screen.kind === "read" ||
      screen.kind === "quiz" ||
      screen.kind === "review" ||
      screen.kind === "summary" ||
      screen.kind === "flashcards" ||
      screen.kind === "custom"
    ) {
      const tab: TabId =
        screen.kind === "read" || screen.kind === "summary"
          ? "summary"
          : screen.kind === "flashcards"
            ? "flashcards"
            : "questions";
      return getSet(tab, screen.setId);
    }
    if (screen.kind === "exam") return null;
    return null;
  }, [screen]);

  const chatContext = useMemo(() => {
    if (currentSet) return currentSet.title;
    if (currentExam) return currentExam.name;
    return "DrNote";
  }, [currentSet, currentExam]);

  const goHome = () => {
    setScreen({ kind: "home" });
    setChatOpen(false);
  };

  const sendChat = (text: string) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const botMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      content: `Here's a quick take on "${text}" for ${chatContext}: focus on mechanism first, then eliminate distractors by severity and timing.`,
    };
    setChatMessages((prev) => [...prev, userMsg, botMsg]);
  };

  let body: ReactNode;

  if (screen.kind === "home") {
    body = (
      <Home
        query={homeQuery}
        onQueryChange={setHomeQuery}
        onSelectExam={(exam) => {
          setScreen({ kind: "exam", examId: exam.id, tab: "questions" });
          setExamQuery("");
        }}
        onFlash={showFlash}
      />
    );
  } else if (screen.kind === "exam" && currentExam) {
    body = (
      <ExamPage
        exam={currentExam}
        tab={screen.tab}
        query={examQuery}
        onQueryChange={setExamQuery}
        onTabChange={(tab) => setScreen({ ...screen, tab })}
        onOpenSet={(set) =>
          setScreen({
            kind: "study",
            examId: screen.examId,
            tab: screen.tab,
            setId: set.id,
          })
        }
        onAddFile={() => setAddFileOpen(true)}
        onBack={goHome}
      />
    );
  } else if (screen.kind === "study" && currentExam && currentSet) {
    body = (
      <Study
        exam={currentExam}
        set={currentSet}
        onBack={() =>
          setScreen({ kind: "exam", examId: screen.examId, tab: screen.tab })
        }
        onQuiz={() =>
          setScreen({
            kind: "quiz",
            examId: screen.examId,
            setId: screen.setId,
            mode: "practice",
          })
        }
        onReview={() =>
          setScreen({
            kind: "review",
            examId: screen.examId,
            setId: screen.setId,
          })
        }
        onRead={() => {
          const notes = getSessionItems("summary", screen.setId) as NoteItem[];
          const first = notes[0];
          if (first) {
            setScreen({
              kind: "read",
              examId: screen.examId,
              setId: screen.setId,
              itemId: first.id,
            });
          } else {
            showFlash("No readable notes in this set");
          }
        }}
        onSummary={() =>
          setScreen({
            kind: "summary",
            examId: screen.examId,
            setId: screen.setId,
          })
        }
        onFlashcards={() =>
          setScreen({
            kind: "flashcards",
            examId: screen.examId,
            setId: screen.setId,
          })
        }
        onCustom={() =>
          setScreen({
            kind: "custom",
            examId: screen.examId,
            setId: screen.setId,
          })
        }
        onChat={() => setChatOpen(true)}
      />
    );
  } else if (screen.kind === "read") {
    const notes = getSessionItems("summary", screen.setId) as NoteItem[];
    const note = notes.find((n) => n.id === screen.itemId) ?? notes[0];
    body = note ? (
      <Read
        note={note}
        onBack={() =>
          setScreen({
            kind: "study",
            examId: screen.examId,
            tab: "summary",
            setId: screen.setId,
          })
        }
      />
    ) : (
      <div className="dn-empty">Note not found.</div>
    );
  } else if (screen.kind === "quiz") {
    const questions = getSessionItems("questions", screen.setId) as QuestionItem[];
    body = (
      <Quiz
        questions={questions}
        mode={screen.mode}
        onBack={() =>
          setScreen({
            kind: "study",
            examId: screen.examId,
            tab: "questions",
            setId: screen.setId,
          })
        }
        onDone={() => {
          showFlash("Quiz complete — nice work!");
          setScreen({
            kind: "study",
            examId: screen.examId,
            tab: "questions",
            setId: screen.setId,
          });
        }}
        onChat={() => setChatOpen(true)}
      />
    );
  } else if (screen.kind === "review") {
    const items = getSessionItems("questions", screen.setId);
    body = (
      <Review
        items={items}
        onBack={() =>
          setScreen({
            kind: "study",
            examId: screen.examId,
            tab: "questions",
            setId: screen.setId,
          })
        }
        onStart={() =>
          setScreen({
            kind: "quiz",
            examId: screen.examId,
            setId: screen.setId,
            mode: "review",
          })
        }
      />
    );
  } else if (screen.kind === "summary") {
    const notes = getSessionItems("summary", screen.setId) as NoteItem[];
    body = (
      <Summary
        notes={notes}
        onBack={() =>
          setScreen({
            kind: "study",
            examId: screen.examId,
            tab: "summary",
            setId: screen.setId,
          })
        }
        onOpenNote={(note) =>
          setScreen({
            kind: "read",
            examId: screen.examId,
            setId: screen.setId,
            itemId: note.id,
          })
        }
      />
    );
  } else if (screen.kind === "flashcards") {
    const cards = getSessionItems("flashcards", screen.setId) as FlashcardItem[];
    body = (
      <Flashcards
        cards={cards}
        onBack={() =>
          setScreen({
            kind: "study",
            examId: screen.examId,
            tab: "flashcards",
            setId: screen.setId,
          })
        }
        onFlash={showFlash}
      />
    );
  } else if (screen.kind === "custom") {
    const questions = getSessionItems("questions", screen.setId) as QuestionItem[];
    body = (
      <Custom
        maxCount={questions.length}
        onBack={() =>
          setScreen({
            kind: "study",
            examId: screen.examId,
            tab: "questions",
            setId: screen.setId,
          })
        }
        onStart={() => {
          showFlash("Starting custom session");
          setScreen({
            kind: "quiz",
            examId: screen.examId,
            setId: screen.setId,
            mode: "timed",
          });
        }}
      />
    );
  } else {
    body = <div className="dn-empty">Something went wrong.</div>;
  }

  return (
    <div className="dn-root">
      <style>{styles}</style>
      <div className="dn-shell">
        <header className="dn-header">
          <button type="button" className="dn-brand" onClick={goHome}>
            <DrNoteLogo showWordmark forceWordmark />
          </button>
          <div className="dn-header-stats">
            <div className="dn-stat dn-stat-flame">
              <Flame size={16} strokeWidth={2.5} />
              14
            </div>
            <div className="dn-stat dn-stat-star">
              <Star size={16} strokeWidth={2.5} />
              Gold
            </div>
          </div>
        </header>

        {body}

        {screen.kind !== "home" && !chatOpen ? (
          <button
            type="button"
            className="dn-fab"
            aria-label="Open chat"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare size={22} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      <FlashToast message={flash} />

      <AddFile
        open={addFileOpen}
        onClose={() => setAddFileOpen(false)}
        onSubmit={(title) => showFlash(`Added "${title}"`)}
      />

      <ChatPanel
        open={chatOpen}
        context={chatContext}
        messages={chatMessages}
        onClose={() => setChatOpen(false)}
        onSend={sendChat}
      />
    </div>
  );
}
