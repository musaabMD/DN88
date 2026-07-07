"use client";

import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  createInitialChat,
  QuestionChatPanel,
  type ChatMessage,
} from "@/components/QuestionChatPanel";
import { ReportSheet } from "@/components/ReportSheet";
import { SessionPauseModal } from "@/components/SessionPauseModal";
import { SessionReportView } from "@/components/SessionReportView";
import { CitationList, type SerializableCitation } from "@/components/tool-ui/citation";
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
  Send,
  RotateCcw,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronRight as Chevron,
  Target,
  MoreVertical,
  Pause,
  Share2,
  ThumbsUp,
  Sparkles,
  BarChart3,
} from "lucide-react";

/** Mobile: centered narrow column. Desktop: full width with edge padding. */
const PAGE_SHELL =
  "w-full max-w-2xl mx-auto px-4 md:max-w-none md:mx-0 md:px-8 lg:px-12 xl:px-16";

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
    explanation:
      "Metformin decreases hepatic glucose output by inhibiting mitochondrial glycerophosphate dehydrogenase, reducing gluconeogenesis. It does not primarily stimulate insulin secretion (sulfonylureas) or block intestinal absorption.",
    citations: [
      {
        id: "c1",
        href: "https://diabetesjournals.org/care/article/d/24/Supplement_1/1/153952/Standards-of-Care-in-Diabetes-2024",
        title: "Pharmacotherapy of hyperglycemia in type 2 diabetes",
        domain: "diabetesjournals.org",
        author: "ADA Standards of Care in Diabetes",
        publishedAt: "2024-01-01T00:00:00.000Z",
        type: "document",
      },
      {
        id: "c2",
        href: "https://accessmedicine.mhmedical.com/book.aspx?bookid=3199",
        title: "Biguanides and hepatic gluconeogenesis",
        domain: "accessmedicine.mhmedical.com",
        author: "Goodman & Gilman's Pharmacology",
        publishedAt: "2023-01-01T00:00:00.000Z",
        type: "document",
      },
      {
        id: "c3",
        href: "https://www.mhmedical.com/firstaid",
        title: "Oral hypoglycemic agents overview",
        domain: "mhmedical.com",
        author: "First Aid for the USMLE Step 1",
        publishedAt: "2025-01-01T00:00:00.000Z",
        type: "document",
      },
    ] satisfies SerializableCitation[],
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
    explanation:
      "The median nerve travels through the carpal tunnel with the flexor tendons. The ulnar nerve passes medial to the tunnel (Guyon's canal region), and the radial nerve does not enter the carpal tunnel.",
    citations: [
      {
        id: "c4",
        href: "https://www.elsevier.com/books/grays-anatomy-for-students/drake/978-0-323-68050-2",
        title: "Carpal tunnel anatomy",
        domain: "elsevier.com",
        author: "Gray's Anatomy for Students",
        publishedAt: "2024-01-01T00:00:00.000Z",
        type: "document",
      },
      {
        id: "c5",
        href: "https://www.ncbi.nlm.nih.gov/books/NBK553179/",
        title: "Median nerve entrapment syndromes",
        domain: "ncbi.nlm.nih.gov",
        author: "StatPearls",
        publishedAt: "2024-01-01T00:00:00.000Z",
        type: "article",
      },
    ] satisfies SerializableCitation[],
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
    explanation:
      "Non-caseating granulomas in the lung are classic for sarcoidosis. Tuberculosis typically shows caseating granulomas. Histoplasmosis and aspergillosis have different histologic patterns.",
    citations: [
      {
        id: "c6",
        href: "https://www.elsevier.com/books/robbins-basic-pathology/kumar/978-0-323-55988-4",
        title: "Sarcoidosis pathology",
        domain: "elsevier.com",
        author: "Robbins Basic Pathology",
        publishedAt: "2023-01-01T00:00:00.000Z",
        type: "document",
      },
      {
        id: "c7",
        href: "https://accessmedicine.mhmedical.com/book.aspx?bookid=3099",
        title: "Granulomatous lung disease differential",
        domain: "accessmedicine.mhmedical.com",
        author: "Harrison's Principles of Internal Medicine",
        publishedAt: "2024-01-01T00:00:00.000Z",
        type: "document",
      },
    ] satisfies SerializableCitation[],
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

