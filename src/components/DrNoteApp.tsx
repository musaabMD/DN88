"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

/** Mobile: centered narrow column. Desktop: full width with edge padding. */
const PAGE_SHELL =
  "w-full max-w-2xl mx-auto px-4 md:max-w-none md:mx-0 md:px-8 lg:px-12 xl:px-16";
import type { LucideIcon } from "lucide-react";
import {
  FileQuestion,
  FileText,
  Image,
  BookOpen,
  CreditCard,
  SlidersHorizontal,
  X,
  Check,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Zap,
  Crown,
  Star,
  Bookmark,
  Lightbulb,
  Flag,
  MessageCircle,
  Send,
  RotateCcw,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronRight as Chevron,
  Target,
} from "lucide-react";

const TABS = [
  { id: "questions", label: "Questions", icon: FileQuestion },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "images", label: "Images", icon: Image },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "flashcards", label: "Flashcards", icon: CreditCard },
] as const;

const SUBJECTS = [
  "Anatomy",
  "Physiology",
  "Pharmacology",
  "Pathology",
  "Biochemistry",
  "Microbiology",
  "Surgery",
  "Internal Medicine",
];

const STATUSES = [
  { id: "used", label: "Used" },
  { id: "unused", label: "Unused" },
  { id: "incorrect", label: "Incorrect" },
  { id: "bookmark", label: "Bookmark" },
];

const TAGS = [
  "High Yield",
  "Exam Ready",
  "Review Needed",
  "Master",
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
];

const DAILY_LIMIT = 20;
const DAILY_USED = 13;

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    subject: "Pharmacology",
    text: "A 45-year-old patient is prescribed metformin for type 2 diabetes. Which of the following is the primary mechanism of action of metformin?",
    options: [
      "Increases insulin secretion",
      "Decreases hepatic glucose output",
      "Stimulates glucagon release",
      "Inhibits intestinal glucose absorption",
    ],
    answer: 1,
    tag: "High Yield",
    status: "unused",
  },
  {
    id: 2,
    subject: "Anatomy",
    text: "Which nerve passes through the carpal tunnel alongside the flexor tendons?",
    options: [
      "Ulnar nerve",
      "Radial nerve",
      "Median nerve",
      "Musculocutaneous nerve",
    ],
    answer: 2,
    tag: "Exam Ready",
    status: "used",
  },
  {
    id: 3,
    subject: "Pathology",
    text: "A biopsy shows non-caseating granulomas in the lung parenchyma. What is the most likely diagnosis?",
    options: [
      "Tuberculosis",
      "Sarcoidosis",
      "Histoplasmosis",
      "Aspergillosis",
    ],
    answer: 1,
    tag: "High Yield",
    status: "incorrect",
  },
];

const SAMPLE_SUMMARIES = [
  {
    id: 1,
    subject: "Pharmacology",
    title: "Beta Blockers",
    bullets: [
      "Competitively block β-adrenergic receptors",
      "Cardioselective (β1): metoprolol, atenolol",
      "Non-selective (β1+β2): propranolol, carvedilol",
      "Uses: HTN, angina, HF, arrhythmias, post-MI",
      "Side effects: bradycardia, bronchospasm, fatigue",
      "Contraindicated in decompensated HF, severe asthma",
    ],
    tag: "HY Note",
  },
  {
    id: 2,
    subject: "Anatomy",
    title: "Brachial Plexus Roots",
    bullets: [
      "C5-T1 nerve roots",
      "5 roots → 3 trunks → 6 divisions → 3 cords → 5 terminal branches",
      "MARMU: Musculocutaneous, Axillary, Radial, Median, Ulnar",
      "Erb's palsy: C5-C6 injury → waiter's tip",
      "Klumpke's palsy: C8-T1 injury → claw hand",
    ],
    tag: "HY Note",
  },
];

const SAMPLE_IMAGES = [
  {
    id: 1,
    subject: "Anatomy",
    caption:
      "Cross-section of the spinal cord showing grey and white matter organization",
    tag: "High Yield",
    gradient: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  },
  {
    id: 2,
    subject: "Pathology",
    caption:
      "Histological slide showing Reed-Sternberg cells in Hodgkin lymphoma",
    tag: "Exam Ready",
    gradient: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
  },
  {
    id: 3,
    subject: "Pharmacology",
    caption:
      "Drug receptor interaction demonstrating competitive antagonism curve",
    tag: "High Yield",
    gradient: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
  },
];

const SAMPLE_FLASHCARDS = [
  {
    id: 1,
    subject: "Pharmacology",
    front: "What is the mechanism of action of ACE inhibitors?",
    back: "Block conversion of Angiotensin I → Angiotensin II by inhibiting ACE enzyme, reducing vasoconstriction and aldosterone release",
  },
  {
    id: 2,
    subject: "Anatomy",
    front: "Name the rotator cuff muscles (SITS)",
    back: "Supraspinatus, Infraspinatus, Teres minor, Subscapularis",
  },
  {
    id: 3,
    subject: "Pathology",
    front: "What is the hallmark finding in DIC?",
    back: "Elevated D-dimer, prolonged PT/PTT, low fibrinogen, thrombocytopenia — consumption of clotting factors",
  },
];

type StudySet = {
  id: string;
  title: string;
  subject: string;
  total: number;
  done: number;
  score: number | null;
  tag: string;
};

const QUESTION_SETS: StudySet[] = [
  {
    id: "q1",
    title: "Diabetes & Oral Hypoglycemics",
    subject: "Pharmacology",
    total: 20,
    done: 13,
    score: 85,
    tag: "High Yield",
  },
  {
    id: "q2",
    title: "Upper Limb Nerve Injuries",
    subject: "Anatomy",
    total: 15,
    done: 15,
    score: 92,
    tag: "Exam Ready",
  },
  {
    id: "q3",
    title: "Granulomatous Lung Disease",
    subject: "Pathology",
    total: 25,
    done: 4,
    score: 61,
    tag: "Review Needed",
  },
  {
    id: "q4",
    title: "Cardiac Physiology Basics",
    subject: "Physiology",
    total: 18,
    done: 0,
    score: null,
    tag: "Week 2",
  },
];

