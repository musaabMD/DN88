"use client";

import Link from "next/link";
import { SignedIn } from "@clerk/clerk-react";
import { useMemo, useState, useEffect, useRef, useCallback, type CSSProperties, type ElementType, type ReactNode, type Dispatch, type SetStateAction } from "react";
import {
  Search, ChevronUp, ChevronRight, ChevronLeft, Bookmark,
  Share2, Link2, Play, Check, Flame, X, ArrowLeft, BookOpen, Brain, FileText,
  Layers, SlidersHorizontal, Clock, Users, Star, Sparkles, Flag, Settings, Plus,
  ListChecks, Send, Upload, Command, Maximize2, Minimize2, StickyNote, LayoutList, Columns2, Image as ImageIcon, BarChart2, RotateCcw,
} from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { DocumentPdfViewer } from "@/components/medgenius/DocumentPdfViewer";
import { UserAuthControls } from "@/components/UserAuthControls";
import { askMedGeniusAi } from "@/lib/medgenius/chat";
import { uploadDocument, MedGeniusApiError, extractDocumentQuestions, reprocessDocument as reprocessDocumentApi } from "@/lib/medgenius/api";
import { sanitizeUserError } from "@/lib/medgenius/errors";
import {
  useExamDocuments,
  useDocumentStudy,
  type HomeFlashCard,
  type HomeQuestion,
  type HomeReadPage,
  type HomeSummary,
} from "@/lib/medgenius/home-data";
import { isCorruptParsedMarkdown } from "@/lib/medgenius/markdown-quality";
import { createStudySession, recordAttempt, searchQuestions, fetchDueSrs, recordSrsReview, bookmarkQuestion } from "@/lib/medgenius/api";
import { useHomeAnalytics } from "@/hooks/useHomeAnalytics";
import { useStudyStreak } from "@/hooks/useStudyStreak";
import { CollectionsPanel } from "@/components/CollectionsPanel";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { HomeLocaleProvider, useHomeLocale } from "@/components/home/HomeLocaleProvider";
import { MedGeniusCreditsProvider } from "@/lib/medgenius/credits-context";
import { CreditsBadge } from "@/components/medgenius/CreditsUsage";
import { useMedGeniusCreditsContext } from "@/lib/medgenius/credits-context";
import type { AppLocale } from "@/lib/locale";
import { saveCurrentExamId } from "@/lib/current-exam";
import { examPath, PRICING_PATH } from "@/lib/routes";

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */
const C = {
  green: "#58CC02", greenDark: "#46A302",
  blue: "#1CB0F6", blueDark: "#1899D6",
  purple: "#CE82FF", purpleDark: "#A855D6",
  yellow: "#FFC800", yellowDark: "#E0A800",
  red: "#FF4B4B", teal: "#14B8A6",
  ink: "#3C3C3C", sub: "#777777", faint: "#AFAFAF",
  line: "#E5E5E5", bg: "#FFFFFF", wash: "#F7F7F7",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
type Filter = "today" | "week" | "month" | "all" | "bookmarked";
type Tab = "Read" | "Quiz" | "Review" | "Summary" | "Flashcards" | "Custom";
type Reveal = "immediate" | "later";
type Msg = { role: "ai" | "user"; text: string };

interface Exam {
  id: string;
  code: string;
  name: string;
  from: string;
  to: string;
  tags: string[];
}
interface ExamFile {
  id: string;
  name: string;
  author: string;
  pages: number;
  color: string;
  votes: Record<Exclude<Filter, "bookmarked">, number>;
  documentId?: string;
  originalFilename?: string;
  mimeType?: string;
  status?: string;
  progress?: number;
  isLive?: boolean;
}

const EXAMS: Exam[] = [
  { id: "smle", code: "SMLE", name: "Saudi Medical Licensing", from: "#FF6B6B", to: "#E11D48", tags: ["medical", "smle", "doctor"] },
  { id: "sdle", code: "SDLE", name: "Saudi Dental Licensing", from: "#34D399", to: "#059669", tags: ["dental", "sdle", "dentist"] },
  { id: "sple", code: "SPLE", name: "Saudi Pharmacy Licensing", from: "#A78BFA", to: "#7C3AED", tags: ["pharmacy", "sple", "pharmacist"] },
  { id: "slle", code: "SLLE", name: "Saudi Lab Licensing", from: "#38BDF8", to: "#2563EB", tags: ["lab", "slle", "laboratory"] },
  { id: "snle", code: "SNLE", name: "Saudi Nursing Licensing", from: "#FBBF24", to: "#F97316", tags: ["nursing", "snle", "nurse"] },
  { id: "fm", code: "FM", name: "Family Medicine", from: "#2DD4BF", to: "#0F766E", tags: ["family", "medicine", "board"] },
];

const FILES: ExamFile[] = [
  { id: "f1", name: "March Combined", author: "dr_mina", pages: 148, color: C.green, votes: { today: 128, week: 512, month: 1840, all: 6120 } },
  { id: "f2", name: "UWorld IM — Rapid Notes", author: "shelf_slayer", pages: 96, color: C.blue, votes: { today: 96, week: 604, month: 2210, all: 8890 } },
  { id: "f3", name: "Divine Intervention Notes", author: "step2_kween", pages: 72, color: C.purple, votes: { today: 84, week: 431, month: 1975, all: 7402 } },
  { id: "f4", name: "AMBOSS High-Yield Tables", author: "night_float", pages: 54, color: C.yellow, votes: { today: 71, week: 389, month: 1602, all: 5540 } },
  { id: "f5", name: "Emma Holliday IM Review", author: "call_room", pages: 38, color: C.red, votes: { today: 63, week: 502, month: 1710, all: 9120 } },
  { id: "f6", name: "Ethics & Biostats One Pager", author: "p_value", pages: 12, color: C.teal, votes: { today: 58, week: 244, month: 980, all: 3310 } },
  { id: "f7", name: "Surgery Shelf Buzzwords", author: "scrub_tech", pages: 44, color: C.blue, votes: { today: 41, week: 356, month: 1288, all: 4870 } },
  { id: "f8", name: "OME Rapid Review OB/GYN", author: "match_2027", pages: 61, color: C.purple, votes: { today: 33, week: 198, month: 1104, all: 4020 } },
];

const FILTER_KEYS: Filter[] = ["week", "month", "all", "bookmarked"];

const TABS: { key: Tab; icon: ElementType }[] = [
  { key: "Read", icon: BookOpen }, { key: "Quiz", icon: Brain }, { key: "Review", icon: ListChecks },
  { key: "Summary", icon: FileText }, { key: "Flashcards", icon: Layers }, { key: "Custom", icon: SlidersHorizontal },
];

type SessionSource = "quiz" | "custom";
type SessionStatus = "in_progress" | "completed";

interface QuizSession {
  id: string;
  source: SessionSource;
  title: string;
  startedAt: number;
  endedAt: number | null;
  durationSec: number | null;
  answers: Record<number, number>;
  flagged: number[];
  totalQuestions: number;
  status: SessionStatus;
}

function seedSessions(fileId: string, totalQuestions: number): QuizSession[] {
  const now = Date.now();
  return [
    {
      id: `${fileId}-demo-1`,
      source: "quiz",
      title: "Quiz practice",
      startedAt: now - 86400000 * 2,
      endedAt: now - 86400000 * 2 + 18 * 60 * 1000,
      durationSec: 18 * 60,
      answers: { 0: 0, 1: 2, 2: 1, 3: 2, 4: 3, 5: 0, 6: 0, 7: 1, 8: 1, 9: 0, 10: 1, 11: 1 },
      flagged: [5],
      totalQuestions,
      status: "completed",
    },
    {
      id: `${fileId}-demo-2`,
      source: "custom",
      title: "Custom · 20 questions",
      startedAt: now - 5 * 3600000,
      endedAt: now - 5 * 3600000 + 12 * 60 * 1000,
      durationSec: 12 * 60,
      answers: { 0: 0, 2: 1, 4: 3, 6: 0, 8: 1, 10: 0, 11: 2 },
      flagged: [],
      totalQuestions: 20,
      status: "completed",
    },
  ];
}

function loadSessions(fileId: string, totalQuestions: number): QuizSession[] {
  if (typeof window === "undefined") return seedSessions(fileId, totalQuestions);
  try {
    const raw = localStorage.getItem(`dn-sessions-${fileId}`);
    if (raw) return JSON.parse(raw) as QuizSession[];
  } catch { /* ignore */ }
  return seedSessions(fileId, totalQuestions);
}

function scoreSession(s: QuizSession, questions: HomeQuestion[]) {
  const entries = Object.entries(s.answers);
  let correct = 0;
  for (const [idx, ans] of entries) {
    if (questions[Number(idx)]?.correct === ans) correct++;
  }
  return { correct, answered: entries.length, total: s.totalQuestions };
}

function formatDuration(sec: number | null, inProgress: string, fmt: (min: number, s: number) => string) {
  if (sec === null) return inProgress;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return fmt(m, s);
}

function formatSessionWhen(ts: number, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(ts));
}