function sessionItemCount(tab: string): number {
  if (tab === "questions") return SAMPLE_QUESTIONS.length;
  if (tab === "summary") return SAMPLE_SUMMARIES.length;
  if (tab === "images") return SAMPLE_IMAGES.length;
  if (tab === "flashcards") return SAMPLE_FLASHCARDS.length;
  return 1;
}

type StudySet = {
  id: string;
  title: string;
  subject: string;
  about: string;
  total: number;
  done: number;
  score: number | null;
  tag: string;
  upvotes: number;
};

function filterSets(sets: StudySet[], query: string): StudySet[] {
  const q = query.trim().toLowerCase();
  if (!q) return sets;
  return sets.filter(
    (set) =>
      set.title.toLowerCase().includes(q) ||
      set.subject.toLowerCase().includes(q) ||
      set.tag.toLowerCase().includes(q) ||
      set.about.toLowerCase().includes(q)
  );
}

const QUESTION_SETS: StudySet[] = [
  {
    id: "q1",
    title: "Diabetes & Oral Hypoglycemics",
    subject: "Pharmacology",
    about:
      "High-yield MCQs on metformin, sulfonylureas, and first-line type 2 diabetes management for shelf and board prep.",
    total: 20,
    done: 13,
    score: 85,
    tag: "High Yield",
    upvotes: 248,
  },
  {
    id: "q2",
    title: "Upper Limb Nerve Injuries",
    subject: "Anatomy",
    about:
      "Covers carpal tunnel, Erb's palsy, and peripheral nerve localization with clinical vignettes.",
    total: 15,
    done: 15,
    score: 92,
    tag: "Exam Ready",
    upvotes: 412,
  },
  {
    id: "q3",
    title: "Granulomatous Lung Disease",
    subject: "Pathology",
    about:
      "Compare caseating vs non-caseating granulomas and tie histology findings to sarcoidosis and TB.",
    total: 25,
    done: 4,
    score: 61,
    tag: "Review Needed",
    upvotes: 156,
  },
  {
    id: "q4",
    title: "Cardiac Physiology Basics",
    subject: "Physiology",
    about:
      "Frank-Starling, preload/afterload, and pressure-volume relationships in short exam-style questions.",
    total: 18,
    done: 0,
    score: null,
    tag: "Week 2",
    upvotes: 89,
  },
];

const SUMMARY_SETS: StudySet[] = [
  {
    id: "s1",
    title: "Autonomic Pharmacology Notes",
    subject: "Pharmacology",
    about:
      "Condensed summaries of adrenergic and cholinergic drugs with board-style bullet points.",
    total: 8,
    done: 6,
    score: 88,
    tag: "HY Note",
    upvotes: 193,
  },
  {
    id: "s2",
    title: "Brachial Plexus & Upper Limb",
    subject: "Anatomy",
    about:
      "Roots, trunks, cords, and classic injury patterns including waiter's tip and claw hand.",
    total: 5,
    done: 5,
    score: 95,
    tag: "HY Note",
    upvotes: 327,
  },
  {
    id: "s3",
    title: "Hemodynamics Quick Review",
    subject: "Physiology",
    about:
      "Quick review of CO, SVR, and hemodynamic curves for rapid pre-exam refresh.",
    total: 10,
    done: 0,
    score: null,
    tag: "Week 3",
    upvotes: 74,
  },
];

const IMAGE_SETS: StudySet[] = [
  {
    id: "i1",
    title: "Neuroanatomy Cross-Sections",
    subject: "Anatomy",
    about:
      "Labeled cross-sectional anatomy slides for spinal cord and brainstem orientation.",
    total: 12,
    done: 9,
    score: 78,
    tag: "High Yield",
    upvotes: 201,
  },
  {
    id: "i2",
    title: "Hematopathology Slides",
    subject: "Pathology",
    about:
      "Microscopy sets highlighting Reed-Sternberg cells, lymphoma patterns, and marrow findings.",
    total: 14,
    done: 2,
    score: 50,
    tag: "Exam Ready",
    upvotes: 118,
  },
];