const SUMMARY_SETS: StudySet[] = [
  {
    id: "s1",
    title: "Autonomic Pharmacology Notes",
    subject: "Pharmacology",
    total: 8,
    done: 6,
    score: 88,
    tag: "HY Note",
  },
  {
    id: "s2",
    title: "Brachial Plexus & Upper Limb",
    subject: "Anatomy",
    total: 5,
    done: 5,
    score: 95,
    tag: "HY Note",
  },
  {
    id: "s3",
    title: "Hemodynamics Quick Review",
    subject: "Physiology",
    total: 10,
    done: 0,
    score: null,
    tag: "Week 3",
  },
];

const IMAGE_SETS: StudySet[] = [
  {
    id: "i1",
    title: "Neuroanatomy Cross-Sections",
    subject: "Anatomy",
    total: 12,
    done: 9,
    score: 78,
    tag: "High Yield",
  },
  {
    id: "i2",
    title: "Hematopathology Slides",
    subject: "Pathology",
    total: 14,
    done: 2,
    score: 50,
    tag: "Exam Ready",
  },
];

const FLASHCARD_SETS: StudySet[] = [
  {
    id: "f1",
    title: "Drug Mechanisms Rapid Fire",
    subject: "Pharmacology",
    total: 30,
    done: 22,
    score: 81,
    tag: "High Yield",
  },
  {
    id: "f2",
    title: "Muscles & Innervation",
    subject: "Anatomy",
    total: 24,
    done: 24,
    score: 96,
    tag: "Master",
  },
  {
    id: "f3",
    title: "Coagulation Disorders",
    subject: "Pathology",
    total: 16,
    done: 5,
    score: 70,
    tag: "Week 4",
  },
];

const SETS_BY_TAB: Record<string, StudySet[]> = {
  questions: QUESTION_SETS,
  summary: SUMMARY_SETS,
  images: IMAGE_SETS,
  flashcards: FLASHCARD_SETS,
};

const TAB_ACCENT: Record<
  string,
  { color: string; bg: string; border: string; icon: LucideIcon }
> = {
  questions: {
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: FileQuestion,
  },
  summary: {
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    icon: FileText,
  },
  images: {
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#fbcfe8",
    icon: Image,
  },
  flashcards: {
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    icon: CreditCard,
  },
};

type SidebarMode = "explain" | "report" | "comments" | null;