function displaySessionTitle(title: string, content: import("@/lib/i18n/home-content").HomeContent) {
  if (title === "Quiz practice") return content.sessionQuizTitle;
  const match = /^Custom · (\d+) questions$/.exec(title);
  if (match) return content.sessionCustomTitle(Number(match[1]));
  return title;
}

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
function Chunky({ children, bg, shadow, fg = "#fff", onClick, full, disabled, sm }: {
  children: ReactNode; bg: string; shadow: string; fg?: string; onClick?: () => void; full?: boolean; disabled?: boolean; sm?: boolean;
}) {
  const [down, setDown] = useState(false);
  const lift = sm ? 2 : 4;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => setDown(true)} onMouseUp={() => setDown(false)} onMouseLeave={() => setDown(false)}
      className={`dn-chunky${sm ? " dn-chunky-sm" : ""}`}
      style={{ width: full ? "100%" : undefined, background: disabled ? "#E5E5E5" : bg, color: disabled ? "#AFAFAF" : fg,
        boxShadow: disabled ? `0 ${lift}px 0 #CFCFCF` : `0 ${down ? 1 : lift}px 0 ${shadow}`, transform: down ? "translateY(1px)" : "none", cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}
function LetterTile({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return <span className="dn-tile" style={{ background: color, width: size, height: size, fontSize: size * 0.42, borderRadius: size * 0.28 }}>{name.charAt(0).toUpperCase()}</span>;
}
function AskChip({ onClick, sm }: { onClick: () => void; sm?: boolean }) {
  const { m } = useHomeLocale();
  return <button className={`dn-askchip${sm ? " dn-askchip-sm" : ""}`} onClick={onClick} title={m.askAi} aria-label={m.askAi}><Sparkles size={sm ? 13 : 16} strokeWidth={2.4} /></button>;
}

function BkIcon({ saved, size = 14, light = false }: { saved?: boolean; size?: number; light?: boolean }) {
  const color = light ? "#fff" : saved ? C.blueDark : C.sub;
  return (
    <Bookmark
      size={size}
      strokeWidth={2}
      fill={saved ? color : "none"}
      color={color}
      aria-hidden
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.dn-root, .dn-root * { box-sizing: border-box; font-family: 'Nunito', system-ui, -apple-system, sans-serif; }
.dn-root button { font-family: inherit; }
.dn-chunky { border: none; border-radius: 16px; font-weight: 800; font-size: 15px; padding: 12px 20px; letter-spacing: .2px; transition: transform .04s, box-shadow .04s; }
.dn-inline { display: inline-flex; align-items: center; gap: 8px; }
.dn-tile { flex-shrink: 0; display: grid; place-items: center; color: #fff; font-weight: 900; }
.dn-askchip { border: none; background: #F3E8FF; color: ${C.purple}; width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
.dn-askchip-sm { width: 24px; height: 24px; border-radius: 7px; }
.dn-askchip:hover { background: #EAD9FF; }

/* header */
.dn-header { position: fixed; top: 0; left: 0; right: 0; z-index: 40; background: #fff; border-bottom: 2px solid ${C.line}; }
.dn-header-inner { max-width: 1200px; margin: 0 auto; height: 66px; padding: 0 18px; display: flex; align-items: center; }
.dn-header-back { width: 40px; height: 40px; border: none; border-radius: 12px; background: ${C.wash}; color: ${C.ink}; cursor: pointer; display: grid; place-items: center; margin-right: 10px; }
.dn-header-back:hover { background: #ECECEC; }
.dn-brand { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; }
.dn-logo { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; }
.dn-brand-name { font-size: 21px; font-weight: 900; color: ${C.green}; letter-spacing: -.5px; }
.dn-header-right { display: flex; align-items: center; gap: 14px; margin-left: auto; }
.dn-streak { display: inline-flex; align-items: center; gap: 4px; font-weight: 900; color: ${C.ink}; }
.dn-avatar { width: 36px; height: 36px; border-radius: 50%; color: #fff; font-weight: 900; font-size: 13px; display: grid; place-items: center; }

/* main / hero */
.dn-main { max-width: min(1120px, calc(100% - 36px)); margin: 0 auto; padding: 84px 18px 120px; }
.dn-hero { text-align: center; margin-bottom: 18px; display: flex; flex-direction: column; align-items: center; }
.dn-hero-compact { margin-bottom: 16px; align-items: stretch; text-align: left; width: 100%; }
.dn-hero-row { display: flex; align-items: center; gap: 14px; width: 100%; max-width: 580px; margin: 0 auto 12px; }
.dn-hero-compact .dn-hero-ic { width: 58px; height: 58px; min-width: 58px; border-radius: 16px; margin-bottom: 0; box-shadow: 0 5px 0 rgba(0,0,0,.12); }
.dn-hero-compact .dn-hero-code { font-size: 15px; }
.dn-hero-title { flex: 1; min-width: 0; font-size: 28px; font-weight: 900; letter-spacing: -.6px; margin: 0; color: ${C.ink}; line-height: 1.1; }
.dn-hero-ic { width: 52px; height: 52px; min-width: 52px; border-radius: 16px; display: grid; place-items: center; margin-bottom: 10px; padding: 0 6px; overflow: hidden; }
.dn-hero-code { font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.5px; line-height: 1; white-space: nowrap; }
.dn-title { font-size: 34px; font-weight: 900; letter-spacing: -1px; margin: 0 0 4px; color: ${C.ink}; }
.dn-hero-sub { color: ${C.sub}; font-weight: 700; margin: 0 0 12px; font-size: 15px; }
.dn-hero-compact .dn-search { margin-top: 0; max-width: 580px; }
.dn-crumb-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: ${C.sub}; font-weight: 800; font-size: 14px; margin-bottom: 8px; padding: 6px 0; min-height: 44px; }
.dn-crumb-back:hover { color: ${C.ink}; }
.dn-exam-main { width: 100%; }
.dn-search { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 520px; margin: 8px auto 0; background: #fff; border: 2px solid ${C.line}; border-radius: 18px; padding: 14px 16px; transition: border-color .12s, box-shadow .12s; }
.dn-search:focus-within { border-color: ${C.blue}; box-shadow: 0 0 0 4px #DDF4FF; }
.dn-search input { flex: 1; min-width: 0; border: none; outline: none; font-size: 16px; font-weight: 700; color: ${C.ink}; background: none; }
.dn-search input::placeholder { color: ${C.faint}; font-weight: 600; }
.dn-search-clear { border: none; background: ${C.wash}; border-radius: 50%; width: 24px; height: 24px; display: grid; place-items: center; cursor: pointer; color: ${C.sub}; flex-shrink: 0; }

/* home search + spotify-style exam list */
.dn-home-empty { text-align: center; padding: 36px 16px; color: ${C.sub}; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 10px; }

/* fab */
.dn-fab { position: fixed; bottom: 26px; right: 26px; z-index: 45; width: 60px; height: 60px; border-radius: 20px; border: none; cursor: pointer; display: grid; place-items: center; transition: transform .05s; }
.dn-fab:active { transform: translateY(3px); }

/* modal */
.dn-modal-wrap { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.28); display: grid; place-items: center; padding: 20px; }
.dn-modal { width: 100%; max-width: 520px; background: #fff; border-radius: 24px; padding: 26px; box-shadow: 0 24px 70px rgba(15,23,42,.18); }
.dn-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.dn-modal-head b { font-size: 24px; font-weight: 900; }
.dn-drop { width: 100%; border: 2px dashed ${C.line}; border-radius: 20px; padding: 46px 24px; display: flex; flex-direction: column; align-items: center; gap: 10px; color: ${C.sub}; font-weight: 800; font-size: 16px; margin-bottom: 16px; background: #FAFAFA; cursor: pointer; transition: border-color .12s, background .12s, color .12s; }
.dn-drop:hover, .dn-drop.dragging { border-color: ${C.blue}; background: #F0FAFF; color: ${C.blueDark}; }
.dn-modal-input { width: 100%; border: 2px solid ${C.line}; border-radius: 14px; padding: 12px 14px; font-size: 15px; font-weight: 700; color: ${C.ink}; outline: none; margin-bottom: 16px; }
.dn-modal-input:focus { border-color: ${C.blue}; }
.dn-modal-select { width: 100%; border: 2px solid ${C.line}; border-radius: 14px; padding: 12px 14px; font-size: 15px; font-weight: 800; color: ${C.ink}; outline: none; margin-bottom: 12px; background: #fff; }
.dn-modal-select:focus { border-color: ${C.blue}; }

/* filter bar */
.dn-filterbar { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
.dn-periods { display: inline-flex; gap: 3px; background: #fff; border: 1px solid ${C.line}; border-radius: 14px; padding: 3px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(15,23,42,.04); }
.dn-period { border: none; cursor: pointer; padding: 8px 13px; border-radius: 10px; font-size: 13px; font-weight: 900; transition: all .1s; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 5px; line-height: 1; }
.dn-period-icon { padding: 8px 10px; min-width: 36px; }
.dn-selectall { display: inline-flex; align-items: center; gap: 7px; font-weight: 900; font-size: 13px; color: ${C.sub}; cursor: pointer; background: none; border: none; white-space: nowrap; flex-shrink: 0; }
.dn-check { width: 18px; height: 18px; border: 2px solid ${C.line}; border-radius: 5px; display: grid; place-items: center; transition: all .1s; }

/* rows */
.dn-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.dn-row { position: relative; display: flex; align-items: center; gap: 10px; border: 1px solid ${C.line}; border-radius: 14px; padding: 8px 10px; background: #fff; transition: border-color .12s, background .12s, box-shadow .12s; }
.dn-row:hover { box-shadow: 0 2px 10px rgba(0,0,0,.04); }
.dn-upvote { flex-shrink: 0; width: 44px; border: 1px solid ${C.line}; border-radius: 10px; background: #fff; cursor: pointer; display: flex; flex-direction: column; align-items: center; padding: 4px 0; transition: all .1s; }
.dn-upvote:hover { border-color: ${C.green}; }
.dn-upvote b { font-size: 11px; font-weight: 900; }
.dn-file { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; text-align: left; padding: 0; }
.dn-file-text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dn-file-name { font-weight: 800; font-size: 14px; color: ${C.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dn-file-meta { font-size: 11px; color: ${C.faint}; font-weight: 700; }
.dn-actions { display: flex; align-items: center; gap: 3px; opacity: 0; transform: translateX(4px); transition: opacity .14s, transform .14s; flex-shrink: 0; }
.dn-row:hover .dn-actions { opacity: 1; transform: none; }
.dn-icon-btn { border: none; background: ${C.wash}; color: ${C.sub}; cursor: pointer; width: 32px; height: 32px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; transition: background .1s; }
.dn-icon-btn:hover { background: #ECECEC; }
.dn-row-select { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; border: 1px solid ${C.line}; border-radius: 8px; padding: 4px 7px 4px 5px; background: #fff; cursor: pointer; transition: border-color .12s, background .12s; }
.dn-row-select:hover { border-color: ${C.blue}; background: #F8FCFF; }
.dn-row-select.on { border-color: ${C.blue}; background: #F0FAFF; }
.dn-row-select-label { font-size: 10px; font-weight: 800; color: ${C.sub}; line-height: 1; white-space: nowrap; }
.dn-row-select.on .dn-row-select-label { color: ${C.blueDark}; }
.dn-row-select .dn-check { width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0; }
.dn-empty { text-align: center; padding: 50px 20px; color: ${C.sub}; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 10px; }

/* bulk + toast */
.dn-bulk { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 50; background: #fff; border: 2px solid ${C.line}; border-radius: 20px; padding: 12px 12px 12px 20px; display: flex; align-items: center; gap: 18px; box-shadow: 0 10px 30px rgba(0,0,0,.14); }
.dn-bulk > span { font-weight: 800; color: ${C.ink}; }
.dn-bulk-actions { display: flex; align-items: center; gap: 10px; }
.dn-bulk-clear { border: none; background: none; color: ${C.sub}; font-weight: 800; cursor: pointer; font-size: 14px; }
.dn-toast { position: fixed; bottom: 22px; right: 22px; z-index: 200; background: #fff; border: 2px solid ${C.line}; border-radius: 14px; padding: 12px 16px; font-weight: 800; color: ${C.ink}; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.12); }

/* ============ full-screen study ============ */
.dn-fs { position: fixed; inset: 0; z-index: 100; background: #fff; display: flex; flex-direction: column; }
.dn-fs-head { flex-shrink: 0; background: #fff; }
.dn-fs-row1 { display: flex; align-items: center; gap: 8px; padding: 8px 12px 6px; min-width: 0; }
.dn-fs-row2 { padding: 0 12px 8px; }
.dn-fs-close { width: 34px; height: 34px; border-radius: 10px; border: none; background: none; cursor: pointer; display: grid; place-items: center; color: ${C.sub}; flex-shrink: 0; }
.dn-fs-close:hover { background: ${C.wash}; }
.dn-fs-title-wrap { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.dn-fs-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dn-fs-title { flex: 1; min-width: 0; margin: 0; display: flex; align-items: baseline; gap: 0; overflow: hidden; white-space: nowrap; line-height: 1.2; }
.dn-fs-title-main { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-size: 15px; font-weight: 800; color: ${C.ink}; }
.dn-fs-sub { flex-shrink: 0; font-size: 12px; font-weight: 700; color: ${C.faint}; margin-left: 6px; }
.dn-fs-bk { width: 34px; height: 34px; border: none; background: none; border-radius: 10px; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }
.dn-fs-bk:hover { background: ${C.wash}; }
.dn-fs-fs { width: 34px; height: 34px; border: none; background: none; border-radius: 10px; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; color: ${C.sub}; }
.dn-fs-fs:hover { background: ${C.wash}; }
.dn-fs-immersive .dn-fs-tabs { display: none !important; }
.dn-fs-immersive .dn-tabbar { display: flex !important; }
.dn-fs-search { width: 100%; display: flex; align-items: center; gap: 8px; background: ${C.wash}; border: 1px solid ${C.line}; border-radius: 12px; padding: 8px 12px; transition: border-color .12s, background .12s; }
.dn-fs-search:focus-within { background: #fff; border-color: ${C.blue}; box-shadow: 0 0 0 3px #DDF4FF; }
.dn-fs-search input { flex: 1; min-width: 0; border: none; outline: none; background: none; font-size: 14px; font-weight: 700; color: ${C.ink}; }
.dn-fs-search input::placeholder { color: ${C.faint}; font-weight: 600; }
.dn-fs-clear { border: none; background: #E5E5E5; border-radius: 50%; width: 22px; height: 22px; display: grid; place-items: center; cursor: pointer; color: ${C.sub}; flex-shrink: 0; }
.dn-fs-tabs { display: flex; gap: 4px; padding: 0 14px 10px; overflow-x: auto; scrollbar-width: none; }
.dn-fs-tabs::-webkit-scrollbar { display: none; }
.dn-fs-tab { display: inline-flex; align-items: center; gap: 6px; border: none; cursor: pointer; padding: 9px 14px; border-radius: 12px; font-size: 14px; font-weight: 800; white-space: nowrap; }
.dn-fs-tab:hover { background: ${C.wash}; }
.dn-fs-body { flex: 1; min-height: 0; display: flex; position: relative; }

/* bottom tab bar (mobile/ipad) */
.dn-tabbar { display: none; flex-shrink: 0; border-top: 2px solid ${C.line}; background: #fff; padding: 4px 2px calc(4px + env(safe-area-inset-bottom)); overflow-x: auto; scrollbar-width: none; }
.dn-tabbar::-webkit-scrollbar { display: none; }
.dn-tabbar-inner { display: flex; min-width: min-content; width: 100%; }
.dn-tabbar-btn { flex: 1; min-width: 52px; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 5px 2px; font-size: 9px; font-weight: 800; border-radius: 10px; }
.dn-tabbar-btn.on { background: #DDF4FF; }
.dn-tabbar-ask.on { background: #F3E8FF !important; }

/* ai fab removed — Ask lives in tab bar */
.dn-ask-pop { position: fixed; z-index: 130; transform: translate(-50%, -100%); background: ${C.ink}; color: #fff; border: none; border-radius: 12px; padding: 8px 12px; font-weight: 800; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
.dn-chat { position: fixed; top: 0; right: 0; bottom: 0; z-index: 140; width: 380px; max-width: 100%; background: #fff; border-left: 2px solid ${C.line}; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(0,0,0,.12); }
.dn-chat-head { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
.dn-chat-brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dn-chat-head-div { color: ${C.faint}; font-weight: 800; font-size: 14px; flex-shrink: 0; }
.dn-chat-head b { font-size: 16px; font-weight: 900; }
.dn-chat-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.dn-msg { max-width: 85%; padding: 11px 14px; border-radius: 16px; font-weight: 600; font-size: 14.5px; line-height: 1.5; }
.dn-msg.ai { background: ${C.wash}; color: ${C.ink}; align-self: flex-start; border-bottom-left-radius: 5px; }
.dn-msg.user { background: ${C.blue}; color: #fff; align-self: flex-end; border-bottom-right-radius: 5px; }
.dn-chat-quote { flex-shrink: 0; display: flex; align-items: center; gap: 8px; margin: 0 16px; padding: 8px 12px; background: #F3E8FF; border-left: 3px solid ${C.purple}; border-radius: 8px; font-size: 13px; font-weight: 700; color: ${C.purpleDark}; }
.dn-chat-quote span { flex: 1; }
.dn-chat-quote button { border: none; background: none; cursor: pointer; color: ${C.purpleDark}; display: grid; place-items: center; }
.dn-chat-input { flex-shrink: 0; display: flex; gap: 8px; padding: 14px 16px calc(14px + env(safe-area-inset-bottom)); border-top: 2px solid ${C.line}; }
.dn-chat-input input { flex: 1; border: 2px solid ${C.line}; border-radius: 14px; padding: 11px 14px; font-size: 15px; font-weight: 600; outline: none; }
.dn-chat-input input:focus { border-color: ${C.purple}; }
.dn-chat-send { width: 44px; height: 44px; border-radius: 14px; border: none; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }

/* read */
.dn-read-fs { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.dn-read-toolbar { display: flex; gap: 8px; padding: 8px 12px; border-bottom: 1px solid ${C.line}; background: #fff; }
.dn-read-view { border: 2px solid ${C.line}; background: #fff; border-radius: 10px; padding: 6px 12px; font-weight: 800; font-size: 12px; color: ${C.sub}; cursor: pointer; }
.dn-read-view.on { border-color: ${C.blue}; color: ${C.blueDark}; background: #DDF4FF; }
.dn-read-source { max-width: 680px; margin: 0 auto; padding: 20px 18px; font-size: 13px; line-height: 1.55; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap; word-break: break-word; color: ${C.ink}; }
.dn-read-banner { max-width: 680px; margin: 12px auto 0; padding: 12px 14px; border-radius: 12px; border: 1px solid ${C.line}; background: ${C.wash}; font-size: 13px; line-height: 1.45; color: ${C.sub}; }
.dn-pdf-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.dn-pdf-page { position: relative; flex: 1; overflow: auto; display: flex; justify-content: center; padding: 12px; background: ${C.wash}; }
.dn-pdf-canvas { display: block; box-shadow: 0 2px 16px rgba(0,0,0,.12); background: #fff; }
.dn-pdf-text-layer { position: absolute; left: 50%; top: 12px; transform: translateX(-50%); overflow: hidden; line-height: 1; pointer-events: auto; }
.dn-pdf-text-layer span, .dn-pdf-text-layer br { color: transparent; position: absolute; white-space: pre; transform-origin: 0 0; user-select: text; cursor: text; }
.dn-pdf-text-layer ::selection { background: rgba(88, 204, 2, 0.35); }
.dn-pdf-pager { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px; border-top: 1px solid ${C.line}; background: #fff; font-size: 13px; font-weight: 700; color: ${C.sub}; }
.dn-pdf-pager button { border: 1px solid ${C.line}; background: #fff; border-radius: 8px; width: 34px; height: 34px; display: grid; place-items: center; cursor: pointer; }
.dn-pdf-pager button:disabled { opacity: .4; cursor: not-allowed; }
.dn-pdf-state { padding: 48px 20px; text-align: center; color: ${C.sub}; font-size: 14px; }
.dn-pdf-error { color: ${C.red}; }
.dn-progress { height: 8px; background: ${C.wash}; }
.dn-progress span { display: block; height: 100%; border-radius: 0 6px 6px 0; transition: width .3s; }
.dn-read-scroll { flex: 1; overflow-y: auto; }
.dn-read-col { max-width: 680px; margin: 0 auto; padding: 24px 18px 16px; }
.dn-read-col h1 { font-size: 24px; font-weight: 900; letter-spacing: -.6px; margin: 0 0 12px; color: ${C.ink}; }
.dn-read-col p { font-size: 16px; line-height: 1.6; font-weight: 600; color: ${C.ink}; margin: 0 0 12px; }
.dn-read-lead { font-size: 16px !important; }
.dn-callout { border-left: 4px solid; background: ${C.wash}; border-radius: 10px; padding: 12px 14px; margin: 0 0 12px; }
.dn-callout b { display: block; font-size: 11px; letter-spacing: .4px; color: ${C.sub}; margin-bottom: 4px; }
.dn-callout p { font-size: 15px !important; margin: 0 !important; }
.dn-foot-back:disabled { opacity: .4; cursor: not-allowed; }
.dn-foot-nav { display: flex; align-items: center; gap: 8px; }
.dn-read-foot { flex-shrink: 0; border-top: 1px solid ${C.line}; display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; gap: 8px; max-width: 728px; margin: 0 auto; width: 100%; background: #fff; }
.dn-read-foot .dn-foot-back { padding: 6px 10px; font-size: 12px; border-width: 1px; border-radius: 10px; gap: 3px; }
.dn-read-foot .dn-foot-count { font-size: 11px; flex-shrink: 0; }
.dn-foot-count-short { display: none; }
.dn-foot-back-label { display: inline; }
.dn-foot-next-label { display: inline; }
.dn-foot-back { display: inline-flex; align-items: center; gap: 4px; border: 2px solid ${C.line}; background: #fff; border-radius: 12px; padding: 8px 12px; font-weight: 800; font-size: 13px; color: ${C.sub}; cursor: pointer; }
.dn-foot-count { font-weight: 800; color: ${C.faint}; font-size: 12px; }
.dn-foot-icon { width: 38px; height: 38px; border-radius: 12px; border: 2px solid ${C.line}; background: #fff; cursor: pointer; display: grid; place-items: center; color: ${C.sub}; flex-shrink: 0; }
.dn-chunky-sm { border: none; border-radius: 10px; font-weight: 800; font-size: 12px; padding: 6px 12px; letter-spacing: .2px; transition: transform .04s, box-shadow .04s; }

/* quiz */
.dn-quiz-fs { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.dn-quiz-scroll { flex: 1; overflow-y: auto; padding: 14px 16px; }
.dn-q-card { max-width: 680px; margin: 0 auto 12px; border: 1px solid ${C.line}; border-radius: 14px; padding: 14px; }
.dn-q-top { display: flex; align-items: center; justify-content: space-between; }
.dn-q-num { font-size: 11px; font-weight: 900; letter-spacing: .8px; color: ${C.faint}; margin: 0 0 6px; }
.dn-q-flag { border: none; background: none; cursor: pointer; padding: 4px; }
.dn-q-stem { font-size: 15px; font-weight: 800; line-height: 1.4; color: ${C.ink}; margin: 0 0 10px; }
.dn-q-options { display: flex; flex-direction: column; gap: 8px; }
.dn-q-opt { display: flex; align-items: center; gap: 10px; text-align: left; border: 1px solid ${C.line}; border-radius: 12px; padding: 10px 12px; font-weight: 700; font-size: 14px; color: ${C.ink}; background: #fff; transition: all .1s; }
.dn-q-key { width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; font-weight: 900; font-size: 12px; flex-shrink: 0; }
.dn-q-explain { margin-top: 8px; background: ${C.wash}; border-radius: 8px; padding: 7px 9px; display: flex; align-items: flex-start; gap: 6px; }
.dn-q-explain-text { flex: 1; min-width: 0; margin: 0; font-weight: 500; line-height: 1.35; color: ${C.sub}; font-size: 13px; }
.dn-q-explain-text b { font-weight: 800; font-size: 12px; margin-right: 5px; }
.dn-reveal-bar { flex-shrink: 0; padding: 10px 14px; border-top: 2px solid ${C.line}; max-width: 728px; margin: 0 auto; width: 100%; }
.dn-quiz-foot { flex-shrink: 0; border-top: 2px solid ${C.line}; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; max-width: 728px; margin: 0 auto; width: 100%; }
.dn-dots { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.dn-dot { width: 9px; height: 9px; border-radius: 50%; border: none; cursor: pointer; padding: 0; transition: background .1s; }

/* sheet */
.dn-sheet-wrap { position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,.28); display: grid; place-items: center; padding: 20px; }
.dn-sheet { width: 100%; max-width: 400px; background: #fff; border-radius: 22px; padding: 22px; box-shadow: 0 16px 48px rgba(0,0,0,.18); }
.dn-sheet-grip { display: none; }
.dn-sheet-title { font-size: 18px; font-weight: 900; display: block; margin-bottom: 14px; }
.dn-sheet-label, .nt-sub-label { font-size: 13px; font-weight: 800; color: ${C.sub}; margin: 12px 0 8px; }
.dn-seg { display: flex; gap: 8px; margin-bottom: 8px; }
.dn-seg-btn { flex: 1; border: 2px solid ${C.line}; border-radius: 13px; padding: 11px 10px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all .1s; }
.dn-sheet .dn-chunky { margin-top: 14px; }

/* review */
.dn-centered-h1 { text-align: center; margin-bottom: 12px; }
.dn-rv-toolbar { margin-bottom: 14px; }
.dn-rv-search { max-width: 420px; margin: 0 auto 10px; display: flex; align-items: center; gap: 8px; background: ${C.wash}; border: 1px solid ${C.line}; border-radius: 12px; padding: 8px 12px; transition: border-color .12s, background .12s; }
.dn-rv-search:focus-within { background: #fff; border-color: ${C.blue}; box-shadow: 0 0 0 3px #DDF4FF; }
.dn-rv-search input { flex: 1; min-width: 0; border: none; outline: none; background: none; font-size: 14px; font-weight: 700; color: ${C.ink}; }
.dn-rv-search input::placeholder { color: ${C.faint}; font-weight: 600; }
.dn-rv-filters { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.dn-rv-filter { display: inline-flex; align-items: center; gap: 7px; border: 2px solid ${C.line}; border-radius: 13px; padding: 8px 12px; font-weight: 800; font-size: 13.5px; cursor: pointer; transition: all .1s; }
.dn-rv-count { font-size: 12px; font-weight: 900; padding: 1px 7px; border-radius: 7px; }
.dn-rv-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.dn-rv-item { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; background: #fff; border: 2px solid ${C.line}; border-radius: 14px; padding: 13px 14px; cursor: pointer; transition: border-color .12s, box-shadow .12s; }
.dn-rv-item:hover { border-color: ${C.blue}; box-shadow: 0 3px 10px rgba(0,0,0,.05); }
.dn-rv-badge { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
.dn-rv-stem { flex: 1; font-weight: 700; font-size: 14.5px; color: ${C.ink}; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dn-rv-viewer { position: fixed; inset: 0; z-index: 120; background: #fff; display: flex; flex-direction: column; }
.dn-rv-vtop { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 2px solid ${C.line}; }
.dn-rv-vbody { flex: 1; overflow-y: auto; padding: 22px 24px; }
.dn-rv-sessions { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.dn-rv-session { background: #fff; border: 2px solid ${C.line}; border-radius: 14px; padding: 12px 14px; }
.dn-rv-session-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.dn-rv-session-title { font-weight: 800; font-size: 14px; color: ${C.ink}; margin: 0; line-height: 1.3; }
.dn-rv-session-src { display: block; font-size: 10px; font-weight: 800; color: ${C.faint}; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
.dn-rv-session-score { font-size: 18px; font-weight: 900; color: ${C.ink}; white-space: nowrap; }
.dn-rv-session-score small { font-size: 12px; font-weight: 700; color: ${C.faint}; }
.dn-rv-session-meta { font-size: 12px; font-weight: 600; color: ${C.sub}; margin: 0 0 10px; display: flex; flex-wrap: wrap; gap: 6px 12px; }
.dn-rv-session-meta span { display: inline-flex; align-items: center; gap: 4px; }
.dn-rv-session-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.dn-rv-session-btn { border: none; border-radius: 9px; padding: 6px 10px; font-size: 11px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; background: ${C.wash}; color: ${C.sub}; }
.dn-rv-session-btn.primary { background: ${C.blue}; color: #fff; }
.dn-rv-session-btn.ghost { background: #fff; border: 1px solid ${C.line}; }
.dn-rv-report { max-width: 680px; margin: 0 auto; }
.dn-rv-report-head { text-align: center; margin-bottom: 18px; }
.dn-rv-report-score { font-size: 42px; font-weight: 900; color: ${C.ink}; line-height: 1; margin: 8px 0; }
.dn-rv-report-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
.dn-rv-report-stat { background: ${C.wash}; border-radius: 12px; padding: 10px; text-align: center; }
.dn-rv-report-stat b { display: block; font-size: 18px; font-weight: 900; color: ${C.ink}; }
.dn-rv-report-stat span { font-size: 11px; font-weight: 700; color: ${C.faint}; }

/* notion */
.nt-scroll { flex: 1; overflow-y: auto; }
.nt-doc { max-width: 720px; margin: 0 auto; padding: 40px 28px 90px; }
.nt-pageicon { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 12px; }
.nt-h1 { font-size: 32px; font-weight: 900; letter-spacing: -.6px; margin: 0 0 4px; color: ${C.ink}; }
.nt-meta { color: ${C.faint}; font-weight: 700; font-size: 13px; margin: 0 0 22px; }
.nt-h2 { font-size: 20px; font-weight: 900; margin: 28px 0 12px; color: ${C.ink}; }
.nt-callout { display: flex; gap: 12px; background: ${C.wash}; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; }
.nt-callout-ic { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
.nt-callout p { margin: 0; font-weight: 700; line-height: 1.5; color: ${C.ink}; }
.nt-bullets { margin: 0; padding-left: 20px; }
.nt-bullets li { font-weight: 600; line-height: 1.6; color: ${C.ink}; margin-bottom: 6px; }
.nt-toggle-head { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; font-weight: 800; color: ${C.ink}; font-size: 15px; }
.nt-toggle-head:hover { background: ${C.wash}; }
.nt-toggle-body { padding: 2px 8px 12px 30px; }
.nt-toggle-body p { margin: 0; font-weight: 600; line-height: 1.6; color: ${C.sub}; }
.nt-checks { list-style: none; margin: 0; padding: 0; }
.nt-checks li { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 8px; font-weight: 700; }
.nt-checks li:hover { background: ${C.wash}; }
.nt-check { width: 20px; height: 20px; border: 2px solid; border-radius: 6px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
.nt-block { position: relative; border-radius: 10px; padding: 8px 10px; margin: 0 -10px; transition: background .12s, box-shadow .12s; }
.nt-block:hover { background: ${C.wash}; }
.nt-block.hl:hover { background: var(--nt-hl-bg, ${C.wash}); }
.nt-block-bar { position: absolute; top: 6px; right: 6px; display: flex; align-items: center; gap: 4px; padding: 3px 5px; background: #fff; border: 1px solid ${C.line}; border-radius: 9px; box-shadow: 0 2px 8px rgba(0,0,0,.08); opacity: 0; pointer-events: none; transition: opacity .12s; z-index: 2; }
.nt-block:hover .nt-block-bar, .nt-block:focus-within .nt-block-bar, .nt-block.editing .nt-block-bar { opacity: 1; pointer-events: auto; }
.nt-hl-btn { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(0,0,0,.1); cursor: pointer; padding: 0; flex-shrink: 0; transition: transform .08s, box-shadow .08s; }
.nt-hl-btn.on { box-shadow: 0 0 0 2px ${C.blue}; transform: scale(1.06); }
.nt-note-btn { border: none; background: ${C.wash}; color: ${C.sub}; width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
.nt-note-btn.on { background: #FFF3BF; color: ${C.yellowDark}; }
.nt-block-note { margin-top: 8px; padding: 8px 10px; background: rgba(255,255,255,.85); border-radius: 8px; border: 1px dashed ${C.line}; }
.nt-block-note textarea { width: 100%; min-height: 56px; border: none; outline: none; resize: vertical; font-family: inherit; font-size: 13px; font-weight: 600; line-height: 1.45; color: ${C.ink}; background: transparent; }
.nt-block-note p { margin: 0; font-size: 13px; font-weight: 600; line-height: 1.45; color: ${C.sub}; cursor: text; }
.nt-block-note-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px; }
.nt-block-note-actions button { border: none; background: ${C.wash}; border-radius: 7px; padding: 4px 8px; font-size: 11px; font-weight: 800; color: ${C.sub}; cursor: pointer; }
.nt-block-note-actions button.save { background: ${C.blue}; color: #fff; }
.nt-callout.nt-block { display: flex; gap: 12px; margin: 0 0 8px; padding: 14px 16px; }
.nt-bullets .nt-block { margin: 0; padding: 6px 8px; }
.nt-checks .nt-block { flex: 1; min-width: 0; margin: 0; padding: 6px 8px; }
.nt-toggle-head-wrap.nt-block { padding: 0; margin: 0; }
.nt-toggle-head-wrap.nt-block:hover { background: transparent; }
.nt-toggle-head-wrap.nt-block .nt-toggle-head { width: 100%; }
.nt-toggle-body-wrap.nt-block { padding: 2px 8px 12px 20px; margin: 0; }

/* quizlet — list only */
.ql-scroll { flex: 1; overflow-y: auto; }
.ql-wrap { max-width: 680px; margin: 0 auto; padding: 14px 16px calc(16px + env(safe-area-inset-bottom)); }
.ql-list-h { font-size: 15px; font-weight: 900; margin: 0 0 10px; color: ${C.ink}; }
.ql-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.ql-head .ql-list-h { margin: 0; flex: 1; min-width: 0; }
.ql-view-toggle { display: flex; gap: 3px; padding: 3px; background: ${C.wash}; border-radius: 10px; flex-shrink: 0; }
.ql-view-btn { border: none; background: transparent; width: 34px; height: 30px; border-radius: 8px; display: grid; place-items: center; cursor: pointer; color: ${C.faint}; transition: background .1s, color .1s, box-shadow .1s; }
.ql-view-btn.on { background: #fff; color: ${C.ink}; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
.ql-view-btn span { display: none; }
.ql-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.ql-row { display: flex; flex-direction: column; gap: 0; background: #fff; border: 1px solid ${C.line}; border-radius: 12px; overflow: hidden; }
.ql-row-head { display: flex; align-items: center; gap: 8px; padding: 0 6px 0 0; }
.ql-row-toggle { flex: 1; display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 12px 8px 12px 14px; }
.ql-term { flex: 1; font-weight: 800; color: ${C.ink}; font-size: 14px; line-height: 1.35; }
.ql-thumb { width: 44px; height: 32px; border-radius: 6px; object-fit: cover; border: 1px solid ${C.line}; flex-shrink: 0; background: ${C.wash}; }
.ql-img-badge { flex-shrink: 0; color: ${C.faint}; }
.ql-card-img { display: block; width: calc(100% - 28px); max-height: 220px; object-fit: contain; border-radius: 10px; border: 1px solid ${C.line}; background: #fff; margin: 0 14px 10px; }
.ql-def { padding: 0 14px 12px; font-weight: 600; color: ${C.sub}; font-size: 13px; line-height: 1.45; border-top: 1px solid ${C.line}; padding-top: 10px; margin: 0 14px 12px; }
.ql-def.no-border { border-top: none; margin-top: 0; padding-top: 0; }
.ql-fav { border: none; background: none; cursor: pointer; flex-shrink: 0; padding: 4px; }
.ql-split-row.has-img { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) auto; }
.ql-split-def-inner { display: flex; flex-direction: column; gap: 8px; }
.ql-split-media { width: 100%; max-height: 120px; object-fit: contain; border-radius: 8px; border: 1px solid ${C.line}; background: #fff; }
.ql-split-row { display: grid; grid-template-columns: 1fr 1fr auto; align-items: stretch; background: #fff; border: 1px solid ${C.line}; border-radius: 12px; overflow: hidden; }
.ql-split-term, .ql-split-def { padding: 12px 14px; font-size: 14px; line-height: 1.35; }
.ql-split-term { font-weight: 800; color: ${C.ink}; border-right: 1px solid ${C.line}; }
.ql-split-def { font-weight: 600; color: ${C.sub}; }
.ql-split-fav { display: flex; align-items: center; justify-content: center; padding: 0 8px; border-left: 1px solid ${C.line}; background: #fff; }

/* custom */
.dn-custom { max-width: 560px; margin: 0 auto; padding: 40px 24px 90px; }
.dn-mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 8px; }
.dn-mode { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; border: 2px solid ${C.line}; border-radius: 16px; padding: 18px 10px; cursor: pointer; font-weight: 800; color: ${C.ink}; transition: all .1s; }
.dn-mode-ic { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; }
.dn-mode-check { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 6px; border: 2px solid; display: grid; place-items: center; }
.dn-row-field { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-top: 2px solid ${C.line}; font-weight: 800; color: ${C.ink}; }
.dn-row-field > span { display: inline-flex; align-items: center; gap: 8px; }
.dn-stepper { display: flex; align-items: center; gap: 14px; }
.dn-stepper button { width: 34px; height: 34px; border-radius: 10px; border: 2px solid ${C.line}; background: #fff; font-size: 18px; font-weight: 900; cursor: pointer; color: ${C.ink}; }
.dn-stepper b { min-width: 28px; text-align: center; font-size: 16px; }
.dn-switch { width: 46px; height: 26px; border-radius: 20px; border: none; cursor: pointer; padding: 3px; transition: background .15s; }
.dn-switch span { display: block; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .15s; }
.dn-custom .dn-chunky { margin-top: 18px; }


@media (min-width: 900px) {
  .dn-title { font-size: 44px; }
}
/* ---------- responsive: tablets & phones ---------- */
@media (max-width: 1024px) {
  .dn-fs-tabs { display: none; }
  .dn-tabbar { display: flex; }
  .dn-chat { width: 100%; border-left: none; }
  .dn-fs-body { padding-bottom: 0; }
  .nt-doc { padding: 20px 16px 24px; }
  .dn-custom { padding: 20px 16px 24px; }
}
@media (max-width: 640px) {
  .dn-main { max-width: 100%; padding: 64px 12px 100px; }
  .dn-header-inner { height: 52px; padding: 0 12px; }
  .dn-header-back { width: 34px; height: 34px; border-radius: 10px; margin-right: 8px; }
  .dn-hero { margin-bottom: 10px; }
  .dn-hero-row { max-width: 100%; margin-bottom: 10px; gap: 10px; }
  .dn-hero-compact .dn-hero-ic { width: 46px; height: 46px; min-width: 46px; border-radius: 13px; }
  .dn-hero-compact .dn-hero-code { font-size: 12px; }
  .dn-hero-title { font-size: 21px; }
  .dn-hero-compact .dn-search { max-width: 100%; }
  .dn-search { max-width: 100%; padding: 10px 12px; border-radius: 12px; margin-top: 0; border-width: 1px; }
  .dn-search input { font-size: 15px; }
  .dn-filterbar { justify-content: center; gap: 10px; margin-bottom: 12px; }
  .dn-periods { border-radius: 12px; padding: 3px; }
  .dn-period { padding: 7px 9px; font-size: 12px; }
  .dn-period-icon { padding: 7px 8px; min-width: 32px; }
  .dn-selectall { font-size: 12px; gap: 5px; }
  .dn-check { width: 16px; height: 16px; }
  .dn-modal { max-width: 100%; padding: 22px; }
  .dn-modal-head b { font-size: 21px; }
  .dn-drop { padding: 38px 18px; font-size: 15px; }
  .dn-row { flex-wrap: nowrap; gap: 8px; padding: 8px; border-radius: 12px; align-items: center; }
  .dn-upvote { width: 38px; border-radius: 9px; padding: 3px 0; }
  .dn-upvote b { font-size: 10px; }
  .dn-upvote svg { width: 16px; height: 16px; }
  .dn-file { flex: 1; min-width: 0; gap: 8px; }
  .dn-tile { width: 36px !important; height: 36px !important; font-size: 15px !important; border-radius: 10px !important; }
  .dn-file-name { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dn-file-meta { font-size: 10px; }
  .dn-actions { opacity: 1; transform: none; gap: 2px; }
  .dn-icon-btn { width: 28px; height: 28px; border-radius: 8px; }
  .dn-icon-btn svg { width: 15px; height: 15px; }
  .dn-row-select { padding: 3px 6px 3px 4px; border-radius: 7px; }
  .dn-row-select-label { font-size: 9px; }
  .dn-row-select .dn-check { width: 13px; height: 13px; }
  .dn-hide-sm { display: none; }
  .dn-fab { bottom: 18px; right: 18px; width: 52px; height: 52px; border-radius: 16px; }
  .dn-bulk { left: 12px; right: 12px; transform: none; width: auto; flex-wrap: wrap; gap: 8px; padding: 10px 12px; border-radius: 14px; }
  .dn-bulk-actions { width: 100%; justify-content: space-between; }
  .dn-mode-grid { grid-template-columns: 1fr; }
  .dn-read-col { padding: 16px 14px 8px; }
  .dn-read-col h1 { font-size: 20px; margin-bottom: 8px; }
  .dn-read-col p, .dn-read-lead { font-size: 15px !important; margin-bottom: 10px; }
  .dn-read-foot { padding: 4px 8px calc(4px + env(safe-area-inset-bottom)); gap: 6px; }
  .dn-read-foot .dn-foot-back { padding: 5px 7px; min-width: 30px; justify-content: center; }
  .dn-foot-back-label { display: none; }
  .dn-foot-count-full { display: none; }
  .dn-foot-count-short { display: inline; font-size: 10px; }
  .dn-foot-next-label { display: none; }
  .dn-read-foot .dn-chunky-sm { padding: 5px 10px; font-size: 11px; border-radius: 9px; }
  .dn-quiz-scroll { padding: 10px 12px; }
  .dn-q-card { padding: 12px; margin-bottom: 8px; }
  .dn-q-stem { font-size: 14px; margin-bottom: 8px; }
  .dn-q-opt { padding: 8px 10px; font-size: 13px; }
  .dn-q-explain { margin-top: 6px; padding: 5px 7px; gap: 5px; border-radius: 7px; }
  .dn-q-explain-text { font-size: 12px; line-height: 1.3; }
  .dn-q-explain-text b { font-size: 11px; margin-right: 4px; }
  .dn-quiz-foot { padding: 8px 12px; }
  .dn-fs-row1 { gap: 6px; padding: 6px 10px 4px; }
  .dn-fs-row2 { padding: 0 10px 6px; }
  .dn-fs-close { width: 32px; height: 32px; border-radius: 9px; }
  .dn-fs-title-main { font-size: 14px; }
  .dn-fs-sub { font-size: 11px; margin-left: 5px; }
  .dn-fs-bk { width: 32px; height: 32px; }
  .dn-fs-fs { width: 32px; height: 32px; }
  .dn-fs-search { padding: 7px 10px; border-radius: 10px; }
  .dn-fs-search input { font-size: 13px; }
  .dn-rv-search { max-width: 100%; margin-bottom: 8px; padding: 7px 10px; border-radius: 10px; }
  .dn-rv-search input { font-size: 13px; }
  .dn-rv-filter { padding: 6px 10px; font-size: 12px; border-radius: 11px; }
  .dn-rv-count { font-size: 11px; padding: 1px 6px; }
  .dn-tabbar-btn { font-size: 8px; min-width: 46px; padding: 4px 1px; }
  .dn-tabbar-btn svg { width: 20px; height: 20px; }
  .ql-split-term, .ql-split-def { padding: 10px 10px; font-size: 12px; }
  .ql-split-media { max-height: 96px; }
  .ql-view-btn { width: 30px; height: 28px; }
}
`;

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */
export function DrNoteHome({ initialExamId }: { initialExamId?: string }) {
  return (
    <HomeLocaleProvider>
      <MedGeniusCreditsProvider>
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 [color-scheme:light]">
          <DrNoteHomeInner initialExamId={initialExamId} />
        </div>
      </MedGeniusCreditsProvider>
    </HomeLocaleProvider>
  );
}

function DrNoteHomeInner({ initialExamId }: { initialExamId?: string }) {
  const { m } = useHomeLocale();
  const initialExam = useMemo(
    () => EXAMS.find((item) => item.id === initialExamId) ?? null,
    [initialExamId]
  );
  const [page, setPage] = useState<"home" | "exam" | "study">(
    initialExam ? "exam" : "home"
  );
  const [exam, setExam] = useState<Exam | null>(initialExam);
  const [file, setFile] = useState<ExamFile | null>(null);
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();
  const streakData = useStudyStreak(page !== "home");
  const [docsRefreshKey, setDocsRefreshKey] = useState(0);

  const [filter, setFilter] = useState<Filter>("week");
  const [query, setQuery] = useState("");
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set(["f1", "f4"]));
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const toastTimerRef = useRef<number | null>(null);

  const flash = useCallback((m: string) => {
    setToast(m);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1700);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  const openExam = (e: Exam) => { setExam(e); setQuery(""); setPicked(new Set()); setFilter("week"); setPage("exam"); window.scrollTo(0, 0); };
  const openFile = (f: ExamFile) => { setFile(f); setPage("study"); };
  const toggleSaved = (id: string) => { const n = new Set(saved); n.has(id) ? n.delete(id) : n.add(id); setSaved(n); };

  return (
    <>
      <style>{styles}</style>

      {page === "home" && (
        <Home onOpen={openExam} onAdd={() => setAdding(true)} />
      )}

      {page !== "home" && (
        <div className="dn-root" style={{ background: C.wash, color: C.ink, minHeight: "100vh" }}>
          {page !== "study" && (
            <header className="dn-header">
              <div className="dn-header-inner">
                {page === "exam" && (
                  <button
                    type="button"
                    className="dn-header-back"
                    onClick={() => setPage("home")}
                    aria-label={m.allExamsBack}
                    title={m.allExamsBack}
                  >
                    <ArrowLeft size={21} strokeWidth={2.8} />
                  </button>
                )}
                <button type="button" className="dn-brand" onClick={() => setPage("home")} aria-label={m.drnoteHome}>
                  <DrNoteLogo showWordmark forceWordmark />
                </button>
                <div className="dn-header-right">
                  <CreditsBadge />
                  {mounted && clerkEnabled && isClerkSignedIn() && (
                    <span className="dn-streak"><Flame size={18} color={C.yellow} fill={C.yellow} strokeWidth={2} /><b>{streakData.streakDays || 0}</b></span>
                  )}
                  <UserAuthControls compact />
                </div>
              </div>
            </header>
          )}

          {page === "exam" && exam && (
            <ExamPage exam={exam} filter={filter} setFilter={setFilter} query={query} setQuery={setQuery}
              voted={voted} setVoted={setVoted} saved={saved} toggleSaved={toggleSaved}
              picked={picked} setPicked={setPicked} onBack={() => setPage("home")} onOpen={openFile}
              onAdd={() => setAdding(true)} flash={flash}
              docsRefreshKey={docsRefreshKey} useLiveData={clerkEnabled} />
          )}

          {page === "study" && file && (
            <Study file={file} exam={exam} saved={saved.has(file.id)} onToggleSave={() => { toggleSaved(file.id); flash(saved.has(file.id) ? m.removedBookmark : m.bookmarked); }}
              onClose={() => setPage("exam")} flash={flash} />
          )}

          {toast && <div className="dn-toast"><Check size={16} strokeWidth={3} color={C.green} /> {toast}</div>}
        </div>
      )}

      {adding && (
        <AddFile
          examId={exam?.id}
          onClose={() => setAdding(false)}
          onDone={(message) => {
            setAdding(false);
            setDocsRefreshKey((k) => k + 1);
            flash(message ?? m.fileAdded);
          }}
        />
      )}
      {page === "home" && toast && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-lg">
          <Check size={16} strokeWidth={3} className="text-emerald-500" /> {toast}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Home — shared Spotify-tile design                                  */
/* ------------------------------------------------------------------ */

const homeFonts = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap');
  .font-display { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }
  .font-body { font-family: 'Inter', system-ui, sans-serif; }
`;

function ExamCard({ exam, onOpen }: { exam: Exam; onOpen: (e: Exam) => void }) {
  const { m } = useHomeLocale();
  return (
    <Link
      href={examPath(exam.id)}
      onClick={() => {
        saveCurrentExamId(exam.id);
        onOpen(exam);
      }}
      title={m.examFullName(exam.id)}
      aria-label={`${m.examFullName(exam.id)} — ${exam.code}`}
      className="group relative h-[9.5rem] w-full overflow-hidden rounded-lg p-4 text-left text-white shadow-md outline-none transition duration-200 hover:scale-[1.03] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white/40 sm:h-[10.5rem]"
      style={{ backgroundColor: exam.to }}
    >
      <div className="relative z-10 max-w-[62%]">
        <h3 className="font-display text-lg font-extrabold leading-tight tracking-tight sm:text-xl">
          {m.examName(exam.id, exam.name)}
        </h3>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-5 -right-5 h-[5.5rem] w-[5.5rem] rotate-[24deg] rounded-md shadow-[0_10px_24px_rgba(0,0,0,.35)] transition duration-200 group-hover:rotate-[20deg] group-hover:scale-105 sm:h-[6.25rem] sm:w-[6.25rem]"
        style={{ backgroundImage: `linear-gradient(145deg, ${exam.from} 0%, ${exam.to} 100%)` }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-md bg-white/95">
          <span className="-rotate-[24deg] font-display text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            {exam.code}
          </span>
        </div>
      </div>
    </Link>
  );
}

function HomeStreakBadge() {
  const mounted = useClientMounted();
  const clerkEnabled = useClerkEnabled();
  const streakData = useStudyStreak(mounted && clerkEnabled);

  if (!mounted || !clerkEnabled || streakData.streakDays <= 0) return null;

  return (
    <SignedIn>
      <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200/70">
        <Flame className="h-4 w-4 text-amber-500" fill="currentColor" strokeWidth={1.5} />
        <span className="text-sm font-bold text-amber-600">{streakData.streakDays}</span>
      </div>
    </SignedIn>
  );
}

function Home({ onOpen, onAdd }: { onOpen: (e: Exam) => void; onAdd: () => void }) {
  const { m } = useHomeLocale();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXAMS;
    return EXAMS.filter(
      (e) =>
        e.code.toLowerCase().includes(q)
        || e.name.toLowerCase().includes(q)
        || e.tags.some((t) => t.includes(q)),
    );
  }, [query]);

  return (
    <div className="min-h-screen w-full bg-[#F6F7F9] font-body text-slate-900 antialiased">
      <style>{homeFonts}</style>

      <header className="sticky top-0 z-20 bg-[#F6F7F9]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <DrNoteLogo showWordmark forceWordmark />
          <div className="flex items-center gap-3">
            <CreditsBadge />
            <HomeStreakBadge />
            <Link
              href={PRICING_PATH}
              className="hidden text-sm font-bold text-slate-600 transition-colors hover:text-slate-900 sm:inline-flex"
            >
              Pricing
            </Link>
            <UserAuthControls compact />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28">
        <section className="flex flex-col items-center pt-16 text-center sm:pt-24">
          <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            {m.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              {m.heroTitle2}
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-500">
            {m.heroSubtitle}
          </p>

          <div className="group mt-9 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:shadow-md">
            <Search className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-slate-900" strokeWidth={2.25} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={m.searchExamsPlaceholder}
              aria-label={m.searchExamsPlaceholder}
              className="w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
            <kbd className="hidden shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-400 sm:flex">
              <Command className="h-3 w-3" strokeWidth={2.5} />K
            </kbd>
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
            {query.trim() && results.length > 0 && (
              <p className="mb-3 text-sm font-semibold text-slate-500">
                {m.matchCount(results.length)}
              </p>
            )}

            {results.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {results.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} onOpen={onOpen} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center sm:py-20">
                <p className="font-display text-2xl font-bold text-slate-900">{m.noExamFound}</p>
                <p className="mt-1 text-slate-500">{m.noExamHint}</p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {m.showAllExams}
                </button>
              </div>
            )}
        </section>
      </main>

      <button
        type="button"
        onClick={onAdd}
        className="group fixed bottom-7 right-7 z-30 flex items-center gap-0 rounded-2xl bg-slate-900 py-4 pl-4 pr-4 text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-slate-900/20"
        aria-label={m.addExam}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-slate-900">
          <Plus className="h-4 w-4" strokeWidth={3} />
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-[120px] group-hover:opacity-100">
          {m.addExam}
        </span>
      </button>
    </div>
  );
}

function AddFile({
  examId,
  onClose,
  onDone,
}: {
  examId?: string;
  onClose: () => void;
  onDone: (message?: string) => void;
}) {
  const { m } = useHomeLocale();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [customExamName, setCustomExamName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clerkEnabled = useClerkEnabled();
  const { refresh: refreshCredits } = useMedGeniusCreditsContext();

  const pickFile = (picked: File | null) => {
    setFile(picked);
    if (picked && !name.trim()) setName(picked.name.replace(/\.[^.]+$/, ""));
  };

  const customExamId = customExamName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const uploadExamId = examId ?? (customExamId ? `custom:${customExamId}` : "");
  const canUpload = Boolean(name.trim() && uploadExamId && !uploading);

  const handleUpload = async () => {
    if (!canUpload) return;
    if (!file) {
      inputRef.current?.click();
      return;
    }
    if (!clerkEnabled) {
      onDone(m.fileAdded);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const token = await getClerkToken();
      const result = await uploadDocument(token, {
        file,
        name: name.trim(),
        examId: uploadExamId,
      });
      onDone(
        result.reprocessed
          ? m.reprocessStarted
          : result.duplicate
            ? m.fileAlreadyProcessed
            : m.uploadCompleteProcessing
      );
      void refreshCredits();
    } catch (err) {
      const message =
        err instanceof MedGeniusApiError
          ? err.message
          : sanitizeUserError(err instanceof Error ? err.message : "Upload failed", "upload");
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dn-modal-wrap" onClick={onClose}>
      <div className="dn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dn-modal-head"><b>{examId ? m.addFile : "Add exam files"}</b><button className="dn-fs-close" onClick={onClose} aria-label={m.close}><X size={18} strokeWidth={2.8} /></button></div>
        {!examId && (
          <input
            className="dn-modal-input"
            value={customExamName}
            onChange={(e) => setCustomExamName(e.target.value)}
            placeholder="Exam name (e.g. MRCP Part 1)"
            aria-label="Exam name"
          />
        )}
        <button
          type="button"
          className={`dn-drop${dragging ? " dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          <Upload size={36} color="currentColor" strokeWidth={2.2} />
          <span>{file ? file.name : "Drop any file here or tap to browse"}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(e) => {
            pickFile(e.target.files?.[0] ?? null);
          }}
        />
        <input className="dn-modal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={m.fileNamePlaceholder} />
        {error && <p className="px-1 text-sm font-semibold text-red-500">{error}</p>}
        <Chunky bg={C.green} shadow={C.greenDark} full disabled={!canUpload} onClick={handleUpload}>
          <span className="dn-inline"><Upload size={16} strokeWidth={2.6} /> {uploading ? m.uploading : file ? m.uploadFile : m.chooseFile}</span>
        </Chunky>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exam page                                                          */
/* ------------------------------------------------------------------ */
function ExamPage(props: {
  exam: Exam; filter: Filter; setFilter: (f: Filter) => void; query: string; setQuery: (s: string) => void;
  voted: Set<string>; setVoted: (s: Set<string>) => void; saved: Set<string>; toggleSaved: (id: string) => void;
  picked: Set<string>; setPicked: (s: Set<string>) => void; onBack: () => void; onOpen: (f: ExamFile) => void;
  onAdd: () => void; flash: (m: string) => void;
  docsRefreshKey: number; useLiveData: boolean;
}) {
  const { exam, filter, setFilter, query, setQuery, voted, setVoted, saved, toggleSaved, picked, setPicked, onBack, onOpen, onAdd, flash, docsRefreshKey, useLiveData } = props;
  const { files: liveFiles, loading: filesLoading } = useExamDocuments(exam.id, docsRefreshKey);
  const { m } = useHomeLocale();
  const clerkEnabled = useClerkEnabled();
  const [semanticDocIds, setSemanticDocIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query.trim();
    if (!useLiveData || !clerkEnabled || q.length < 3) {
      setSemanticDocIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        if (!token) return;
        const { questions } = await searchQuestions(token, q);
        if (cancelled) return;
        setSemanticDocIds(new Set(questions.map((item) => item.documentId)));
      } catch {
        if (!cancelled) setSemanticDocIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, useLiveData, clerkEnabled]);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = useLiveData ? liveFiles : FILES;
    let list = source.filter((f) => {
      if (!q) return true;
      const textMatch =
        f.name.toLowerCase().includes(q) || f.author.toLowerCase().includes(q);
      const semanticMatch = f.documentId ? semanticDocIds.has(f.documentId) : false;
      return textMatch || semanticMatch;
    });
    if (filter === "bookmarked") list = list.filter((f) => saved.has(f.id));
    const per: Exclude<Filter, "bookmarked"> = filter === "bookmarked" ? "all" : filter;
    return list.sort((a, b) => b.votes[per] + (voted.has(b.id) ? 1 : 0) - (a.votes[per] + (voted.has(a.id) ? 1 : 0)));
  }, [query, filter, voted, saved, liveFiles, useLiveData, semanticDocIds]);

  const toggle = (set: Set<string>, id: string, fn: (s: Set<string>) => void) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); fn(n); };
  const allPicked = picked.size > 0 && picked.size === ranked.length;
  const per: Exclude<Filter, "bookmarked"> = filter === "bookmarked" ? "all" : filter;

  return (
    <main className="dn-main dn-exam-main">
      <section className="dn-hero dn-hero-compact">
        <div className="dn-hero-row">
          <span className="dn-hero-ic" style={{ background: `linear-gradient(135deg, ${exam.from} 0%, ${exam.to} 100%)` }} aria-hidden>
            <span className="dn-hero-code">{exam.code}</span>
          </span>
          <h1 className="dn-hero-title">{m.examName(exam.id, exam.name)}</h1>
        </div>
        <div className="dn-search">
          <Search size={20} color={C.faint} strokeWidth={2.4} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={m.searchFilesPlaceholder} aria-label={m.searchFilesPlaceholder} />
          {query && <button type="button" className="dn-search-clear" onClick={() => setQuery("")}><X size={16} strokeWidth={2.6} /></button>}
        </div>
      </section>

      <div className="dn-filterbar">
        <div className="dn-periods">
          {FILTER_KEYS.map((key) => (
            <button key={key} type="button" onClick={() => setFilter(key)}
              className={`dn-period${key === "bookmarked" ? " dn-period-icon" : ""}`}
              aria-label={m.filterLabel(key)}
              style={{ color: filter === key ? "#fff" : C.sub, background: filter === key ? (key === "bookmarked" ? C.blue : C.green) : "transparent", boxShadow: filter === key ? `0 2px 0 ${key === "bookmarked" ? C.blueDark : C.greenDark}` : "none" }}>
              {key === "bookmarked" ? (
                <BkIcon saved={filter === key} size={13} light={filter === key} />
              ) : m.filterLabel(key)}
            </button>
          ))}
        </div>
        <button type="button" className="dn-selectall" onClick={() => setPicked(allPicked ? new Set() : new Set(ranked.map((f) => f.id)))}>
          <span className="dn-check" style={{ borderColor: allPicked ? C.green : C.line, background: allPicked ? C.green : "#fff" }}>{allPicked && <Check size={11} color="#fff" strokeWidth={3.5} />}</span>{m.selectAll}
        </button>
      </div>

      <ul className="dn-list">
        {filesLoading && useLiveData && ranked.length === 0 && (
          <li className="dn-empty"><p>{m.loadingYourFiles}</p></li>
        )}
        {ranked.map((f) => {
          const isVoted = voted.has(f.id), isSaved = saved.has(f.id), isPicked = picked.has(f.id);
          const count = f.votes[per] + (isVoted ? 1 : 0);
          return (
            <li key={f.id} className="dn-row" style={{ borderColor: isPicked ? C.blue : isSaved ? "#CFE9FF" : C.line, background: isPicked ? "#F0FAFF" : "#fff" }}>
              <button type="button" className="dn-upvote" onClick={() => toggle(voted, f.id, setVoted)} style={{ borderColor: isVoted ? C.green : C.line, background: isVoted ? "#EAFBD9" : "#fff", color: isVoted ? C.greenDark : C.sub }} aria-label={m.upvote}>
                <ChevronUp size={19} strokeWidth={3} /><b>{count.toLocaleString()}</b>
              </button>
              <button type="button" className="dn-file" onClick={() => onOpen(f)}>
                <LetterTile name={f.name} color={f.color} />
                <span className="dn-file-text">
                  <span className="dn-file-name">{f.name}</span>
                  <span className="dn-file-meta">{f.author} · {m.pagesCount(f.pages)}</span>
                </span>
              </button>
              <div className="dn-actions">
                <button type="button" className="dn-icon-btn" onClick={() => flash(m.shareCopied)} title={m.share} aria-label={m.share}><Share2 size={16} strokeWidth={2.4} /></button>
                <button type="button" className={`dn-icon-btn dn-bk${isSaved ? " on" : ""}`} onClick={() => { toggleSaved(f.id); flash(isSaved ? m.removedBookmark : m.bookmarked); }} title={isSaved ? m.removeBookmark : m.bookmark} aria-label={isSaved ? m.removeBookmark : m.bookmark}>
                  <BkIcon saved={isSaved} size={15} />
                </button>
                <button type="button" className="dn-icon-btn dn-hide-sm" onClick={() => flash(m.linkCopied)} title={m.copyLink} aria-label={m.copyLink}><Link2 size={16} strokeWidth={2.4} /></button>
              </div>
              <button type="button" className={`dn-row-select${isPicked ? " on" : ""}`} onClick={() => toggle(picked, f.id, setPicked)} aria-pressed={isPicked} aria-label={isPicked ? m.deselectFile : m.selectFile}>
                <span className="dn-check" style={{ borderColor: isPicked ? C.blue : C.line, background: isPicked ? C.blue : "#fff" }}>
                  {isPicked && <Check size={10} color="#fff" strokeWidth={3.5} />}
                </span>
                <span className="dn-row-select-label">{isPicked ? m.selected : m.select}</span>
              </button>
            </li>
          );
        })}
        {ranked.length === 0 && !filesLoading && (
          <div className="dn-empty">
            <Search size={26} color={C.faint} />
            <p>
              {useLiveData
                ? filter === "bookmarked"
                  ? m.noBookmarkedFiles
                  : m.noFilesYetUpload
                : filter === "bookmarked"
                  ? m.noBookmarkedFiles
                  : m.noFilesMatch(query)}
            </p>
          </div>
        )}
      </ul>

      {picked.size > 0 && (
        <div className="dn-bulk">
          <span>{m.bulkSelected(picked.size)}</span>
          <div className="dn-bulk-actions">
            <button className="dn-bulk-clear" onClick={() => setPicked(new Set())}>{m.clear}</button>
            <Chunky bg={C.green} shadow={C.greenDark} onClick={() => { const first = ranked.find((f) => picked.has(f.id)); if (first) onOpen(first); }}>
              <span className="dn-inline"><Play size={16} fill="#fff" strokeWidth={2.6} /> {m.studySelected}</span>
            </Chunky>
          </div>
        </div>
      )}

      <button type="button" className="dn-fab" onClick={onAdd} title={m.addFile} aria-label={m.addFile} style={{ background: C.green, boxShadow: `0 4px 0 ${C.greenDark}` }}>
        <Plus size={26} color="#fff" strokeWidth={2.8} />
      </button>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Study (full screen)                                                */
/* ------------------------------------------------------------------ */
function Study({ file, exam, saved, onToggleSave, onClose, flash }: {
  file: ExamFile; exam: Exam | null; saved: boolean; onToggleSave: () => void; onClose: () => void; flash: (m: string) => void;
}) {
  const { m, content } = useHomeLocale();
  const clerkEnabled = useClerkEnabled();
  const live = useDocumentStudy(clerkEnabled && file.documentId ? file.documentId : undefined);
  const useLive = Boolean(clerkEnabled && file.documentId);
  const questions: HomeQuestion[] = useLive ? live.questions : content.questions;
  const readPages: HomeReadPage[] = useLive ? live.readPages : content.readPages;
  const flashcards: HomeFlashCard[] = useLive ? live.flashcards : content.cards;
  const summaries: HomeSummary[] = useLive ? live.summaries : [];
  const processing = useLive && live.status && live.status !== "completed" && live.status !== "failed";
  const analytics = useHomeAnalytics(useLive);
  const backendSessionRef = useRef<string | null>(null);
  const [srsQueue, setSrsQueue] = useState<HomeQuestion[]>([]);
  const documentContext = useMemo(
    () =>
      readPages
        .map((p) => `${p.h}\n${p.body.join("\n")}`)
        .join("\n\n")
        .slice(0, 12000),
    [readPages]
  );

  const [tab, setTab] = useState<Tab>("Read");
  const [query, setQuery] = useState("");
  const [reprocessing, setReprocessing] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleReprocess = useCallback(async () => {
    if (!file.documentId || reprocessing) return;
    setReprocessing(true);
    try {
      const token = await getClerkToken();
      if (!token) return;
      await reprocessDocumentApi(token, file.documentId);
      flash(m.reprocessStarted);
    } catch (err) {
      flash(sanitizeUserError(err instanceof Error ? err.message : "Reprocess failed", "processing"));
    } finally {
      setReprocessing(false);
    }
  }, [file.documentId, reprocessing, flash, m.reprocessStarted]);

  const handleExtractMcqs = useCallback(async () => {
    if (!file.documentId || extracting || reprocessing) return;
    setExtracting(true);
    try {
      const token = await getClerkToken();
      if (!token) return;
      await extractDocumentQuestions(token, file.documentId);
      flash(m.extractMcqsStarted);
    } catch (err) {
      flash(sanitizeUserError(err instanceof Error ? err.message : "Extraction failed", "ai"));
    } finally {
      setExtracting(false);
    }
  }, [file.documentId, extracting, reprocessing, flash, m.extractMcqsStarted]);

  const quizEmptyMessage = useMemo(() => {
    if (!useLive) return undefined;
    if (live.processingError) return live.processingError;
    return m.noQuestionsExtracted;
  }, [useLive, live.processingError, m.noQuestionsExtracted]);

  // shared quiz state (Quiz + Review + Custom)
  const [answers, setAnswers] = useState<Record<number, number>>({ 0: 0, 2: 1, 4: 3 });
  const [flagged, setFlagged] = useState<Set<number>>(new Set([5]));
  const [perPage, setPerPage] = useState(1);
  const [reveal, setReveal] = useState<Reveal>("immediate");
  const [sessions, setSessions] = useState<QuizSession[]>(() => loadSessions(file.id, questions.length));
  const activeSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!useLive) {
      setSrsQueue([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        if (!token) return;
        const { questions: due } = await fetchDueSrs(token);
        if (cancelled) return;
        setSrsQueue(
          due.slice(0, 20).map((q) => ({
            id: q.id,
            stem: q.cleanedText?.trim() || q.originalText,
            options: q.options.length >= 2 ? q.options : ["A", "B", "C", "D"],
            correct:
              q.correctAnswer !== null &&
              q.correctAnswer >= 0 &&
              q.correctAnswer < q.options.length
                ? q.correctAnswer
                : 0,
            explain: q.explanation?.trim() || "",
          }))
        );
      } catch {
        if (!cancelled) setSrsQueue([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useLive, analytics.srsDue]);

  useEffect(() => {
    if (!useLive || !file.documentId) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        if (!token) return;
        const created = await createStudySession(token, {
          mode: "quiz",
          title: file.name,
          documentId: file.documentId,
          examId: exam?.id,
        });
        if (!cancelled) backendSessionRef.current = created.sessionId;
      } catch {
        /* local sessions still work */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useLive, file.documentId, file.name, exam?.id]);

  useEffect(() => {
    localStorage.setItem(`dn-sessions-${file.id}`, JSON.stringify(sessions));
  }, [sessions, file.id]);

  useEffect(() => {
    const answered = Object.keys(answers).length;
    if (answered === 0) return;

    setSessions((prev) => {
      const id = activeSessionRef.current;
      const idx = id ? prev.findIndex((s) => s.id === id) : prev.findIndex((s) => s.status === "in_progress" && s.source === "quiz");
      const elapsed = idx >= 0 ? Math.round((Date.now() - prev[idx].startedAt) / 1000) : 0;
      const complete = answered >= questions.length;
      const flaggedArr = [...flagged];

      if (idx >= 0) {
        activeSessionRef.current = prev[idx].id;
        return prev.map((s, i) => i === idx ? {
          ...s,
          answers: { ...answers },
          flagged: flaggedArr,
          status: complete ? "completed" : "in_progress",
          endedAt: complete ? Date.now() : null,
          durationSec: complete ? elapsed : elapsed,
        } : s);
      }

      const created: QuizSession = {
        id: `${file.id}-${Date.now()}`,
        source: "quiz",
        title: "Quiz practice",
        startedAt: Date.now(),
        endedAt: complete ? Date.now() : null,
        durationSec: complete ? 0 : 0,
        answers: { ...answers },
        flagged: flaggedArr,
        totalQuestions: questions.length,
        status: complete ? "completed" : "in_progress",
      };
      activeSessionRef.current = created.id;
      return [created, ...prev];
    });
  }, [answers, flagged, file.id, questions.length]);

  const resumeSession = useCallback((s: QuizSession) => {
    setAnswers(s.answers);
    setFlagged(new Set(s.flagged));
    activeSessionRef.current = s.id;
    setTab("Quiz");
    flash(m.sessionResumed);
  }, [flash, m.sessionResumed]);

  const repeatSession = useCallback((s: QuizSession) => {
    const created: QuizSession = {
      id: `${file.id}-${Date.now()}`,
      source: s.source,
      title: s.title,
      startedAt: Date.now(),
      endedAt: null,
      durationSec: null,
      answers: {},
      flagged: [],
      totalQuestions: s.totalQuestions,
      status: "in_progress",
    };
    activeSessionRef.current = created.id;
    setSessions((prev) => [created, ...prev]);
    setAnswers({});
    setFlagged(new Set());
    setTab("Quiz");
    flash(m.sessionStarted);
  }, [file.id, flash, m.sessionStarted]);

  const startCustomSession = useCallback((count: number) => {
    const created: QuizSession = {
      id: `${file.id}-custom-${Date.now()}`,
      source: "custom",
      title: `Custom · ${count} questions`,
      startedAt: Date.now(),
      endedAt: null,
      durationSec: null,
      answers: {},
      flagged: [],
      totalQuestions: count,
      status: "in_progress",
    };
    activeSessionRef.current = created.id;
    setSessions((prev) => [created, ...prev]);
    setAnswers({});
    setFlagged(new Set());
    setTab("Quiz");
    flash(m.customSessionStarted);
  }, [file.id, flash, m.customSessionStarted]);

  // AI chat
  const [chatOpen, setChatOpen] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: content.chatGreeting }]);
  useEffect(() => {
    setMsgs((prev) => (prev.length === 1 && prev[0]?.role === "ai" ? [{ role: "ai", text: content.chatGreeting }] : prev));
  }, [content.chatGreeting]);
  const openChat = (q?: string) => { setQuote(q ?? null); setChatOpen(true); };

  const fsRef = useRef<HTMLDivElement>(null);
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    const sync = () => setImmersive(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = fsRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      setImmersive((v) => !v);
    }
  }, []);

  // highlight-to-ask
  const [ask, setAsk] = useState<{ x: number; y: number; text: string } | null>(null);
  const onBodyMouseUp = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (text.length > 2 && sel && sel.rangeCount) {
      const r = sel.getRangeAt(0).getBoundingClientRect();
      setAsk({ x: r.left + r.width / 2, y: r.top - 6, text });
    } else setAsk(null);
  };

  const searchable = tab === "Quiz" || tab === "Flashcards";

  const subLabel = exam ? `${exam.code} · ${file.author}` : `@${file.author} · ${m.pgShort(file.pages)}`;

  return (
    <div className={`dn-fs${immersive ? " dn-fs-immersive" : ""}`} ref={fsRef}>
      <header className="dn-fs-head">
        <div className="dn-fs-row1">
          <button className="dn-fs-close" onClick={onClose} aria-label={m.close}><X size={18} strokeWidth={2.8} /></button>
          <div className="dn-fs-title-wrap">
            <span className="dn-fs-dot" style={{ background: file.color }} aria-hidden />
            <h1 className="dn-fs-title">
              <span className="dn-fs-title-main">{file.name}</span>
              <span className="dn-fs-sub">{subLabel}</span>
            </h1>
          </div>
          <CreditsBadge className="shrink-0" />
          <button type="button" className={`dn-fs-bk${saved ? " on" : ""}`} onClick={onToggleSave} title={saved ? m.bookmarked : m.bookmark} aria-label={saved ? m.removeBookmark : m.bookmark}>
            <BkIcon saved={saved} size={16} />
          </button>
          <button type="button" className="dn-fs-fs" onClick={() => void toggleFullscreen()} title={immersive ? m.exitFullScreen : m.fullScreen} aria-label={immersive ? m.exitFullScreen : m.fullScreen} aria-pressed={immersive}>
            {immersive ? <Minimize2 size={16} strokeWidth={2.4} /> : <Maximize2 size={16} strokeWidth={2.4} />}
          </button>
        </div>
        <div className="dn-fs-row2">
          <div className="dn-fs-search">
            <Search size={16} color={C.faint} strokeWidth={2.4} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchable ? m.searchTab(m.tabLabelLower(tab)) : m.searchThisFile} aria-label={m.searchThisFile} />
            {query && <button className="dn-fs-clear" onClick={() => setQuery("")}><X size={14} strokeWidth={2.8} /></button>}
          </div>
        </div>
        <nav className="dn-fs-tabs">
          {TABS.map(({ key, icon: Icon }) => (
            <button key={key} className="dn-fs-tab" onClick={() => { setTab(key); setChatOpen(false); }} style={{ color: tab === key && !chatOpen ? C.blueDark : C.faint, background: tab === key && !chatOpen ? "#DDF4FF" : "transparent" }}>
              <Icon size={16} strokeWidth={2.4} /><span>{m.tabLabel(key)}</span>
            </button>
          ))}
          <button className="dn-fs-tab" onClick={() => openChat()} style={{ color: chatOpen ? C.purpleDark : C.faint, background: chatOpen ? "#F3E8FF" : "transparent" }}>
            <Sparkles size={16} strokeWidth={2.4} /><span>{m.ask}</span>
          </button>
        </nav>
      </header>

      <div className="dn-fs-body" onMouseUp={onBodyMouseUp}>
        {processing && (
          <div className="dn-empty" style={{ padding: "24px 16px" }}>
            <Sparkles size={26} color={C.purple} />
            <p>{m.preparingStudyMaterials}{live.progress > 0 ? ` ${live.progress}%` : ""}</p>
          </div>
        )}
        {tab === "Read" && (
          <ReadFull
            key={file.id}
            file={file}
            pages={readPages}
            rawMarkdown={useLive ? live.rawMarkdown : null}
            canReprocess={useLive && Boolean(file.documentId)}
            reprocessing={reprocessing}
            onReprocess={handleReprocess}
          />
        )}
        {tab === "Quiz" && <QuizList query={query} questions={questions} emptyWhenNoQuery={quizEmptyMessage} canExtractMcqs={useLive && Boolean(file.documentId)} extractingMcqs={extracting} onExtractMcqs={handleExtractMcqs} answers={answers} setAnswers={setAnswers} flagged={flagged} setFlagged={setFlagged} perPage={perPage} setPerPage={setPerPage} reveal={reveal} setReveal={setReveal} onAsk={openChat} onAnswer={async (idx, selected) => {
          const q = questions[idx];
          const sessionId = backendSessionRef.current;
          if (!q?.id || !sessionId || !useLive) return;
          try {
            const token = await getClerkToken();
            if (!token) return;
            await recordAttempt(token, sessionId, {
              questionId: q.id,
              selectedAnswer: selected,
            });
          } catch { /* ignore */ }
        }} />}
        {tab === "Review" && <ReviewPane questions={questions} answers={answers} flagged={flagged} setFlagged={setFlagged} sessions={sessions} onResume={resumeSession} onRepeat={repeatSession} onAsk={openChat} analytics={analytics} srsQueue={srsQueue} clerkEnabled={clerkEnabled} />}
        {tab === "Summary" && <SummaryNotion file={file} summaries={summaries} />}
        {tab === "Flashcards" && <FlashcardsQuizlet query={query} cards={flashcards} />}
        {tab === "Custom" && (
          <>
            {useLive && <CollectionsPanel documentId={file.documentId} />}
            <CustomPane reveal={reveal} setReveal={setReveal} onStart={startCustomSession} flash={flash} />
          </>
        )}
      </div>

      {/* iOS-style bottom tab bar (mobile / iPad) */}
      <nav className="dn-tabbar">
        <div className="dn-tabbar-inner">
          {TABS.map(({ key, icon: Icon }) => (
            <button key={key} className={`dn-tabbar-btn${tab === key && !chatOpen ? " on" : ""}`} onClick={() => { setTab(key); setChatOpen(false); }} style={{ color: tab === key && !chatOpen ? C.blue : C.faint }}>
              <Icon size={22} strokeWidth={2.3} /><span>{m.tabLabel(key)}</span>
            </button>
          ))}
          <button className={`dn-tabbar-btn dn-tabbar-ask${chatOpen ? " on" : ""}`} onClick={() => openChat()} style={{ color: chatOpen ? C.purpleDark : C.faint }}>
            <Sparkles size={22} strokeWidth={2.3} /><span>{m.ask}</span>
          </button>
        </div>
      </nav>

      {/* highlight-to-ask popover */}
      {ask && (
        <button className="dn-ask-pop" style={{ left: ask.x, top: ask.y }} onMouseDown={(e) => e.preventDefault()}
          onClick={() => { openChat(ask.text); setAsk(null); window.getSelection()?.removeAllRanges(); }}>
          <Sparkles size={14} strokeWidth={2.6} /> {m.askAi}
        </button>
      )}

      {chatOpen && <ChatPanel documentId={file.documentId} documentContext={documentContext} quote={quote} clearQuote={() => setQuote(null)} msgs={msgs} setMsgs={setMsgs} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

/* ---- AI chat panel ---- */
function ChatPanel({ documentId, documentContext, quote, clearQuote, msgs, setMsgs, onClose }: {
  documentId?: string; documentContext?: string; quote: string | null; clearQuote: () => void; msgs: Msg[]; setMsgs: Dispatch<SetStateAction<Msg[]>>; onClose: () => void;
}) {
  const { m, content, locale } = useHomeLocale();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const endRef = useRef<HTMLDivElement>(null);
  const clerkEnabled = useClerkEnabled();
  const { refresh: refreshCredits } = useMedGeniusCreditsContext();
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const q = draft.trim();
    if ((!q && !quote) || sending) return;
    const full = quote ? `"${quote}" — ${q || content.chatExplainThis}` : q;
    setMsgs((prev) => [...prev, { role: "user", text: full }]);
    setDraft("");
    clearQuote();
    setSending(true);

    try {
      const token = clerkEnabled ? await getClerkToken() : null;
      const result = await askMedGeniusAi(
        token,
        {
          message: full,
          conversationId,
          contextType: documentId ? "document" : "general",
          contextId: documentId,
          documentContext: documentContext || undefined,
          language: locale === "ar" ? "ar" : "en",
          mode: "explain",
        },
        () => content.chatMockReply
      );
      setConversationId(result.conversationId || conversationId);
      setMsgs((prev) => [...prev, { role: "ai", text: result.reply }]);
      if (result.fromApi) {
        void refreshCredits();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="dn-chat">
      <div className="dn-chat-head">
        <span className="dn-chat-brand">
          <DrNoteLogo showWordmark forceWordmark size="sm" />
          <span className="dn-chat-head-div" aria-hidden>·</span>
          <span className="dn-inline"><Sparkles size={18} color={C.purple} strokeWidth={2.4} /><b>{m.askAi}</b></span>
        </span>
        <button className="dn-fs-close" onClick={onClose} aria-label={m.closeChat}><X size={18} strokeWidth={2.8} /></button>
      </div>
      <div className="dn-chat-body">
        {msgs.map((msg, i) => <div key={i} className={`dn-msg ${msg.role}`}>{msg.text}</div>)}
        <div ref={endRef} />
      </div>
      {quote && <div className="dn-chat-quote"><span>{quote.length > 90 ? quote.slice(0, 90) + "…" : quote}</span><button onClick={clearQuote}><X size={13} strokeWidth={3} /></button></div>}
      <div className="dn-chat-input">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={m.askFollowUp} />
        <button className="dn-chat-send" onClick={send} style={{ background: C.purple }} aria-label={m.send}><Send size={16} color="#fff" strokeWidth={2.4} /></button>
      </div>
    </aside>
  );
}

/* ---- Read ---- */
type ReadView = "pdf" | "sections" | "source";

function fileHasPdfOriginal(file: ExamFile): boolean {
  if (!file.documentId) return false;
  if (file.mimeType === "application/pdf") return true;
  if (file.originalFilename?.toLowerCase().endsWith(".pdf")) return true;
  return true;
}

function ReadToolbar({
  view,
  setView,
  showPdf,
  showSource,
  m,
}: {
  view: ReadView;
  setView: (v: ReadView) => void;
  showPdf: boolean;
  showSource: boolean;
  m: ReturnType<typeof useHomeLocale>["m"];
}) {
  return (
    <div className="dn-read-toolbar">
      {showPdf && (
        <button
          type="button"
          className={`dn-read-view${view === "pdf" ? " on" : ""}`}
          aria-current={view === "pdf" ? "true" : undefined}
          onClick={() => setView("pdf")}
        >
          {m.readPdf}
        </button>
      )}
      <button
        type="button"
        className={`dn-read-view${view === "sections" ? " on" : ""}`}
        aria-current={view === "sections" ? "true" : undefined}
        onClick={() => setView("sections")}
      >
        {m.readSections}
      </button>
      {showSource && (
        <button
          type="button"
          className={`dn-read-view${view === "source" ? " on" : ""}`}
          aria-current={view === "source" ? "true" : undefined}
          onClick={() => setView("source")}
        >
          {m.readSource}
        </button>
      )}
    </div>
  );
}

function ReadFull({
  file,
  pages,
  rawMarkdown,
  canReprocess,
  reprocessing,
  onReprocess,
}: {
  file: ExamFile;
  pages: HomeReadPage[];
  rawMarkdown?: string | null;
  canReprocess?: boolean;
  reprocessing?: boolean;
  onReprocess?: () => void;
}) {
  const { m } = useHomeLocale();
  const [i, setI] = useState(0);
  const showPdf = fileHasPdfOriginal(file);
  const showSource = Boolean(rawMarkdown);
  const corruptSource = Boolean(rawMarkdown && isCorruptParsedMarkdown(rawMarkdown));
  const [view, setView] = useState<ReadView>(() => (showPdf ? "pdf" : "sections"));

  useEffect(() => {
    setI(0);
    setView(showPdf ? "pdf" : "sections");
  }, [file.id, pages.length, showPdf]);

  const corruptBanner =
    corruptSource && canReprocess && onReprocess ? (
      <div className="dn-read-banner">
        <p style={{ margin: 0 }}>{m.parsedSourceCorrupt}</p>
        <button
          type="button"
          className="dn-btn primary"
          style={{ marginTop: 10 }}
          onClick={() => void onReprocess()}
          disabled={reprocessing}
        >
          {reprocessing ? m.reprocessingDocument : m.reprocessDocument}
        </button>
      </div>
    ) : corruptSource ? (
      <div className="dn-read-banner"><p style={{ margin: 0 }}>{m.parsedSourceCorrupt}</p></div>
    ) : null;

  if (view === "pdf" && file.documentId && showPdf) {
    return (
      <div className="dn-read-fs">
        {corruptBanner}
        <ReadToolbar view={view} setView={setView} showPdf={showPdf} showSource={showSource} m={m} />
        <DocumentPdfViewer documentId={file.documentId} pageCount={file.pages} />
      </div>
    );
  }

  if (pages.length === 0 && !rawMarkdown && !showPdf) {
    return (
      <div className="dn-read-fs">
        <div className="dn-empty" style={{ paddingTop: 48 }}><BookOpen size={26} color={C.faint} /><p>{m.readingContentPending}</p></div>
      </div>
    );
  }

  if (view === "source" && rawMarkdown) {
    return (
      <div className="dn-read-fs">
        {corruptBanner}
        <ReadToolbar view={view} setView={setView} showPdf={showPdf} showSource={showSource} m={m} />
        <div className="dn-read-scroll">
          <pre className="dn-read-source">{rawMarkdown}</pre>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="dn-read-fs">
        {corruptBanner}
        <ReadToolbar view={view} setView={setView} showPdf={showPdf} showSource={showSource} m={m} />
        <div className="dn-empty" style={{ paddingTop: 48 }}><BookOpen size={26} color={C.faint} /><p>{m.readingContentPending}</p></div>
      </div>
    );
  }

  const p = pages[i] ?? pages[0];
  const pct = ((i + 1) / pages.length) * 100;
  return (
    <div className="dn-read-fs">
      {corruptBanner}
      <ReadToolbar view={view} setView={setView} showPdf={showPdf} showSource={showSource} m={m} />
      <div className="dn-progress"><span style={{ width: `${pct}%`, background: C.green }} /></div>
      <div className="dn-read-scroll">
        <article className="dn-read-col">
          <h1>{p.h}</h1>
          <p className="dn-read-lead">{p.body[0]}</p>
          <div className="dn-callout" style={{ borderColor: file.color }}><b>{m.keyPoint}</b><p>{p.key}</p></div>
          {p.body.slice(1).map((t, k) => <p key={k}>{t}</p>)}
        </article>
      </div>
      <div className="dn-read-foot">
        <button className="dn-foot-back" disabled={i === 0} onClick={() => setI((v) => v - 1)} aria-label={m.back}>
          <ChevronLeft size={16} strokeWidth={2.8} /><span className="dn-foot-back-label">{m.back}</span>
        </button>
        <span className="dn-foot-count">
          <span className="dn-foot-count-full">{m.pageOf(i + 1, pages.length)}</span>
          <span className="dn-foot-count-short">{i + 1}/{pages.length}</span>
        </span>
        <Chunky sm bg={C.green} shadow={C.greenDark} disabled={i === pages.length - 1} onClick={() => setI((v) => v + 1)}>
          <span className="dn-inline"><span className="dn-foot-next-label">{m.continueLabel}</span><ChevronRight size={14} strokeWidth={2.8} /></span>
        </Chunky>
      </div>
    </div>
  );
}

/* ---- Quiz ---- */
function QuizList({ query, questions, emptyWhenNoQuery, canExtractMcqs, extractingMcqs, onExtractMcqs, answers, setAnswers, flagged, setFlagged, perPage, setPerPage, reveal, setReveal, onAsk, onAnswer }: {
  query: string; questions: HomeQuestion[]; emptyWhenNoQuery?: string; canExtractMcqs?: boolean; extractingMcqs?: boolean; onExtractMcqs?: () => void;
  answers: Record<number, number>; setAnswers: Dispatch<SetStateAction<Record<number, number>>>;
  flagged: Set<number>; setFlagged: Dispatch<SetStateAction<Set<number>>>;
  perPage: number; setPerPage: (n: number) => void; reveal: Reveal; setReveal: (r: Reveal) => void; onAsk: (q: string) => void;
  onAnswer?: (questionIndex: number, selectedOption: number) => void;
}) {
  const { m, content } = useHomeLocale();
  const [pageIdx, setPageIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [settings, setSettings] = useState(false);

  const q = query.trim().toLowerCase();
  const list = useMemo(() => questions.map((qq, i) => ({ ...qq, idx: i })).filter((qq) => !q || qq.stem.toLowerCase().includes(q)), [q, questions]);
  const filterKey = `${q}\0${perPage}\0${reveal}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPageIdx(0);
    setRevealed(false);
  }

  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const start = pageIdx * perPage;
  const slice = list.slice(start, start + perPage);
  const showResult = reveal === "immediate" || revealed;
  const toggleFlag = (i: number) => setFlagged((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <div className="dn-quiz-fs">
      <div className="dn-quiz-scroll">
        {slice.length === 0 && (
          <div className="dn-empty" style={{ paddingTop: 40 }}>
            <Search size={26} color={C.faint} />
            <p>{query.trim() ? m.noQuestionsMatch(query) : (emptyWhenNoQuery ?? m.noQuestionsMatch(query))}</p>
            {!query.trim() && canExtractMcqs && onExtractMcqs && (
              <button type="button" className="dn-chunky" style={{ marginTop: 16 }} onClick={() => void onExtractMcqs()} disabled={extractingMcqs}>
                {extractingMcqs ? m.extractingMcqs : m.extractMcqs}
              </button>
            )}
          </div>
        )}
        {slice.map((qq) => {
          const idx = qq.idx, picked = answers[idx], answered = picked !== undefined, show = answered && showResult, isFlag = flagged.has(idx);
          return (
            <div key={idx} className="dn-q-card">
              <div className="dn-q-top">
                <p className="dn-q-num">{m.questionLabel(idx + 1)}</p>
                <button className="dn-q-flag" onClick={() => toggleFlag(idx)} style={{ color: isFlag ? C.red : C.faint }} title={m.flag} aria-label={m.flag}><Flag size={16} strokeWidth={2.4} fill={isFlag ? C.red : "none"} /></button>
              </div>
              <h3 className="dn-q-stem">{qq.stem}</h3>
              <div className="dn-q-options">
                {qq.options.map((o, oi) => {
                  const rev = show && oi === qq.correct, wrong = show && picked === oi && oi !== qq.correct, chosen = picked === oi;
                  return (
                    <button key={oi} className="dn-q-opt" disabled={answered && reveal === "immediate"} onClick={() => {
                      setAnswers((a) => ({ ...a, [idx]: oi }));
                      onAnswer?.(idx, oi);
                    }}
                      style={{ borderColor: rev ? C.green : wrong ? C.red : chosen ? C.blue : C.line, background: rev ? "#EAFBD9" : wrong ? "#FFECEC" : chosen ? "#EAF7FF" : "#fff", cursor: answered && reveal === "immediate" ? "default" : "pointer" }}>
                      <span className="dn-q-key" style={{ background: rev ? C.green : wrong ? C.red : chosen ? C.blue : C.wash, color: rev || wrong || chosen ? "#fff" : C.sub }}>{String.fromCharCode(65 + oi)}</span>{o}
                    </button>
                  );
                })}
              </div>
              {show && (
                <div className="dn-q-explain">
                  <p className="dn-q-explain-text"><b style={{ color: picked === qq.correct ? C.greenDark : C.red }}>{picked === qq.correct ? m.correct : m.notQuite}</b>{qq.explain}</p>
                  <AskChip sm onClick={() => onAsk(`${qq.stem} — ${qq.explain}`)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reveal === "later" && !revealed && Object.keys(answers).length > 0 && (
        <div className="dn-reveal-bar"><Chunky bg={C.green} shadow={C.greenDark} full onClick={() => setRevealed(true)}>{m.showAnswers}</Chunky></div>
      )}

      <div className="dn-quiz-foot">
        <button className="dn-foot-icon" onClick={() => setSettings(true)} title={m.quizSettings} aria-label={m.quizSettings}><Settings size={20} strokeWidth={2.4} /></button>
        <div className="dn-dots">{Array.from({ length: pages }).map((_, d) => <button key={d} onClick={() => setPageIdx(d)} className="dn-dot" style={{ background: d === pageIdx ? C.blue : C.line }} aria-label={`Page ${d + 1}`} />)}</div>
        <div className="dn-foot-nav">
          <button className="dn-foot-back" disabled={pageIdx === 0} onClick={() => setPageIdx((p) => p - 1)}><ChevronLeft size={18} strokeWidth={2.8} /></button>
          <Chunky bg={C.blue} shadow={C.blueDark} disabled={pageIdx === pages - 1} onClick={() => setPageIdx((p) => p + 1)}><span className="dn-inline">{m.next} <ChevronRight size={16} strokeWidth={2.8} /></span></Chunky>
        </div>
      </div>

      {settings && (
        <div className="dn-sheet-wrap" onClick={() => setSettings(false)}>
          <div className="dn-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="quiz-settings-title">
            <b className="dn-sheet-title" id="quiz-settings-title">{m.quizSettings}</b>
            <p className="dn-sheet-label">{m.questionsPerPage}</p>
            <div className="dn-seg">{[1, 5, 10].map((n) => <button key={n} onClick={() => setPerPage(n)} className="dn-seg-btn" style={{ background: perPage === n ? C.blue : "#fff", color: perPage === n ? "#fff" : C.sub, borderColor: perPage === n ? C.blue : C.line }}>{n}</button>)}</div>
            <p className="dn-sheet-label">{m.revealMode}</p>
            <div className="dn-seg">
              <button onClick={() => setReveal("immediate")} className="dn-seg-btn" style={{ background: reveal === "immediate" ? C.green : "#fff", color: reveal === "immediate" ? "#fff" : C.sub, borderColor: reveal === "immediate" ? C.green : C.line }}>{m.revealImmediate}</button>
              <button onClick={() => setReveal("later")} className="dn-seg-btn" style={{ background: reveal === "later" ? C.green : "#fff", color: reveal === "later" ? "#fff" : C.sub, borderColor: reveal === "later" ? C.green : C.line }}>{m.atTheEnd}</button>
            </div>
            <Chunky bg={C.green} shadow={C.greenDark} full onClick={() => setSettings(false)}>{m.done}</Chunky>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Review ---- */
function ReviewPane({ questions, answers, flagged, setFlagged, sessions, onResume, onRepeat, onAsk, analytics, srsQueue, clerkEnabled }: {
  questions: HomeQuestion[];
  answers: Record<number, number>;
  flagged: Set<number>;
  setFlagged: Dispatch<SetStateAction<Set<number>>>;
  sessions: QuizSession[];
  onResume: (s: QuizSession) => void;
  onRepeat: (s: QuizSession) => void;
  onAsk: (q: string) => void;
  analytics?: { totalAnswered: number; accuracy: number; srsDue: number; weakTopics: Array<{ topic: string; correct: number; incorrect: number }> };
  srsQueue?: HomeQuestion[];
  clerkEnabled?: boolean;
}) {
  const { m, content, locale } = useHomeLocale();
  type RF = "all" | "correct" | "incorrect" | "flagged" | "sessions";
  const [rf, setRf] = useState<RF>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [report, setReport] = useState<QuizSession | null>(null);
  const [srsIndex, setSrsIndex] = useState(0);
  const [srsAnswer, setSrsAnswer] = useState<number | null>(null);

  const handleSrsAnswer = async (selected: number) => {
    const q = srsQueue?.[srsIndex];
    if (!q?.id || !clerkEnabled) return;
    setSrsAnswer(selected);
    const quality = selected === q.correct ? 5 : 2;
    try {
      const token = await getClerkToken();
      if (token) await recordSrsReview(token, q.id, quality);
    } catch {
      /* ignore */
    }
  };

  const nextSrs = () => {
    setSrsAnswer(null);
    setSrsIndex((i) => i + 1);
  };

  const searchQ = search.trim().toLowerCase();

  const attempted = questions.map((q, i) => ({ ...q, idx: i })).filter((q) => answers[q.idx] !== undefined || flagged.has(q.idx));
  const list = attempted.filter((q) => {
    const a = answers[q.idx];
    if (rf === "correct") return a === q.correct;
    if (rf === "incorrect") return a !== undefined && a !== q.correct;
    if (rf === "flagged") return flagged.has(q.idx);
    return true;
  }).filter((q) => !searchQ || q.stem.toLowerCase().includes(searchQ) || q.explain.toLowerCase().includes(searchQ));
  const counts = {
    all: attempted.length,
    correct: attempted.filter((q) => answers[q.idx] === q.correct).length,
    incorrect: attempted.filter((q) => answers[q.idx] !== undefined && answers[q.idx] !== q.correct).length,
    flagged: attempted.filter((q) => flagged.has(q.idx)).length,
  };
  const filters: { k: RF; label: string }[] = [
    { k: "all", label: m.filterAll },
    { k: "correct", label: m.filterCorrect },
    { k: "incorrect", label: m.incorrectLabel },
    { k: "flagged", label: m.filterFlagged },
    { k: "sessions", label: m.filterSessions },
  ];
  const filterCounts: Record<RF, number> = { ...counts, sessions: sessions.length };

  const sessionList = sessions.filter((s) => {
    if (!searchQ) return true;
    const hay = `${s.title} ${s.source}`.toLowerCase();
    return hay.includes(searchQ);
  });

  // session report
  if (report) {
    const sc = scoreSession(report, questions);
    const pct = sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : 0;
    const skipped = sc.total - sc.answered;
    const wrong = sc.answered - sc.correct;
    return (
      <div className="dn-rv-viewer">
        <div className="dn-rv-vtop">
          <button className="dn-foot-back" onClick={() => setReport(null)}><ChevronLeft size={18} strokeWidth={2.8} /> {m.backToSessions}</button>
          <span className="dn-foot-count">{displaySessionTitle(report.title, content)}</span>
          <span />
        </div>
        <div className="dn-rv-vbody">
          <div className="dn-rv-report">
            <div className="dn-rv-report-head">
              <span className="dn-rv-session-src">{report.source === "quiz" ? m.quizSource : m.customSource}</span>
              <div className="dn-rv-report-score">{pct}%</div>
              <p className="dn-rv-session-meta" style={{ justifyContent: "center" }}>
                <span><Clock size={13} strokeWidth={2.2} /> {formatSessionWhen(report.startedAt, locale)}</span>
                <span>{formatDuration(report.durationSec, content.inProgress, m.durationMinSec)}</span>
              </p>
            </div>
            <div className="dn-rv-report-grid">
              <div className="dn-rv-report-stat"><b style={{ color: C.greenDark }}>{sc.correct}</b><span>{m.correct}</span></div>
              <div className="dn-rv-report-stat"><b style={{ color: C.red }}>{wrong}</b><span>{m.incorrectLabel}</span></div>
              <div className="dn-rv-report-stat"><b>{skipped}</b><span>{m.skipped}</span></div>
            </div>
            <ul className="dn-rv-list">
              {questions.map((q, i) => {
                const a = report.answers[i];
                const right = a === q.correct;
                return (
                  <li key={i}>
                    <button type="button" className="dn-rv-item" onClick={() => { setReport(null); setOpen(i); setRf("all"); }}>
                      <span className="dn-rv-badge" style={{ background: a === undefined ? C.faint : right ? C.green : C.red }}>
                        {a === undefined ? "—" : right ? <Check size={14} color="#fff" strokeWidth={3.5} /> : <X size={14} color="#fff" strokeWidth={3.5} />}
                      </span>
                      <span className="dn-rv-stem">{q.stem}</span>
                      <ChevronRight size={17} color={C.faint} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {report.status === "in_progress" && <Chunky bg={C.blue} shadow={C.blueDark} onClick={() => { onResume(report); setReport(null); }}><span className="dn-inline"><Play size={14} fill="#fff" /> {m.resume}</span></Chunky>}
              <Chunky bg={C.green} shadow={C.greenDark} onClick={() => { onRepeat(report); setReport(null); }}><span className="dn-inline"><RotateCcw size={14} /> {m.repeat}</span></Chunky>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // full-screen viewer
  if (open !== null) {
    const pos = list.findIndex((q) => q.idx === open);
    const cur = list[pos] ?? list[0];
    const a = answers[cur.idx];
    const move = (d: number) => { const n = list[(pos + d + list.length) % list.length]; setOpen(n.idx); };
    const isFlag = flagged.has(cur.idx);
    return (
      <div className="dn-rv-viewer">
        <div className="dn-rv-vtop">
          <button className="dn-foot-back" onClick={() => setOpen(null)}><ChevronLeft size={18} strokeWidth={2.8} /> {m.backToList}</button>
          <span className="dn-foot-count">{pos + 1} of {list.length}</span>
          <button className="dn-q-flag" onClick={() => setFlagged((s) => { const n = new Set(s); n.has(cur.idx) ? n.delete(cur.idx) : n.add(cur.idx); return n; })} style={{ color: isFlag ? C.red : C.faint }}><Flag size={18} strokeWidth={2.4} fill={isFlag ? C.red : "none"} /></button>
        </div>
        <div className="dn-rv-vbody">
          <div className="dn-q-card" style={{ maxWidth: 680, margin: "0 auto" }}>
            <p className="dn-q-num">{m.questionLabel(cur.idx + 1)}</p>
            <h3 className="dn-q-stem">{cur.stem}</h3>
            <div className="dn-q-options">
              {cur.options.map((o, oi) => {
                const rev = oi === cur.correct, wrong = a === oi && oi !== cur.correct;
                return (
                  <div key={oi} className="dn-q-opt" style={{ borderColor: rev ? C.green : wrong ? C.red : C.line, background: rev ? "#EAFBD9" : wrong ? "#FFECEC" : "#fff" }}>
                    <span className="dn-q-key" style={{ background: rev ? C.green : wrong ? C.red : C.wash, color: rev || wrong ? "#fff" : C.sub }}>{String.fromCharCode(65 + oi)}</span>{o}
                  </div>
                );
              })}
            </div>
            <div className="dn-q-explain">
              <p className="dn-q-explain-text"><b style={{ color: a === cur.correct ? C.greenDark : C.red }}>{a === undefined ? m.notAnswered : a === cur.correct ? m.correct : m.incorrectLabel}</b>{cur.explain}</p>
              <AskChip sm onClick={() => onAsk(`${cur.stem} — ${cur.explain}`)} />
            </div>
          </div>
        </div>
        <div className="dn-read-foot">
          <button className="dn-foot-back" onClick={() => move(-1)}><ChevronLeft size={18} strokeWidth={2.8} /> {m.prev}</button>
          <span className="dn-foot-count">{m.browseMode}</span>
          <Chunky bg={C.blue} shadow={C.blueDark} onClick={() => move(1)}><span className="dn-inline">{m.next} <ChevronRight size={16} strokeWidth={2.8} /></span></Chunky>
        </div>
      </div>
    );
  }

  return (
    <div className="nt-scroll">
      <div className="nt-doc">
        <h1 className="nt-h1 dn-centered-h1">{m.reviewHeading}</h1>
        {analytics && analytics.totalAnswered > 0 && (
          <div className="dn-rv-report-grid" style={{ marginBottom: 16 }}>
            <div className="dn-rv-report-stat"><b>{analytics.totalAnswered}</b><span>Answered</span></div>
            <div className="dn-rv-report-stat"><b style={{ color: C.greenDark }}>{analytics.accuracy}%</b><span>Accuracy</span></div>
            <div className="dn-rv-report-stat"><b>{analytics.srsDue}</b><span>SRS due</span></div>
          </div>
        )}
        {srsQueue && srsQueue.length > 0 && srsIndex < srsQueue.length && (
          <div className="dn-q-card" style={{ marginBottom: 16 }}>
            <p className="text-xs font-extrabold uppercase tracking-wide text-purple-700 mb-2">
              Spaced repetition · {srsIndex + 1}/{srsQueue.length}
            </p>
            <p className="font-bold mb-3">{srsQueue[srsIndex]?.stem}</p>
            <div className="flex flex-col gap-2">
              {srsQueue[srsIndex]?.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className="dn-q-opt"
                  disabled={srsAnswer !== null}
                  onClick={() => void handleSrsAnswer(i)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {srsAnswer !== null && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2">{srsQueue[srsIndex]?.explain}</p>
                <Chunky bg={C.purple} shadow={C.purpleDark} onClick={nextSrs}>
                  {srsIndex + 1 >= srsQueue.length ? "Done" : "Next card"}
                </Chunky>
              </div>
            )}
          </div>
        )}
        {analytics && analytics.weakTopics.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h2 className="nt-h2">Weak topics</h2>
            <ul className="nt-bullets">
              {analytics.weakTopics.slice(0, 5).map((t) => (
                <li key={t.topic}>
                  {t.topic} · {t.incorrect} missed / {t.correct + t.incorrect} seen
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="dn-rv-toolbar">
          <div className="dn-rv-search">
            <Search size={15} color={C.faint} strokeWidth={2.4} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={rf === "sessions" ? m.searchSessionsPlaceholder : m.reviewSearchPlaceholder}
              aria-label={rf === "sessions" ? m.searchSessionsAria : m.searchReviewAria}
            />
            {search && <button type="button" className="dn-fs-clear" onClick={() => setSearch("")} aria-label={m.clearSearch}><X size={14} strokeWidth={2.8} /></button>}
          </div>
          <div className="dn-rv-filters">
            {filters.map((f) => (
              <button key={f.k} onClick={() => setRf(f.k)} className="dn-rv-filter" style={{ background: rf === f.k ? C.ink : "#fff", color: rf === f.k ? "#fff" : C.sub, borderColor: rf === f.k ? C.ink : C.line }}>
                {f.label}<span className="dn-rv-count" style={{ background: rf === f.k ? "rgba(255,255,255,.22)" : C.wash, color: rf === f.k ? "#fff" : C.faint }}>{filterCounts[f.k]}</span>
              </button>
            ))}
          </div>
        </div>
        {rf === "sessions" ? (
          sessionList.length === 0 ? (
            <div className="dn-empty" style={{ paddingTop: 30 }}><Clock size={26} color={C.faint} /><p>{searchQ ? m.noSessionsMatch(search.trim()) : m.noSessionsYet}</p></div>
          ) : (
            <ul className="dn-rv-sessions">
              {sessionList.map((s) => {
                const sc = scoreSession(s, questions);
                const pct = sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : 0;
                return (
                  <li key={s.id} className="dn-rv-session">
                    <div className="dn-rv-session-top">
                      <div>
                        <span className="dn-rv-session-src">{s.source === "quiz" ? m.quizSource : m.customSource}</span>
                        <p className="dn-rv-session-title">{displaySessionTitle(s.title, content)}</p>
                      </div>
                      <div className="dn-rv-session-score">{sc.correct}/{sc.total} <small>({pct}%)</small></div>
                    </div>
                    <p className="dn-rv-session-meta">
                      <span><Clock size={13} strokeWidth={2.2} /> {formatSessionWhen(s.startedAt, locale)}</span>
                      <span>{formatDuration(s.durationSec, content.inProgress, m.durationMinSec)}</span>
                      <span>{sc.answered} {m.answered}</span>
                    </p>
                    <div className="dn-rv-session-actions">
                      {s.status === "in_progress" && (
                        <button type="button" className="dn-rv-session-btn primary" onClick={() => onResume(s)}>
                          <Play size={12} fill="#fff" strokeWidth={2.4} /> {m.resume}
                        </button>
                      )}
                      <button type="button" className="dn-rv-session-btn ghost" onClick={() => setReport(s)}>
                        <BarChart2 size={12} strokeWidth={2.4} /> {m.report}
                      </button>
                      <button type="button" className="dn-rv-session-btn" onClick={() => onRepeat(s)}>
                        <RotateCcw size={12} strokeWidth={2.4} /> {m.repeat}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : list.length === 0 ? (
          <div className="dn-empty" style={{ paddingTop: 30 }}><ListChecks size={26} color={C.faint} /><p>{searchQ ? m.noReviewSearch(search.trim()) : m.noReviewItems}</p></div>
        ) : (
          <ul className="dn-rv-list">
            {list.map((q) => {
              const a = answers[q.idx], right = a === q.correct, isFlag = flagged.has(q.idx);
              return (
                <li key={q.idx}><button className="dn-rv-item" onClick={() => setOpen(q.idx)}>
                  <span className="dn-rv-badge" style={{ background: a === undefined ? C.faint : right ? C.green : C.red }}>{a === undefined ? <Flag size={13} color="#fff" strokeWidth={2.6} /> : right ? <Check size={14} color="#fff" strokeWidth={3.5} /> : <X size={14} color="#fff" strokeWidth={3.5} />}</span>
                  <span className="dn-rv-stem">{q.stem}</span>
                  {isFlag && <Flag size={15} color={C.red} fill={C.red} strokeWidth={2} style={{ flexShrink: 0 }} />}
                  <ChevronRight size={17} color={C.faint} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                </button></li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---- Summary (Notion-style) ---- */
const SUM_HL = {
  yellow: { bg: "#FFF3BF", dot: "#F5D547" },
  green: { bg: "#EAFBD9", dot: "#8FD84A" },
  blue: { bg: "#DDF4FF", dot: "#58CCFF" },
  pink: { bg: "#FFE8F3", dot: "#FF9EC7" },
} as const;
type SumHl = keyof typeof SUM_HL;
type SumAnno = { highlight: SumHl | null; note: string };

function loadSumAnno(key: string): SumAnno {
  if (typeof window === "undefined") return { highlight: null, note: "" };
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as SumAnno;
  } catch { /* ignore */ }
  return { highlight: null, note: "" };
}

function SummaryBlock({ fileId, blockId, className, children }: {
  fileId: string; blockId: string; className?: string; children: ReactNode;
}) {
  const { m, content } = useHomeLocale();
  const key = `dn-sum-${fileId}-${blockId}`;
  const [anno, setAnno] = useState<SumAnno>(() => loadSumAnno(key));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(anno));
  }, [anno, key]);

  const setHl = (hl: SumHl) => {
    setAnno((a) => ({ ...a, highlight: a.highlight === hl ? null : hl }));
  };
  const openNote = () => {
    setDraft(anno.note);
    setEditing(true);
  };
  const saveNote = () => {
    setAnno((a) => ({ ...a, note: draft.trim() }));
    setEditing(false);
  };
  const clearNote = () => {
    setAnno((a) => ({ ...a, note: "" }));
    setDraft("");
    setEditing(false);
  };

  const hlBg = anno.highlight ? SUM_HL[anno.highlight].bg : undefined;

  return (
    <div
      className={`nt-block${anno.highlight ? " hl" : ""}${editing ? " editing" : ""}${className ? ` ${className}` : ""}`}
      style={hlBg ? ({ ["--nt-hl-bg"]: hlBg, background: hlBg } as CSSProperties) : undefined}
      tabIndex={0}
    >
      <div className="nt-block-bar" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        {(Object.keys(SUM_HL) as SumHl[]).map((hl) => (
          <button
            key={hl}
            type="button"
            className={`nt-hl-btn${anno.highlight === hl ? " on" : ""}`}
            style={{ background: SUM_HL[hl].dot }}
            onClick={() => setHl(hl)}
            title={content.highlightColor(hl)}
            aria-label={content.highlightColor(hl)}
            aria-pressed={anno.highlight === hl}
          />
        ))}
        <button type="button" className={`nt-note-btn${anno.note ? " on" : ""}`} onClick={openNote} title={content.addNote} aria-label={content.addNote}>
          <StickyNote size={12} strokeWidth={2.4} />
        </button>
      </div>
      {children}
      {(editing || anno.note) && (
        <div className="nt-block-note" onClick={(e) => e.stopPropagation()}>
          {editing ? (
            <>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={content.yourNote} autoFocus />
              <div className="nt-block-note-actions">
                {anno.note && <button type="button" onClick={clearNote}>{m.clearNote}</button>}
                <button type="button" className="save" onClick={saveNote}>{m.save}</button>
              </div>
            </>
          ) : (
            <p onClick={openNote}>{anno.note}</p>
          )}
        </div>
      )}
    </div>
  );
}

function NotionToggle({ fileId, id, title, children }: { fileId: string; id: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="nt-toggle">
      <SummaryBlock fileId={fileId} blockId={`${id}-title`} className="nt-toggle-head-wrap">
        <button type="button" className="nt-toggle-head" onClick={() => setOpen((o) => !o)}>
          <ChevronRight size={16} strokeWidth={2.6} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
          <span>{title}</span>
        </button>
      </SummaryBlock>
      {open && (
        <SummaryBlock fileId={fileId} blockId={`${id}-body`} className="nt-toggle-body-wrap">
          <div className="nt-toggle-body">{children}</div>
        </SummaryBlock>
      )}
    </div>
  );
}
function SummaryNotion({ file, summaries }: { file: ExamFile; summaries: HomeSummary[] }) {
  const { m, content } = useHomeLocale();
  const { summary } = content;
  const [done, setDone] = useState<Set<number>>(new Set());
  const primary = summaries.find((s) => s.type === "summary") ?? summaries[0];
  const liveBullets = primary
    ? primary.content
        .split("\n")
        .filter((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "))
        .map((l) => l.replace(/^[-*]\s*/, "").trim())
        .slice(0, 6)
    : [];
  const bullets = liveBullets.length > 0 ? liveBullets : summary.bullets;
  return (
    <div className="nt-scroll">
      <div className="nt-doc">
        <div className="nt-pageicon" style={{ background: file.color }}><FileText size={22} color="#fff" strokeWidth={2.2} /></div>
        <h1 className="nt-h1 dn-centered-h1">{file.name} {summary.titleSuffix}</h1>
        {primary ? (
          <SummaryBlock fileId={file.id} blockId="live-summary" className="nt-callout">
            <p>{primary.content.split("\n").find((l) => l.trim() && !l.startsWith("#"))?.trim() ?? m.aiGeneratedSummary}</p>
          </SummaryBlock>
        ) : (
          <SummaryBlock fileId={file.id} blockId="callout" className="nt-callout">
            <span className="nt-callout-ic" style={{ background: C.yellow }}><Star size={14} color="#fff" fill="#fff" /></span>
            <p>{summary.callout}</p>
          </SummaryBlock>
        )}
        <h2 className="nt-h2">{summary.keyTakeaways}</h2>
        <ul className="nt-bullets">
          {bullets.map((text, i) => (
            <li key={i}><SummaryBlock fileId={file.id} blockId={`bullet-${i}`}>{text}</SummaryBlock></li>
          ))}
        </ul>
        <h2 className="nt-h2">{summary.expandDetail}</h2>
        {summary.toggles.map((toggle) => (
          <NotionToggle key={toggle.id} fileId={file.id} id={toggle.id} title={toggle.title}>
            <p>{toggle.body}</p>
          </NotionToggle>
        ))}
        <h2 className="nt-h2">{summary.checklist}</h2>
        <ul className="nt-checks">
          {summary.checks.map((c, i) => { const on = done.has(i); return (
            <li key={i}>
              <button type="button" className="nt-check" onClick={() => { const n = new Set(done); on ? n.delete(i) : n.add(i); setDone(n); }} style={{ borderColor: on ? C.green : C.faint, background: on ? C.green : "#fff" }}>{on && <Check size={12} color="#fff" strokeWidth={3.5} />}</button>
              <SummaryBlock fileId={file.id} blockId={`check-${i}`}>
                <span style={{ color: on ? C.faint : C.ink, textDecoration: on ? "line-through" : "none" }}>{c}</span>
              </SummaryBlock>
            </li>
          ); })}
        </ul>
      </div>
    </div>
  );
}

/* ---- Flashcards (list or side-by-side) ---- */
type QlView = "list" | "split";

function CardImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />;
}

function FlashcardsQuizlet({ query, cards }: { query: string; cards: HomeFlashCard[] }) {
  const { m, content } = useHomeLocale();
  const [open, setOpen] = useState<number | null>(null);
  const [fav, setFav] = useState<Set<number>>(new Set());
  const [view, setView] = useState<QlView>(() => {
    if (typeof window === "undefined") return "list";
    const saved = localStorage.getItem("dn-flashcards-view");
    return saved === "split" ? "split" : "list";
  });
  const q = query.trim().toLowerCase();
  const list = useMemo(() => cards.map((c, orig) => ({ ...c, orig })).filter((c) => {
    if (!q) return true;
    const hay = `${c.t} ${c.d} ${c.imgAlt ?? ""}`.toLowerCase();
    return hay.includes(q);
  }), [q, cards]);
  const resetKey = `${q}\0${view}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setOpen(null);
  }
  useEffect(() => { localStorage.setItem("dn-flashcards-view", view); }, [view]);

  const toggleFav = (orig: number) => {
    setFav((prev) => {
      const n = new Set(prev);
      n.has(orig) ? n.delete(orig) : n.add(orig);
      return n;
    });
  };

  if (list.length === 0) return <div className="ql-scroll"><div className="ql-wrap"><div className="dn-empty" style={{ paddingTop: 40 }}><Search size={26} color={C.faint} /><p>{m.noCardsMatch(query)}</p></div></div></div>;

  return (
    <div className="ql-scroll">
      <div className="ql-wrap">
        <div className="ql-head">
          <h3 className="ql-list-h">{content.termsInSet(list.length)}</h3>
          <div className="ql-view-toggle" role="group" aria-label={content.flashcardLayout}>
            <button type="button" className={`ql-view-btn${view === "list" ? " on" : ""}`} onClick={() => setView("list")} title={m.flashcardsList} aria-label={m.flashcardsList} aria-pressed={view === "list"}>
              <LayoutList size={16} strokeWidth={2.4} />
            </button>
            <button type="button" className={`ql-view-btn${view === "split" ? " on" : ""}`} onClick={() => setView("split")} title={m.flashcardsSplit} aria-label={m.flashcardsSplit} aria-pressed={view === "split"}>
              <Columns2 size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
        {view === "list" ? (
          <ul className="ql-list">
            {list.map((c) => {
              const on = fav.has(c.orig), expanded = open === c.orig;
              return (
                <li key={c.orig} className={`ql-row${c.img ? " has-img" : ""}`}>
                  <div className="ql-row-head">
                    <button type="button" className="ql-row-toggle" onClick={() => setOpen(expanded ? null : c.orig)} aria-expanded={expanded}>
                      {c.img && <CardImage src={c.img} alt="" className="ql-thumb" />}
                      <span className="ql-term">{c.t}</span>
                      {c.img && <ImageIcon size={14} strokeWidth={2.2} className="ql-img-badge" aria-hidden />}
                      <ChevronRight size={18} color={C.faint} strokeWidth={2.6} style={{ flexShrink: 0, transform: expanded ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                    </button>
                    <button type="button" className="ql-fav" onClick={() => toggleFav(c.orig)} style={{ color: on ? C.yellowDark : C.faint }} aria-label={content.favorite}>
                      <Star size={16} strokeWidth={2.2} fill={on ? C.yellow : "none"} />
                    </button>
                  </div>
                  {expanded && (
                    <>
                      {c.img && <CardImage src={c.img} alt={c.imgAlt ?? c.t} className="ql-card-img" />}
                      <p className={`ql-def${c.img ? " no-border" : ""}`}>{c.d}</p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="ql-list">
            {list.map((c) => {
              const on = fav.has(c.orig);
              return (
                <li key={c.orig} className={`ql-split-row${c.img ? " has-img" : ""}`}>
                  <div className="ql-split-term">{c.t}</div>
                  <div className="ql-split-def">
                    <div className="ql-split-def-inner">
                      <span>{c.d}</span>
                      {c.img && <CardImage src={c.img} alt={c.imgAlt ?? c.t} className="ql-split-media" />}
                    </div>
                  </div>
                  <div className="ql-split-fav">
                    <button type="button" className="ql-fav" onClick={() => toggleFav(c.orig)} style={{ color: on ? C.yellowDark : C.faint }} aria-label={content.favorite}>
                      <Star size={16} strokeWidth={2.2} fill={on ? C.yellow : "none"} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---- Custom ---- */
function CustomPane({ reveal, setReveal, onStart, flash }: {
  reveal: Reveal; setReveal: (r: Reveal) => void; onStart: (count: number) => void; flash: (m: string) => void;
}) {
  const { m } = useHomeLocale();
  const modes: { k: Tab; icon: ElementType; c: string }[] = [{ k: "Quiz", icon: Brain, c: C.blue }, { k: "Flashcards", icon: Layers, c: C.purple }, { k: "Summary", icon: FileText, c: C.yellow }];
  const [on, setOn] = useState<Set<string>>(new Set(["Quiz"]));
  const [count, setCount] = useState(20);
  const [timed, setTimed] = useState(true);
  return (
    <div className="nt-scroll">
      <div className="dn-custom">
        <h2 className="nt-h2" style={{ marginTop: 0 }}>{m.buildSession}</h2>
        <div className="dn-mode-grid">
          {modes.map(({ k, icon: Icon, c }) => { const active = on.has(k); return (
            <button key={k} className="dn-mode" onClick={() => { const n = new Set(on); n.has(k) ? n.delete(k) : n.add(k); setOn(n); }} style={{ borderColor: active ? c : C.line, background: active ? "#fff" : C.wash }}>
              <span className="dn-mode-ic" style={{ background: c }}><Icon size={18} color="#fff" strokeWidth={2.4} /></span>{m.tabLabel(k)}
              <span className="dn-mode-check" style={{ borderColor: active ? c : C.line, background: active ? c : "#fff" }}>{active && <Check size={12} color="#fff" strokeWidth={3.5} />}</span>
            </button>
          ); })}
        </div>
        <p className="nt-sub-label">{m.customReveal}</p>
        <div className="dn-seg" style={{ marginBottom: 4 }}>
          <button onClick={() => setReveal("immediate")} className="dn-seg-btn" style={{ background: reveal === "immediate" ? C.green : "#fff", color: reveal === "immediate" ? "#fff" : C.sub, borderColor: reveal === "immediate" ? C.green : C.line }}>{m.directly}</button>
          <button onClick={() => setReveal("later")} className="dn-seg-btn" style={{ background: reveal === "later" ? C.green : "#fff", color: reveal === "later" ? "#fff" : C.sub, borderColor: reveal === "later" ? C.green : C.line }}>{m.later}</button>
        </div>
        <div className="dn-row-field"><span><Users size={16} strokeWidth={2.4} /> {m.questionsLabel}</span><div className="dn-stepper"><button onClick={() => setCount((c) => Math.max(5, c - 5))}>−</button><b>{count}</b><button onClick={() => setCount((c) => Math.min(60, c + 5))}>+</button></div></div>
        <div className="dn-row-field"><span><Clock size={16} strokeWidth={2.4} /> {m.timedMode}</span><button className="dn-switch" onClick={() => setTimed((t) => !t)} style={{ background: timed ? C.green : C.line }}><span style={{ transform: timed ? "translateX(20px)" : "translateX(0)" }} /></button></div>
        <Chunky bg={C.green} shadow={C.greenDark} full disabled={on.size === 0} onClick={() => onStart(count)}><span className="dn-inline"><Play size={16} fill="#fff" strokeWidth={2.6} /> {m.customStart}</span></Chunky>
      </div>
    </div>
  );
}