const FLASHCARD_SETS: StudySet[] = [
  {
    id: "f1",
    title: "Drug Mechanisms Rapid Fire",
    subject: "Pharmacology",
    about:
      "Fast recall flashcards for receptor targets, enzyme inhibitors, and mechanism mnemonics.",
    total: 30,
    done: 22,
    score: 81,
    tag: "High Yield",
    upvotes: 364,
  },
  {
    id: "f2",
    title: "Muscles & Innervation",
    subject: "Anatomy",
    about:
      "SITS rotator cuff, peripheral nerve supply, and motor exam correlations.",
    total: 24,
    done: 24,
    score: 96,
    tag: "Master",
    upvotes: 521,
  },
  {
    id: "f3",
    title: "Coagulation Disorders",
    subject: "Pathology",
    about:
      "DIC, hemophilia, and clotting pathway defects with lab pattern recognition.",
    total: 16,
    done: 5,
    score: 70,
    tag: "Week 4",
    upvotes: 142,
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

type SidebarMode = "explain" | "report" | "comments";

function SetIntroView({
  set,
  tab,
  itemCount,
  onStart,
  onClose,
}: {
  set: StudySet;
  tab: string;
  itemCount: number;
  onStart: () => void;
  onClose: () => void;
}) {
  const accent = TAB_ACCENT[tab] ?? TAB_ACCENT.questions;
  const Icon = accent.icon;
  const pct = Math.round((set.done / set.total) * 100);

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
      <div className="flex-1 flex flex-col justify-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: accent.bg,
            border: `2px solid ${accent.border}`,
          }}
        >
          <Icon size={26} strokeWidth={2.5} style={{ color: accent.color }} />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          {set.subject} · {set.tag}
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight">
          {set.title}
        </h1>
        <p className="text-base font-medium text-slate-600 leading-relaxed mb-6">
          {set.about}
        </p>
        <div
          className="rounded-2xl p-4 mb-8 space-y-3"
          style={{ background: "#f8fafc", border: "2px solid #e2e8f0" }}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-500">Items in this set</span>
            <span className="font-black text-slate-800">{itemCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-500">Your progress</span>
            <span className="font-black" style={{ color: progressColor(pct) }}>
              {set.done}/{set.total}
            </span>
          </div>
          {set.score !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-500">Best score</span>
              <span className="font-black" style={{ color: scoreColor(set.score).color }}>
                {set.score}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-4">
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl font-black text-base text-white active:translate-y-0.5"
          style={{
            background: "#58CC02",
            border: "2px solid #46A302",
            boxShadow: "0 4px 0 #46A302",
          }}
        >
          Start
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-black text-sm text-slate-500"
        >
          Back to sets
        </button>
      </div>
    </div>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = Math.round((set.done / set.total) * 100);

  const menuItems = [
    { label: "Share", icon: Share2 },
    { label: "Resume", icon: ChevronRight },
    { label: "Result", icon: BarChart3 },
    { label: "Restart", icon: RotateCcw },
    { label: "Report", icon: Flag },
  ] as const;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden relative"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <button onClick={onOpen} className="w-full text-left px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
            {set.title}
          </p>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              aria-label="Set options"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
            >
              <MoreVertical size={16} strokeWidth={2.5} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div
                  className="absolute right-0 top-9 z-20 min-w-[140px] rounded-xl bg-white py-1 shadow-lg"
                  style={{ border: "1.5px solid #e2e8f0" }}
                >
                  {menuItems.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Icon size={14} strokeWidth={2.5} />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold text-slate-500">{set.subject}</span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-slate-600">
            <ThumbsUp size={13} strokeWidth={2.5} className="text-green-600" />
            {set.upvotes.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "#f1f5f9" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: progressColor(pct) }}
              />
            </div>
          </div>
          <span
            className="text-xs font-black shrink-0"
            style={{ color: progressColor(pct) }}
          >
            {set.done}/{set.total}
          </span>
        </div>
      </button>
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

function SessionNavButton({
  onClick,
  disabled,
  children,
  ariaLabel,
  variant = "neutral",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  ariaLabel: string;
  variant?: "neutral" | "primary" | "danger" | "ai";
}) {
  const styles = {
    neutral: {
      background: "#fff",
      border: "2px solid #e2e8f0",
      color: "#64748b",
      boxShadow: "0 2px 0 #e2e8f0",
    },
    primary: {
      background: "#58CC02",
      border: "2px solid #46A302",
      color: "#fff",
      boxShadow: "0 3px 0 #46A302",
    },
    danger: {
      background: "#fff",
      border: "2px solid #fecaca",
      color: "#dc2626",
      boxShadow: "0 2px 0 #fecaca",
    },
    ai: {
      background: "#f5f3ff",
      border: "2px solid #ddd6fe",
      color: "#6d28d9",
      boxShadow: "0 2px 0 #ddd6fe",
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5"
      style={styles}
    >
      {children}
    </button>
  );
}

function LessonQuestionView({
  q,
  onAnswer,
}: {
  q: (typeof SAMPLE_QUESTIONS)[0];
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const citations = "citations" in q ? q.citations : [];

  const pickOption = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    onAnswer(index === q.answer);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="text-xs font-bold text-slate-500">{q.subject}</span>
        <button
          onClick={() => setBookmarked((prev) => !prev)}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={
            bookmarked
              ? {
                  background: "#fff7ed",
                  border: "2px solid #fed7aa",
                  color: "#ea580c",
                }
              : {
                  background: "#f8fafc",
                  border: "2px solid #e2e8f0",
                  color: "#94a3b8",
                }
          }
        >
          <Bookmark
            size={18}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-snug">
        {q.text}
      </h2>

      <div className="flex flex-col gap-3 mb-6">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = answered && i === q.answer;
          const isWrong = answered && isSelected && i !== q.answer;
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pickOption(i)}
              className="w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm md:text-base transition-all active:scale-[0.99] disabled:cursor-default"
              style={
                isCorrect
                  ? {
                      background: "#f0fdf4",
                      borderColor: "#22c55e",
                      color: "#15803d",
                      boxShadow: "0 3px 0 #86efac",
                    }
                  : isWrong
                    ? {
                        background: "#fef2f2",
                        borderColor: "#f87171",
                        color: "#dc2626",
                        boxShadow: "0 3px 0 #fca5a5",
                      }
                    : isSelected
                      ? {
                          background: "#eff6ff",
                          borderColor: "#3b82f6",
                          color: "#1d4ed8",
                          boxShadow: "0 3px 0 #bfdbfe",
                        }
                      : {
                          background: "#fff",
                          borderColor: "#e2e8f0",
                          color: "#334155",
                          boxShadow: "0 3px 0 #e2e8f0",
                        }
              }
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className="rounded-2xl p-5 md:p-6 mb-4 space-y-4"
          style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}
        >
          <p className="text-sm font-black uppercase tracking-widest text-green-700">
            Explanation
          </p>
          <p className="text-base md:text-lg font-medium text-green-950 leading-relaxed">
            {q.explanation}
          </p>
          {citations.length > 0 && (
            <CitationList
              id={`citation-list-q${q.id}`}
              citations={citations}
              variant="stacked"
            />
          )}
        </div>
      )}
    </div>
  );
}