function Sidebar({
  mode,
  questionText,
  onClose,
}: {
  mode: SidebarMode;
  questionText: string;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "Dr. Sara",
      time: "2h ago",
      text: "Great explanation! The mechanism is well described here.",
    },
    {
      id: 2,
      author: "Med_Student99",
      time: "5h ago",
      text: "I always confuse this with the competitive inhibitor — the table in the notes helped a lot.",
    },
  ]);
  const [reportSelected, setReportSelected] = useState<string[]>([]);
  const reportOptions = [
    "Typo / spelling error",
    "Wrong answer marked",
    "Unclear question",
    "Outdated information",
    "Image issue",
    "Other",
  ];

  if (!mode) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/30" onClick={onClose} />
      <div
        className="fixed right-0 top-0 h-full z-[56] flex flex-col bg-white w-full max-w-sm"
        style={{
          borderLeft: "3px solid #e2e8f0",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 h-14 flex-shrink-0"
          style={{ borderBottom: "2px solid #f1f5f9" }}
        >
          <div className="flex items-center gap-2">
            {mode === "explain" && (
              <>
                <Lightbulb
                  size={16}
                  style={{ color: "#f59e0b" }}
                  strokeWidth={2.5}
                />
                <span className="font-black text-slate-900 text-sm">
                  Explanation
                </span>
              </>
            )}
            {mode === "report" && (
              <>
                <Flag size={16} style={{ color: "#ef4444" }} strokeWidth={2.5} />
                <span className="font-black text-slate-900 text-sm">
                  Report Issue
                </span>
              </>
            )}
            {mode === "comments" && (
              <>
                <MessageCircle
                  size={16}
                  style={{ color: "#3b82f6" }}
                  strokeWidth={2.5}
                />
                <span className="font-black text-slate-900 text-sm">
                  Comments
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "#f1f5f9" }}
          >
            <X size={14} strokeWidth={2.5} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === "explain" && (
            <div className="p-4 space-y-4">
              <div
                className="p-3 rounded-2xl text-xs font-semibold text-slate-600"
                style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}
              >
                {questionText}
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Explanation
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  The correct answer relates to the primary mechanism described in
                  current pharmacological guidelines. The key concept here is
                  receptor binding affinity and downstream signaling cascades that
                  produce the observed clinical effects.
                </p>
              </div>
              <div
                className="p-3 rounded-2xl"
                style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}
              >
                <p className="text-xs font-black text-green-700 mb-1">
                  Key Point
                </p>
                <p className="text-xs font-semibold text-green-800">
                  Remember the mnemonic: the mechanism directly follows the drug
                  class naming convention in most cases.
                </p>
              </div>
            </div>
          )}

          {mode === "report" && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Issue Type
              </p>
              <div className="space-y-2">
                {reportOptions.map((opt) => {
                  const sel = reportSelected.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        setReportSelected((p) =>
                          sel ? p.filter((x) => x !== opt) : [...p, opt]
                        )
                      }
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-left transition-all"
                      style={
                        sel
                          ? {
                              background: "#fee2e2",
                              border: "2px solid #fca5a5",
                              color: "#dc2626",
                              boxShadow: "0 2px 0 #fca5a5",
                            }
                          : {
                              background: "#fff",
                              border: "2px solid #e2e8f0",
                              color: "#64748b",
                              boxShadow: "0 2px 0 #e2e8f0",
                            }
                      }
                    >
                      <div
                        className="w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center"
                        style={{ background: sel ? "#dc2626" : "#e2e8f0" }}
                      >
                        {sel && (
                          <Check size={10} strokeWidth={3} className="text-white" />
                        )}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={reportSelected.length === 0}
                className="w-full py-3 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-40"
                style={{
                  background: "#ef4444",
                  border: "2px solid #dc2626",
                  boxShadow: "0 3px 0 #dc2626",
                }}
              >
                Submit Report
              </button>
            </div>
          )}

          {mode === "comments" && (
            <div className="p-4 space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {comments.length} Comments
              </p>
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl"
                  style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                        style={{ background: "#3b82f6" }}
                      >
                        {c.author[0]}
                      </div>
                      <span className="text-xs font-black text-slate-700">
                        {c.author}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {c.time}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {mode === "comments" && (
          <div
            className="px-4 py-3 flex-shrink-0"
            style={{ borderTop: "2px solid #f1f5f9" }}
          >
            <div className="flex gap-2 items-end">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-700 placeholder-slate-400 outline-none"
                style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
              />
              <button
                onClick={() => {
                  if (!comment.trim()) return;
                  setComments((p) => [
                    ...p,
                    {
                      id: Date.now(),
                      author: "You",
                      time: "now",
                      text: comment.trim(),
                    },
                  ]);
                  setComment("");
                }}
                className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: "#3b82f6",
                  border: "2px solid #2563eb",
                  boxShadow: "0 3px 0 #2563eb",
                }}
              >
                <Send size={14} strokeWidth={2.5} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function progressColor(pct: number) {
  if (pct >= 100) return "#22c55e";
  if (pct >= 60) return "#58CC02";
  if (pct >= 30) return "#f97316";
  return "#94a3b8";
}

function scoreColor(score: number) {
  if (score >= 85)
    return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (score >= 70)
    return { color: "#b45309", bg: "#fffbeb", border: "#fde68a" };
  return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
}

function SetCard({
  set,
  tab,
  onOpen,
}: {
  set: StudySet;
  tab: string;
  onOpen: () => void;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const accent = TAB_ACCENT[tab];
  const Icon = accent.icon;
  const pct = Math.round((set.done / set.total) * 100);
  const complete = pct >= 100;

  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden transition-all"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <button onClick={onOpen} className="w-full text-left px-4 pt-3.5 pb-3">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: accent.bg,
              border: `2px solid ${accent.border}`,
            }}
          >
            <Icon size={20} strokeWidth={2.5} style={{ color: accent.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-slate-900 text-sm truncate">
                {set.title}
              </p>
              {complete && (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#22c55e" }}
                >
                  <Check size={10} strokeWidth={3.5} className="text-white" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-xs font-black px-2 py-0.5 rounded-lg"
                style={{
                  background: accent.bg,
                  color: accent.color,
                  border: `1.5px solid ${accent.border}`,
                }}
              >
                {set.subject}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: "#f0fdf4", color: "#16a34a" }}
              >
                {set.tag}
              </span>
            </div>
          </div>

          <Chevron
            size={16}
            strokeWidth={2.5}
            className="text-slate-300 flex-shrink-0 mt-2"
          />
        </div>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span
                className="text-xs font-black"
                style={{ color: progressColor(pct) }}
              >
                {set.done}/{set.total}
              </span>
              <span className="text-xs font-bold text-slate-400">{pct}%</span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: progressColor(pct) }}
              />
            </div>
          </div>

          {set.score !== null ? (
            <div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl flex-shrink-0"
              style={{
                background: scoreColor(set.score).bg,
                border: `1.5px solid ${scoreColor(set.score).border}`,
              }}
            >
              <Target
                size={12}
                strokeWidth={2.5}
                style={{ color: scoreColor(set.score).color }}
              />
              <span
                className="text-xs font-black"
                style={{ color: scoreColor(set.score).color }}
              >
                {set.score}%
              </span>
            </div>
          ) : (
            <span
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl flex-shrink-0"
              style={{
                background: "#f8fafc",
                color: "#94a3b8",
                border: "1.5px solid #e2e8f0",
              }}
            >
              New
            </span>
          )}
        </div>
      </button>

      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderTop: "2px solid #f8fafc" }}
      >
        <span className="text-xs font-bold text-slate-400">
          {complete ? "Completed" : set.done > 0 ? "In progress" : "Not started"}
        </span>
        <button
          onClick={() => setBookmarked((p) => !p)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={
            bookmarked
              ? {
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  color: "#ea580c",
                }
              : {
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  color: "#94a3b8",
                }
          }
        >
          <Bookmark
            size={14}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>
    </div>
  );
}

function SetDetailHeader({
  set,
  tab,
  onBack,
}: {
  set: StudySet;
  tab: string;
  onBack: () => void;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const pct = Math.round((set.done / set.total) * 100);
  const accent = TAB_ACCENT[tab];

  return (
    <div
      className="bg-white rounded-3xl mb-4 px-4 py-3.5"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "#f1f5f9",
            border: "2px solid #e2e8f0",
            boxShadow: "0 2px 0 #e2e8f0",
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} className="text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm truncate">{set.title}</p>
          <span className="text-xs font-black" style={{ color: accent.color }}>
            {set.subject}
          </span>
        </div>
        <button
          onClick={() => setBookmarked((p) => !p)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={
            bookmarked
              ? {
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  color: "#ea580c",
                }
              : {
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  color: "#94a3b8",
                }
          }
        >
          <Bookmark
            size={15}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div
            className="h-2.5 rounded-full overflow-hidden"
            style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: progressColor(pct) }}
            />
          </div>
        </div>
        <span
          className="text-xs font-black flex-shrink-0"
          style={{ color: progressColor(pct) }}
        >
          {set.done}/{set.total}
        </span>
        {set.score !== null && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
            style={{
              background: scoreColor(set.score).bg,
              border: `1.5px solid ${scoreColor(set.score).border}`,
            }}
          >
            <Target
              size={11}
              strokeWidth={2.5}
              style={{ color: scoreColor(set.score).color }}
            />
            <span
              className="text-xs font-black"
              style={{ color: scoreColor(set.score).color }}
            >
              {set.score}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  onSidebar,
}: {
  q: (typeof SAMPLE_QUESTIONS)[0];
  onSidebar: (m: SidebarMode) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const statusColor: Record<string, string> = {
    used: "#22c55e",
    unused: "#94a3b8",
    incorrect: "#ef4444",
  };

  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "2px solid #f8fafc" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-black px-2.5 py-1 rounded-xl"
            style={{
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1.5px solid #bfdbfe",
            }}
          >
            {q.subject}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{ background: "#f0fdf4", color: "#16a34a" }}
          >
            {q.tag}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: statusColor[q.status] }}
          />
          <span
            className="text-xs font-bold capitalize"
            style={{ color: statusColor[q.status] }}
          >
            {q.status}
          </span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2">
        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
          {q.text}
        </p>
      </div>

      <div className="px-4 pb-3 space-y-2">
        {q.options.map((opt, i) => {
          const letter = ["A", "B", "C", "D"][i];
          const isSelected = selected === i;
          const isCorrect = selected !== null && i === q.answer;
          const isWrong = selected !== null && isSelected && i !== q.answer;
          return (
            <button
              key={i}
              onClick={() => selected === null && setSelected(i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-left transition-all"
              style={
                isCorrect
                  ? {
                      background: "#f0fdf4",
                      border: "2px solid #22c55e",
                      color: "#15803d",
                      boxShadow: "0 2px 0 #86efac",
                    }
                  : isWrong
                    ? {
                        background: "#fef2f2",
                        border: "2px solid #f87171",
                        color: "#dc2626",
                        boxShadow: "0 2px 0 #fca5a5",
                      }
                    : isSelected
                      ? {
                          background: "#eff6ff",
                          border: "2px solid #3b82f6",
                          color: "#1d4ed8",
                          boxShadow: "0 2px 0 #bfdbfe",
                        }
                      : {
                          background: "#f8fafc",
                          border: "2px solid #e2e8f0",
                          color: "#475569",
                          boxShadow: "0 2px 0 #e2e8f0",
                        }
              }
            >
              <span
                className="w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{
                  background: isCorrect
                    ? "#22c55e"
                    : isWrong
                      ? "#ef4444"
                      : isSelected
                        ? "#3b82f6"
                        : "#e2e8f0",
                  color:
                    isCorrect || isWrong || isSelected ? "#fff" : "#64748b",
                }}
              >
                {letter}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: "2px solid #f8fafc" }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSidebar("explain")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
            style={{
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              color: "#b45309",
              boxShadow: "0 2px 0 #fde68a",
            }}
          >
            <Lightbulb size={12} strokeWidth={2.5} />
            Explain
          </button>
          <button
            onClick={() => onSidebar("report")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
            style={{
              background: "#fef2f2",
              border: "1.5px solid #fecaca",
              color: "#dc2626",
              boxShadow: "0 2px 0 #fecaca",
            }}
          >
            <Flag size={12} strokeWidth={2.5} />
            Report
          </button>
          <button
            onClick={() => onSidebar("comments")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
            style={{
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              color: "#1d4ed8",
              boxShadow: "0 2px 0 #bfdbfe",
            }}
          >
            <MessageCircle size={12} strokeWidth={2.5} />2
          </button>
        </div>
        <button
          onClick={() => setBookmarked((p) => !p)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={
            bookmarked
              ? {
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  color: "#ea580c",
                }
              : {
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  color: "#94a3b8",
                }
          }
        >
          <Bookmark
            size={14}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ s }: { s: (typeof SAMPLE_SUMMARIES)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const preview = s.bullets.slice(0, 2);
  const rest = s.bullets.slice(2);

  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "2px solid #f8fafc" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-black px-2.5 py-1 rounded-xl"
            style={{
              background: "#f5f3ff",
              color: "#7c3aed",
              border: "1.5px solid #ddd6fe",
            }}
          >
            {s.subject}
          </span>
          <span
            className="text-xs font-black px-2 py-0.5 rounded-lg"
            style={{
              background: "#fef9c3",
              color: "#a16207",
              border: "1.5px solid #fde68a",
            }}
          >
            {s.tag}
          </span>
        </div>
        <button
          onClick={() => setBookmarked((p) => !p)}
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ color: bookmarked ? "#ea580c" : "#94a3b8" }}
        >
          <Bookmark
            size={13}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <div className="px-4 pt-3 pb-1">
        <p className="font-black text-slate-900 text-base mb-3">{s.title}</p>
        <ul className="space-y-2">
          {preview.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm font-medium text-slate-700">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: "#7c3aed" }}
              />
              {b}
            </li>
          ))}
          {expanded &&
            rest.map((b, i) => (
              <li
                key={i + 2}
                className="flex gap-2 text-sm font-medium text-slate-700"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: "#7c3aed" }}
                />
                {b}
              </li>
            ))}
        </ul>
      </div>

      {rest.length > 0 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1 mx-4 my-2.5 text-xs font-black transition-colors"
          style={{ color: "#7c3aed" }}
        >
          {expanded ? (
            <>
              <ChevronUp size={13} strokeWidth={3} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={13} strokeWidth={3} />+{rest.length} more points
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ImageCard({ img }: { img: (typeof SAMPLE_IMAGES)[0] }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div
        className="w-full aspect-square flex items-center justify-center relative"
        style={{ background: img.gradient }}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-white/40">
            <Image size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <p className="text-xs font-bold text-white/80">Medical Diagram</p>
        </div>
        <span
          className="absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.9)",
            color: "#1d4ed8",
            border: "1.5px solid #bfdbfe",
          }}
        >
          {img.subject}
        </span>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked((p) => !p)}
            className="flex items-center gap-1 text-xs font-black transition-all"
            style={{ color: liked ? "#ef4444" : "#94a3b8" }}
          >
            <Heart size={18} strokeWidth={2} fill={liked ? "#ef4444" : "none"} />
          </button>
          <button className="text-xs font-black" style={{ color: "#94a3b8" }}>
            <MessageCircle size={18} strokeWidth={2} />
          </button>
        </div>
        <button
          onClick={() => setBookmarked((p) => !p)}
          style={{ color: bookmarked ? "#ea580c" : "#94a3b8" }}
        >
          <Bookmark
            size={18}
            strokeWidth={2}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <div className="px-4 pb-4">
        <span
          className="text-xs font-black px-2 py-0.5 rounded-lg mr-2"
          style={{ background: "#f0fdf4", color: "#16a34a" }}
        >
          {img.tag}
        </span>
        <span className="text-sm font-medium text-slate-700">{img.caption}</span>
      </div>
    </div>
  );
}