function SetSessionView({
  set,
  tab,
  page,
  onPageChange,
  onClose,
}: {
  set: StudySet;
  tab: string;
  page: number;
  onPageChange: (p: number) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "active" | "report">("intro");
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [subjectStats, setSubjectStats] = useState<
    Record<string, { correct: number; total: number }>
  >({});
  const [currentAnswered, setCurrentAnswered] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [questionChats, setQuestionChats] = useState<Record<string, ChatMessage[]>>({});
  const sessionStartRef = useRef<number | null>(null);
  const sessionEndRef = useRef<number | null>(null);

  const total = sessionItemCount(tab);
  const idx = Math.min(page, total) - 1;
  const remaining = Math.max(total - page, 0);
  const progressPct =
    phase === "intro"
      ? 0
      : phase === "report"
        ? 100
        : total > 0
          ? (page / total) * 100
          : 0;
  const liveScore =
    sessionAnswered > 0
      ? Math.round((sessionCorrect / sessionAnswered) * 100)
      : 0;

  const currentQuestion =
    tab === "questions" ? SAMPLE_QUESTIONS[idx] : undefined;
  const chatKey =
    currentQuestion !== undefined ? `${set.id}:${currentQuestion.id}` : "";

  const currentChat =
    chatKey && questionChats[chatKey]
      ? questionChats[chatKey]
      : currentQuestion
        ? createInitialChat(currentQuestion.text)
        : [];

  useEffect(() => {
    setCurrentAnswered(false);
  }, [page, phase]);

  const updateChat = (messages: ChatMessage[]) => {
    if (!chatKey) return;
    setQuestionChats((prev) => ({ ...prev, [chatKey]: messages }));
  };

  const finishSession = () => {
    sessionEndRef.current = Date.now();
    setChatOpen(false);
    setPauseOpen(false);
    setPhase("report");
  };

  const goNext = () => {
    if (tab === "questions" && !currentAnswered) return;
    setChatOpen(false);
    if (page < total) onPageChange(page + 1);
    else finishSession();
  };

  const goBack = () => {
    setChatOpen(false);
    if (page > 1) onPageChange(page - 1);
  };

  const handleCloseRequest = () => {
    if (phase === "intro") {
      onClose();
      return;
    }
    if (phase === "report") {
      onClose();
      return;
    }
    setPauseOpen(true);
  };

  const openChat = () => {
    if (!currentQuestion || !chatKey) return;
    if (!questionChats[chatKey]) {
      setQuestionChats((prev) => ({
        ...prev,
        [chatKey]: createInitialChat(currentQuestion.text),
      }));
    }
    setChatOpen(true);
  };

  const elapsedSeconds =
    sessionStartRef.current && sessionEndRef.current
      ? Math.max(
          1,
          Math.round((sessionEndRef.current - sessionStartRef.current) / 1000)
        )
      : sessionStartRef.current
        ? Math.max(
            1,
            Math.round((Date.now() - sessionStartRef.current) / 1000)
          )
        : 0;

  const renderSlide = () => {
    if (phase === "report") {
      return (
        <SessionReportView
          setTitle={set.title}
          elapsedSeconds={elapsedSeconds}
          overallScore={liveScore}
          subjectScores={subjectStats}
          onClose={onClose}
        />
      );
    }

    if (phase === "intro") {
      return (
        <SetIntroView
          set={set}
          tab={tab}
          itemCount={total}
          onStart={() => {
            sessionStartRef.current = Date.now();
            setPhase("active");
            onPageChange(1);
          }}
          onClose={onClose}
        />
      );
    }

    if (tab === "questions") {
      const q = SAMPLE_QUESTIONS[idx];
      if (!q) return null;
      return (
        <LessonQuestionView
          key={`${q.id}-${page}`}
          q={q}
          onAnswer={(correct) => {
            setCurrentAnswered(true);
            setSessionAnswered((n) => n + 1);
            if (correct) setSessionCorrect((n) => n + 1);
            setSubjectStats((prev) => {
              const cur = prev[q.subject] ?? { correct: 0, total: 0 };
              return {
                ...prev,
                [q.subject]: {
                  correct: cur.correct + (correct ? 1 : 0),
                  total: cur.total + 1,
                },
              };
            });
          }}
        />
      );
    }
    if (tab === "summary") {
      const s = SAMPLE_SUMMARIES[idx];
      if (!s) return null;
      return <SummaryCard s={s} />;
    }
    if (tab === "images") {
      const img = SAMPLE_IMAGES[idx];
      if (!img) return null;
      return <ImageCard img={img} />;
    }
    if (tab === "flashcards") {
      const card = SAMPLE_FLASHCARDS[idx];
      if (!card) return null;
      return (
        <div className="flex items-center justify-center py-4">
          <FlashCard card={card} />
        </div>
      );
    }
    return (
      <p className="text-center text-slate-500 font-semibold py-20">
        No content for this tab yet.
      </p>
    );
  };

  const showSessionFooter = phase === "active";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {phase !== "report" && (
        <div
          className="flex items-center gap-3 px-4 h-14 flex-shrink-0 bg-white"
          style={{ borderBottom: "2px solid #e2e8f0" }}
        >
          <button
            onClick={handleCloseRequest}
            aria-label="Close session"
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ color: "#94a3b8" }}
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#58CC02,#46A302)",
                boxShadow: "0 2px 0 #3a8200",
              }}
            >
              <span className="text-white font-black text-sm leading-none">D</span>
            </div>
            <span className="font-black text-slate-900 text-base hidden sm:block">
              Drnote
            </span>
          </div>

          <div
            className="flex-1 h-3 rounded-full overflow-hidden min-w-0"
            style={{ background: "#e2e8f0" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%`, background: "#58CC02" }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <div className="max-w-3xl mx-auto w-full px-4 py-6 min-h-full flex flex-col flex-1">
          {renderSlide()}
        </div>
      </div>

      {showSessionFooter && (
        <div
          className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3 space-y-3"
          style={{ borderTopWidth: "2px" }}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-600">
              Question {page} of {total}
              <span className="text-slate-400 font-semibold">
                {" "}
                · {remaining} remaining
              </span>
            </p>
            <button
              onClick={() => setPauseOpen(true)}
              aria-label="Pause session"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-slate-600 border-2 border-slate-200 bg-white"
            >
              <Pause size={13} strokeWidth={2.5} />
              Pause
            </button>
          </div>

          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SessionNavButton
                onClick={goBack}
                disabled={page <= 1}
                ariaLabel="Previous question"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </SessionNavButton>
              {tab === "questions" && (
                <SessionNavButton
                  onClick={() => setReportOpen(true)}
                  ariaLabel="Report issue"
                  variant="danger"
                >
                  <Flag size={18} strokeWidth={2.5} />
                </SessionNavButton>
              )}
            </div>

            <div className="flex items-center gap-2">
              {tab === "questions" && (
                <SessionNavButton
                  onClick={openChat}
                  ariaLabel="Explain with AI"
                  variant="ai"
                >
                  <Sparkles size={18} strokeWidth={2.5} />
                </SessionNavButton>
              )}
              <SessionNavButton
                onClick={goNext}
                disabled={tab === "questions" && !currentAnswered}
                ariaLabel="Next question"
                variant="primary"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </SessionNavButton>
            </div>
          </div>
        </div>
      )}

      <SessionPauseModal
        open={pauseOpen}
        remaining={remaining}
        onResume={() => setPauseOpen(false)}
        onSaveLater={() => {
          setPauseOpen(false);
          onClose();
        }}
        onEnd={finishSession}
      />

      {currentQuestion && (
        <>
          <QuestionChatPanel
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            questionText={currentQuestion.text}
            messages={currentChat}
            onMessagesChange={updateChat}
          />
          <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
        </>
      )}
    </div>
  );
}

function SessionSlideShell({
  children,
  onSkip,
  onContinue,
  continueLabel,
}: {
  children: ReactNode;
  onSkip: () => void;
  onContinue: () => void;
  continueLabel: string;
}) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <div
        className="flex-shrink-0 border-t border-slate-200 bg-white -mx-4 px-4 py-4 mt-auto"
        style={{ borderTopWidth: "2px" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onSkip}
            className="px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-wide text-slate-400 border-2 border-slate-200 bg-white"
          >
            Skip
          </button>
          <button
            onClick={onContinue}
            className="px-10 py-3 rounded-2xl text-sm font-black uppercase tracking-wide text-white active:translate-y-0.5"
            style={{
              background: "#58CC02",
              border: "2px solid #46A302",
              boxShadow: "0 4px 0 #46A302",
            }}
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </>
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
  search,
}: {
  tab: string;
  openSet: StudySet | null;
  onOpenSet: (s: StudySet) => void;
  search: string;
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
    return null;
  }

  const sets = filterSets(SETS_BY_TAB[tab] ?? [], search);
  return (
    <>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
        {sets.length} Set{sets.length !== 1 ? "s" : ""}
        {search.trim() ? ` matching "${search.trim()}"` : ""}
      </p>
      {sets.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="font-black text-slate-600 mb-1">No sets found</p>
          <p className="text-sm text-slate-400 font-medium">
            Try a different search term or clear filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 md:space-y-0">
          {sets.map((set) => (
            <SetCard key={set.id} set={set} tab={tab} onOpen={() => onOpenSet(set)} />
          ))}
        </div>
      )}
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

function BrowseHeader({
  search,
  setSearch,
  activeTab,
  onTabChange,
  totalFilters,
  streak,
  dailyRemaining,
  appliedSubjects,
  appliedStatuses,
  appliedTags,
  onStatsOpen,
  onDailyOpen,
  onUpgradeOpen,
  onFilterOpen,
  onRemoveSubject,
  onRemoveStatus,
  onRemoveTag,
  onClearAll,
}: {
  search: string;
  setSearch: (v: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalFilters: number;
  streak: number;
  dailyRemaining: number;
  appliedSubjects: Set<string>;
  appliedStatuses: Set<string>;
  appliedTags: Set<string>;
  onStatsOpen: () => void;
  onDailyOpen: () => void;
  onUpgradeOpen: () => void;
  onFilterOpen: () => void;
  onRemoveSubject: (v: string) => void;
  onRemoveStatus: (v: string) => void;
  onRemoveTag: (v: string) => void;
  onClearAll: () => void;
}) {
  const searchField = (
    <div className="flex w-full items-stretch rounded-full overflow-hidden border-2 border-slate-200 bg-white focus-within:border-[#58CC02] transition-colors">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search sets..."
        className="flex-1 min-w-0 px-4 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none bg-transparent"
      />
      {search ? (
        <button
          onClick={() => setSearch("")}
          aria-label="Clear search"
          className="px-3 flex items-center justify-center text-slate-400 hover:text-slate-600"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      ) : null}
      <button
        aria-label="Search"
        className="px-4 flex items-center justify-center border-l-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      >
        <Search size={18} strokeWidth={2.5} />
      </button>
    </div>
  );

  return (
    <header
      className="bg-white sticky top-0 z-40"
      style={{ borderBottom: "1px solid #e2e8f0" }}
    >
      <div className={`${PAGE_SHELL} py-2 space-y-2`}>
        <div className="flex items-center gap-3 md:gap-4 min-h-[44px]">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#58CC02,#46A302)",
                boxShadow: "0 2px 0 #3a8200",
              }}
            >
              <span className="text-white font-black text-base leading-none">D</span>
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight hidden sm:block">
              Drnote
            </span>
          </div>

          <div className="hidden md:flex flex-1 max-w-[640px] mx-2 lg:mx-8">
            {searchField}
          </div>

          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
            <HeaderStatButton
              onClick={onStatsOpen}
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
              onClick={onDailyOpen}
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
              onClick={onUpgradeOpen}
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
              onClick={onFilterOpen}
              aria-label="Filters"
              className="flex items-center justify-center w-9 h-9 rounded-xl relative flex-shrink-0 transition-transform active:translate-y-0.5"
              style={{
                background: "#f8fafc",
                border: "2px solid #cbd5e1",
                boxShadow: "0 2px 0 #cbd5e1",
                color: "#475569",
              }}
            >
              <SlidersHorizontal size={15} strokeWidth={2.5} />
              {totalFilters > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white"
                  style={{ background: "#58CC02", border: "2px solid #fff" }}
                >
                  {totalFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="md:hidden">{searchField}</div>

        {totalFilters > 0 && (
          <ActiveFilterPills
            subjects={appliedSubjects}
            statuses={appliedStatuses}
            tags={appliedTags}
            onRemoveSubject={onRemoveSubject}
            onRemoveStatus={onRemoveStatus}
            onRemoveTag={onRemoveTag}
            onClearAll={onClearAll}
          />
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors"
                style={
                  active
                    ? {
                        background: "#58CC02",
                        color: "#fff",
                        border: "1.5px solid #46A302",
                      }
                    : {
                        background: "#f1f5f9",
                        color: "#475569",
                        border: "1.5px solid transparent",
                      }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
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

  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${openSet ? "" : "pb-8"}`}>
      {openSet ? (
        <SetSessionView
          set={openSet}
          tab={activeTab}
          page={page}
          onPageChange={setPage}
          onClose={() => setOpenSet(null)}
        />
      ) : (
        <>
          <BrowseHeader
            search={search}
            setSearch={setSearch}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setPage(1);
              setOpenSet(null);
            }}
            totalFilters={totalFilters}
            streak={streak}
            dailyRemaining={dailyRemaining}
            appliedSubjects={appliedSubjects}
            appliedStatuses={appliedStatuses}
            appliedTags={appliedTags}
            onStatsOpen={() => setStatsOpen(true)}
            onDailyOpen={() => setDailyOpen(true)}
            onUpgradeOpen={() => setUpgradeOpen(true)}
            onFilterOpen={() => setFilterOpen(true)}
            onRemoveSubject={removeSubject}
            onRemoveStatus={removeStatus}
            onRemoveTag={removeTag}
            onClearAll={clearAll}
          />

          <main className={`${PAGE_SHELL} py-4`}>
            <TabContent
              tab={activeTab}
              openSet={openSet}
              search={search}
              onOpenSet={(s) => {
                setOpenSet(s);
                setPage(1);
              }}
            />
          </main>
        </>
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
    </div>
  );
}