function FlashCard({ card }: { card: (typeof SAMPLE_FLASHCARDS)[0] }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="mb-3 cursor-pointer"
      onClick={() => setFlipped((p) => !p)}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full transition-all duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "160px",
        }}
      >
        <div
          className="absolute inset-0 rounded-3xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
            border: "2px solid #bfdbfe",
            boxShadow: "0 3px 0 #bfdbfe",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-black px-2.5 py-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.8)", color: "#1d4ed8" }}
            >
              {card.subject}
            </span>
            <span className="text-xs font-bold text-blue-400">Tap to reveal</span>
          </div>
          <p className="text-sm font-bold text-blue-900 leading-relaxed mt-3">
            {card.front}
          </p>
          <div className="flex justify-end mt-2">
            <RotateCcw size={14} className="text-blue-400" strokeWidth={2.5} />
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-3xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
            border: "2px solid #86efac",
            boxShadow: "0 3px 0 #86efac",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-black px-2.5 py-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.8)", color: "#15803d" }}
            >
              {card.subject}
            </span>
            <span className="text-xs font-bold text-green-500">Answer</span>
          </div>
          <p className="text-sm font-bold text-green-900 leading-relaxed mt-3">
            {card.back}
          </p>
          <div className="flex gap-2 mt-3">
            {["Again", "Hard", "Good", "Easy"].map((label, i) => {
              const colors = [
                ["#fee2e2", "#ef4444", "#fca5a5"],
                ["#fff7ed", "#f97316", "#fed7aa"],
                ["#eff6ff", "#3b82f6", "#bfdbfe"],
                ["#f0fdf4", "#22c55e", "#86efac"],
              ] as const;
              return (
                <button
                  key={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(false);
                  }}
                  className="flex-1 py-1.5 rounded-xl text-xs font-black transition-all"
                  style={{
                    background: colors[i][0],
                    color: colors[i][1],
                    border: `1.5px solid ${colors[i][2]}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetContent({
  tab,
  onSidebar,
}: {
  tab: string;
  onSidebar: (m: SidebarMode, text?: string) => void;
}) {
  if (tab === "questions")
    return (
      <>
        {SAMPLE_QUESTIONS.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            onSidebar={(m) => onSidebar(m, q.text)}
          />
        ))}
      </>
    );
  if (tab === "summary")
    return (
      <>
        {SAMPLE_SUMMARIES.map((s) => (
          <SummaryCard key={s.id} s={s} />
        ))}
      </>
    );
  if (tab === "images")
    return (
      <>
        {SAMPLE_IMAGES.map((img) => (
          <ImageCard key={img.id} img={img} />
        ))}
      </>
    );
  if (tab === "flashcards")
    return (
      <>
        {SAMPLE_FLASHCARDS.map((c) => (
          <FlashCard key={c.id} card={c} />
        ))}
      </>
    );
  return null;
}

function TabContent({
  tab,
  openSet,
  onOpenSet,
  onCloseSet,
  onSidebar,
}: {
  tab: string;
  openSet: StudySet | null;
  onOpenSet: (s: StudySet) => void;
  onCloseSet: () => void;
  onSidebar: (m: SidebarMode, text?: string) => void;
}) {
  if (tab === "library") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
          <BookOpen size={28} className="text-slate-300" strokeWidth={1.5} />
        </div>
        <p className="text-base font-black text-slate-700 mb-1">
          Library coming soon
        </p>
        <p className="text-sm text-slate-400 font-medium">
          Your saved materials will appear here.
        </p>
      </div>
    );
  }

  if (openSet) {
    return (
      <>
        <SetDetailHeader set={openSet} tab={tab} onBack={onCloseSet} />
        <SetContent tab={tab} onSidebar={onSidebar} />
      </>
    );
  }

  const sets = SETS_BY_TAB[tab] ?? [];
  return (
    <>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
        {sets.length} Sets
      </p>
      <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 md:space-y-0">
        {sets.map((set) => (
          <SetCard key={set.id} set={set} tab={tab} onOpen={() => onOpenSet(set)} />
        ))}
      </div>
    </>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <div
        className="flex items-center justify-between px-4 h-14 flex-shrink-0"
        style={{ borderBottom: "3px solid #e2e8f0" }}
      >
        <div className="flex items-center gap-2">
          <Crown size={18} strokeWidth={2.5} style={{ color: "#a855f7" }} />
          <span className="font-black text-slate-900 text-base">Upgrade</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
        >
          <X size={15} strokeWidth={2.5} className="text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6 text-center">
          <div
            className="w-14 h-14 rounded-3xl mx-auto mb-3 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#a855f7,#7c3aed)",
              boxShadow: "0 4px 0 #6d28d9",
            }}
          >
            <Crown size={26} strokeWidth={2} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-1">
            Go Pro, Study Smarter
          </h2>
          <p className="text-sm font-medium text-slate-400 mb-6">
            Unlimited access to everything in Drnote
          </p>
          <div className="flex items-center justify-center mb-6">
            <div
              className="flex p-1 rounded-2xl gap-1"
              style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
            >
              {(["monthly", "yearly"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className="px-5 py-2 rounded-xl font-black text-sm transition-all capitalize"
                  style={
                    billing === b
                      ? {
                          background: "#7c3aed",
                          color: "#fff",
                          boxShadow: "0 2px 0 #6d28d9",
                        }
                      : { color: "#94a3b8" }
                  }
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <button
            className="w-full py-3 rounded-2xl font-black text-sm text-white"
            style={{
              background: "linear-gradient(135deg,#a855f7,#7c3aed)",
              border: "2px solid #6d28d9",
              boxShadow: "0 3px 0 #6d28d9",
            }}
          >
            Upgrade to Pro — {billing === "yearly" ? "$6.99/mo" : "$9.99/mo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsPopup({
  streak,
  rank,
  onClose,
}: {
  streak: number;
  rank: string;
  onClose: () => void;
}) {
  const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const idx = ranks.indexOf(rank);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative w-full max-w-sm mx-4 mb-8 rounded-3xl p-6"
        style={{
          background: "#fff",
          border: "3px solid #fed7aa",
          boxShadow: "0 8px 0 #fed7aa",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff7ed", border: "3px solid #fed7aa" }}
          >
            <Flame size={26} style={{ color: "#f97316" }} strokeWidth={2} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {streak} Day Streak
            </p>
            <p className="text-xs font-semibold text-slate-400">
              Study every day to keep it alive
            </p>
          </div>
        </div>
        <div className="h-0.5 rounded-full mb-5" style={{ background: "#f1f5f9" }} />
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#fefce8", border: "3px solid #fde68a" }}
          >
            <Trophy size={26} style={{ color: "#d97706" }} strokeWidth={2} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {rank} League
            </p>
            <p className="text-xs font-semibold text-slate-400">
              {idx < ranks.length - 1
                ? `Reach ${ranks[idx + 1]} by answering more`
                : "Top league!"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-black text-sm text-white"
          style={{
            background: "#f97316",
            border: "2px solid #ea580c",
            boxShadow: "0 3px 0 #c2410c",
          }}
        >
          Keep Going
        </button>
      </div>
    </div>
  );
}

function DailyPopup({
  used,
  limit,
  onUpgrade,
  onClose,
}: {
  used: number;
  limit: number;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const remaining = limit - used;
  const pct = Math.round((used / limit) * 100);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative w-full max-w-sm mx-4 mb-8 rounded-3xl p-6"
        style={{
          background: "#fff",
          border: "3px solid #bbf7d0",
          boxShadow: "0 8px 0 #bbf7d0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#f0fdf4", border: "2.5px solid #bbf7d0" }}
          >
            <Zap size={22} style={{ color: "#16a34a" }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-black text-slate-900 text-base">Daily Limit</p>
            <p className="text-xs font-semibold text-slate-400">
              {remaining > 0
                ? `${remaining} questions left today`
                : "Limit reached"}
            </p>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden mb-5" style={{ background: "#e2e8f0" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f97316" : "#22c55e",
            }}
          />
        </div>
        <button
          onClick={() => {
            onClose();
            onUpgrade();
          }}
          className="w-full py-3 rounded-2xl font-black text-sm text-white mb-2"
          style={{
            background: "linear-gradient(135deg,#a855f7,#7c3aed)",
            border: "2px solid #6d28d9",
            boxShadow: "0 3px 0 #6d28d9",
          }}
        >
          <Crown size={14} className="inline mr-1.5 -mt-0.5" strokeWidth={2.5} />
          Upgrade for Unlimited
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl font-bold text-sm text-slate-500"
          style={{ background: "#f1f5f9" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function HeaderStatButton({
  onClick,
  icon: Icon,
  label,
  ariaLabel,
  colors,
}: {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  ariaLabel: string;
  colors: {
    background: string;
    border: string;
    shadow: string;
    text: string;
    icon: string;
  };
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl font-black text-sm flex-shrink-0 transition-transform active:translate-y-0.5"
      style={{
        background: colors.background,
        border: `2px solid ${colors.border}`,
        boxShadow: `0 3px 0 ${colors.shadow}`,
        color: colors.text,
      }}
    >
      <Icon size={16} strokeWidth={2.5} style={{ color: colors.icon }} />
      {label}
    </button>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: string; label: string }[] | string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  const items = options.map((o) =>
    typeof o === "string" ? { id: o, label: o } : o
  );

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3 px-1">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        {selected.size > 0 && (
          <span
            className="text-xs font-black px-2 py-0.5 rounded-full"
            style={{ background: "#e8fde7", color: "#3a9e00" }}
          >
            {selected.size}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all"
              style={
                active
                  ? {
                      background: "#58CC02",
                      borderColor: "#46A302",
                      color: "#fff",
                      boxShadow: "0 3px 0 #46A302",
                    }
                  : {
                      background: "#fff",
                      borderColor: "#e2e8f0",
                      color: "#64748b",
                      boxShadow: "0 3px 0 #e2e8f0",
                    }
              }
            >
              {active && <Check size={12} strokeWidth={3} />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActiveFilterPills({
  subjects,
  statuses,
  tags,
  onRemoveSubject,
  onRemoveStatus,
  onRemoveTag,
  onClearAll,
}: {
  subjects: Set<string>;
  statuses: Set<string>;
  tags: Set<string>;
  onRemoveSubject: (v: string) => void;
  onRemoveStatus: (v: string) => void;
  onRemoveTag: (v: string) => void;
  onClearAll: () => void;
}) {
  const total = subjects.size + statuses.size + tags.size;
  if (total === 0) return null;

  const pills = [
    ...[...subjects].map((v) => ({
      label: v,
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      onRemove: () => onRemoveSubject(v),
    })),
    ...[...statuses].map((v) => {
      const s = STATUSES.find((st) => st.id === v);
      return {
        label: s?.label ?? v,
        color: "#7c3aed",
        bg: "#f5f3ff",
        border: "#ddd6fe",
        onRemove: () => onRemoveStatus(v),
      };
    }),
    ...[...tags].map((v) => ({
      label: v,
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
      onRemove: () => onRemoveTag(v),
    })),
  ];

  return (
    <div className="pb-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {pills.map((pill, i) => (
          <div
            key={i}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0"
            style={{
              background: pill.bg,
              border: `1.5px solid ${pill.border}`,
              color: pill.color,
            }}
          >
            {pill.label}
            <button onClick={pill.onRemove} className="ml-0.5 hover:opacity-70">
              <X size={10} strokeWidth={3} />
            </button>
          </div>
        ))}
        <button
          onClick={onClearAll}
          className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-xl"
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            border: "1.5px solid #fecaca",
          }}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

function FilterPage({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (s: Set<string>, st: Set<string>, t: Set<string>) => void;
}) {
  const [subjects, setSubjects] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<Set<string>>(new Set());

  const toggle = (
    setter: Dispatch<SetStateAction<Set<string>>>,
    val: string
  ) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });

  const totalActive = subjects.size + statuses.size + tags.size;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      <div className="bg-white" style={{ borderBottom: "3px solid #e2e8f0" }}>
        <div className={`${PAGE_SHELL} h-16 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
            >
              <ArrowLeft size={17} strokeWidth={2.5} />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900">Filters</h2>
              {totalActive > 0 && (
                <p
                  className="text-xs font-bold -mt-0.5"
                  style={{ color: "#58CC02" }}
                >
                  {totalActive} selected
                </p>
              )}
            </div>
          </div>
          {totalActive > 0 && (
            <button
              onClick={() => {
                setSubjects(new Set());
                setStatuses(new Set());
                setTags(new Set());
              }}
              className="text-sm font-bold px-3 py-1.5 rounded-xl"
              style={{ color: "#dc2626", background: "#fee2e2" }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className={`${PAGE_SHELL} py-6`}>
          <ChipGroup
            label="Subject"
            options={SUBJECTS}
            selected={subjects}
            onToggle={(v) => toggle(setSubjects, v)}
          />
          <ChipGroup
            label="Status"
            options={STATUSES}
            selected={statuses}
            onToggle={(v) => toggle(setStatuses, v)}
          />
          <ChipGroup
            label="Tags"
            options={TAGS}
            selected={tags}
            onToggle={(v) => toggle(setTags, v)}
          />
        </div>
      </div>
      <div className="bg-white py-4" style={{ borderTop: "3px solid #e2e8f0" }}>
        <div className={PAGE_SHELL}>
          <button
            onClick={() => {
              onApply(new Set(subjects), new Set(statuses), new Set(tags));
              onClose();
            }}
            className="w-full text-white font-black py-4 rounded-2xl text-base"
            style={{
              background: "#58CC02",
              border: "2px solid #46A302",
              boxShadow: "0 4px 0 #46A302",
            }}
          >
            {totalActive > 0
              ? `Apply ${totalActive} Filter${totalActive !== 1 ? "s" : ""}`
              : "Show All"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaginationBar({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-white py-3"
      style={{ borderTop: "3px solid #e2e8f0" }}
    >
      <div className={`${PAGE_SHELL} flex items-center justify-between gap-2`}>
        <button
          onClick={() => page > 1 && onChange(page - 1)}
          disabled={page === 1}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black disabled:opacity-30"
          style={{
            background: "#f1f5f9",
            border: "2px solid #e2e8f0",
            boxShadow: "0 3px 0 #e2e8f0",
            color: "#475569",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="w-9 h-9 rounded-xl font-black text-sm flex-shrink-0"
              style={
                p === page
                  ? {
                      background: "#58CC02",
                      border: "2px solid #46A302",
                      boxShadow: "0 3px 0 #46A302",
                      color: "#fff",
                    }
                  : {
                      background: "#fff",
                      border: "2px solid #e2e8f0",
                      boxShadow: "0 3px 0 #e2e8f0",
                      color: "#64748b",
                    }
              }
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => page < total && onChange(page + 1)}
          disabled={page === total}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black disabled:opacity-30"
          style={{
            background: "#f1f5f9",
            border: "2px solid #e2e8f0",
            boxShadow: "0 3px 0 #e2e8f0",
            color: "#475569",
          }}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function DrNoteApp() {
  const [activeTab, setActiveTab] = useState("questions");
  const [filterOpen, setFilterOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null);
  const [sidebarText, setSidebarText] = useState("");
  const [openSet, setOpenSet] = useState<StudySet | null>(null);

  const [appliedSubjects, setAppliedSubjects] = useState<Set<string>>(new Set());
  const [appliedStatuses, setAppliedStatuses] = useState<Set<string>>(new Set());
  const [appliedTags, setAppliedTags] = useState<Set<string>>(new Set());

  const removeSubject = (v: string) =>
    setAppliedSubjects((p) => {
      const n = new Set(p);
      n.delete(v);
      return n;
    });
  const removeStatus = (v: string) =>
    setAppliedStatuses((p) => {
      const n = new Set(p);
      n.delete(v);
      return n;
    });
  const removeTag = (v: string) =>
    setAppliedTags((p) => {
      const n = new Set(p);
      n.delete(v);
      return n;
    });
  const clearAll = () => {
    setAppliedSubjects(new Set());
    setAppliedStatuses(new Set());
    setAppliedTags(new Set());
  };

  const totalFilters =
    appliedSubjects.size + appliedStatuses.size + appliedTags.size;

  const streak = 14;
  const dailyRemaining = DAILY_LIMIT - DAILY_USED;

  const openSidebar = (m: SidebarMode, text?: string) => {
    setSidebarMode(m);
    setSidebarText(text ?? "");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header
        className="bg-white sticky top-0 z-40"
        style={{ borderBottom: "3px solid #e2e8f0" }}
      >
        <div className={`${PAGE_SHELL} py-3 space-y-3`}>
          {/* Level 1: brand left, actions right */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#58CC02,#46A302)",
                  boxShadow: "0 3px 0 #3a8200",
                }}
              >
                <span className="text-white font-black text-lg leading-none">
                  D
                </span>
              </div>
              <span className="font-black text-slate-900 text-xl tracking-tight truncate">
                Dr<span style={{ color: "#58CC02" }}>note</span>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <HeaderStatButton
                onClick={() => setStatsOpen(true)}
                icon={Flame}
                label={String(streak)}
                ariaLabel="View streak and league"
                colors={{
                  background: "#fff7ed",
                  border: "#fdba74",
                  shadow: "#fb923c",
                  text: "#c2410c",
                  icon: "#f97316",
                }}
              />
              <HeaderStatButton
                onClick={() => setDailyOpen(true)}
                icon={Zap}
                label={String(dailyRemaining)}
                ariaLabel="View daily limit"
                colors={{
                  background: dailyRemaining <= 3 ? "#fef2f2" : "#eff6ff",
                  border: dailyRemaining <= 3 ? "#fca5a5" : "#93c5fd",
                  shadow: dailyRemaining <= 3 ? "#f87171" : "#60a5fa",
                  text: dailyRemaining <= 3 ? "#dc2626" : "#1d4ed8",
                  icon: dailyRemaining <= 3 ? "#ef4444" : "#3b82f6",
                }}
              />
              <HeaderStatButton
                onClick={() => setUpgradeOpen(true)}
                icon={Crown}
                label="Pro"
                ariaLabel="Upgrade to Pro"
                colors={{
                  background: "linear-gradient(135deg,#ddd6fe,#c4b5fd)",
                  border: "#a78bfa",
                  shadow: "#8b5cf6",
                  text: "#5b21b6",
                  icon: "#7c3aed",
                }}
              />
              <button
                onClick={() => setFilterOpen(true)}
                aria-label="Filters"
                className="flex items-center justify-center w-10 h-10 rounded-2xl relative flex-shrink-0 transition-transform active:translate-y-0.5"
                style={{
                  background: "#f8fafc",
                  border: "2px solid #cbd5e1",
                  boxShadow: "0 3px 0 #cbd5e1",
                  color: "#475569",
                }}
              >
                <SlidersHorizontal size={16} strokeWidth={2.5} />
                {totalFilters > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                    style={{
                      background: "#58CC02",
                      border: "2px solid #fff",
                    }}
                  >
                    {totalFilters}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Level 2: search, filters, tabs */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                strokeWidth={2.5}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sets..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all"
                style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "2px solid #58CC02";
                  e.currentTarget.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "2px solid #e2e8f0";
                  e.currentTarget.style.background = "#f1f5f9";
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center"
                >
                  <X size={10} strokeWidth={3} className="text-white" />
                </button>
              )}
            </div>

            {totalFilters > 0 && (
              <ActiveFilterPills
                subjects={appliedSubjects}
                statuses={appliedStatuses}
                tags={appliedTags}
                onRemoveSubject={removeSubject}
                onRemoveStatus={removeStatus}
                onRemoveTag={removeTag}
                onClearAll={clearAll}
              />
            )}

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPage(1);
                      setOpenSet(null);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all"
                    style={
                      active
                        ? {
                            background: "#58CC02",
                            color: "#fff",
                            border: "2px solid #46A302",
                            boxShadow: "0 3px 0 #46A302",
                          }
                        : {
                            background: "#fff",
                            color: "#64748b",
                            border: "2px solid #e2e8f0",
                            boxShadow: "0 3px 0 #e2e8f0",
                          }
                    }
                  >
                    <Icon size={13} strokeWidth={2.5} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className={`${PAGE_SHELL} py-4`}>
        <TabContent
          tab={activeTab}
          openSet={openSet}
          onOpenSet={(s) => {
            setOpenSet(s);
            setPage(1);
          }}
          onCloseSet={() => setOpenSet(null)}
          onSidebar={openSidebar}
        />
      </main>

      {openSet && (
        <PaginationBar page={page} total={6} onChange={setPage} />
      )}

      <FilterPage
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(s, st, t) => {
          setAppliedSubjects(s);
          setAppliedStatuses(st);
          setAppliedTags(t);
        }}
      />
      {upgradeOpen && <UpgradeModal onClose={() => setUpgradeOpen(false)} />}
      {statsOpen && (
        <StatsPopup streak={14} rank="Gold" onClose={() => setStatsOpen(false)} />
      )}
      {dailyOpen && (
        <DailyPopup
          used={DAILY_USED}
          limit={DAILY_LIMIT}
          onUpgrade={() => {
            setDailyOpen(false);
            setUpgradeOpen(true);
          }}
          onClose={() => setDailyOpen(false)}
        />
      )}
      <Sidebar
        mode={sidebarMode}
        questionText={sidebarText}
        onClose={() => setSidebarMode(null)}
      />
    </div>
  );
}
