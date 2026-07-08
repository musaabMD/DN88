import type { SerializableCitation } from "@/components/tool-ui/citation";

export type StudySet = {
  id: string;
  title: string;
  subject: string;
  about: string;
  total: number;
  done: number;
  score: number | null;
  tag: string;
  upvotes: number;
  comments: number;
};

export const QUESTION_SETS: StudySet[] = [
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
    comments: 142,
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
    comments: 240,
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
    comments: 91,
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
    comments: 52,
  },
];

export const SUMMARY_SETS: StudySet[] = [
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
    comments: 112,
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
    comments: 189,
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
    comments: 43,
  },
];

export const IMAGE_SETS: StudySet[] = [
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
    comments: 117,
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
    comments: 68,
  },
];

export const FLASHCARD_SETS: StudySet[] = [
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
    comments: 211,
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
    comments: 302,
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
    comments: 83,
  },
];

export const SETS_BY_TAB: Record<string, StudySet[]> = {
  questions: QUESTION_SETS,
  summary: SUMMARY_SETS,
  images: IMAGE_SETS,
  flashcards: FLASHCARD_SETS,
};

export const SAMPLE_QUESTIONS = [
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
    citations: [] satisfies SerializableCitation[],
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
      "Non-caseating granulomas in the lung are classic for sarcoidosis. Tuberculosis typically shows caseating granulomas.",
    citations: [] satisfies SerializableCitation[],
  },
];

export const SAMPLE_SUMMARIES = [
  {
    id: 1,
    subject: "Pharmacology",
    title: "Beta Blockers",
    bullets: [
      "Competitively block β-adrenergic receptors",
      "Cardioselective (β1): metoprolol, atenolol",
    ],
    tag: "HY Note",
  },
];

export const SAMPLE_IMAGES = [
  {
    id: 1,
    subject: "Anatomy",
    caption: "Cross-section of the spinal cord",
    tag: "High Yield",
    gradient: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  },
];

export const SAMPLE_FLASHCARDS = [
  {
    id: 1,
    subject: "Pharmacology",
    front: "What is the mechanism of action of ACE inhibitors?",
    back: "Block conversion of Ang I → Ang II",
  },
];

export function sessionItemCount(tab: string): number {
  if (tab === "questions") return SAMPLE_QUESTIONS.length;
  if (tab === "summary") return SAMPLE_SUMMARIES.length;
  if (tab === "images") return SAMPLE_IMAGES.length;
  if (tab === "flashcards") return SAMPLE_FLASHCARDS.length;
  return 1;
}

export function getSetById(tab: string, setId: string): StudySet | undefined {
  return (SETS_BY_TAB[tab] ?? []).find((set) => set.id === setId);
}

export function getAllSetStaticParams(): Array<{ tab: string; setId: string }> {
  return Object.entries(SETS_BY_TAB).flatMap(([tab, sets]) =>
    sets.map((set) => ({ tab, setId: set.id }))
  );
}

/** UI model for QuizSetScreen — replace with API mapping later. */
export type QuizSetScreenData = {
  title: string;
  category: string;
  items: number;
  progress: number;
  best: number;
  incorrectCount: number;
  flaggedCount: number;
};

export function toQuizSetScreenData(
  set: StudySet,
  tab: string
): QuizSetScreenData {
  const progress = set.total > 0 ? Math.round((set.done / set.total) * 100) : 0;
  return {
    title: set.title,
    category: set.subject,
    items: sessionItemCount(tab),
    progress,
    best: set.score ?? 0,
    // Mock counts until backend provides per-set stats
    incorrectCount: set.id === "q1" ? 3 : Math.min(3, set.total - set.done),
    flaggedCount: set.id === "q1" ? 2 : Math.min(2, set.done),
  };
}

export type SessionReportData = {
  durationSec: number;
  subjects: Array<{ subject: string; correct: number; total: number }>;
  missedCards: Array<{ id: string; prompt: string; subject: string }>;
  streakBest: number;
};

/** Mock session report — replace with API/session state when backend arrives. */
export function getSessionReportData(
  set: StudySet,
  tab: string
): SessionReportData {
  if (set.id === "q1" && tab === "questions") {
    return {
      durationSec: 305,
      subjects: [
        { subject: "Sulfonylureas", correct: 6, total: 8 },
        { subject: "Metformin & Biguanides", correct: 7, total: 7 },
        { subject: "SGLT2 Inhibitors", correct: 3, total: 6 },
        { subject: "DPP-4 / GLP-1 Agents", correct: 2, total: 5 },
      ],
      missedCards: [
        {
          id: "c1",
          prompt: "First-line agent contraindicated in eGFR < 30",
          subject: "Metformin & Biguanides",
        },
        {
          id: "c2",
          prompt: "Class associated with euglycemic DKA",
          subject: "SGLT2 Inhibitors",
        },
        {
          id: "c3",
          prompt: "Agent requiring dose reduction with renal impairment",
          subject: "DPP-4 / GLP-1 Agents",
        },
      ],
      streakBest: 9,
    };
  }

  const items = sessionItemCount(tab);
  const score = set.score ?? 72;
  const correct = Math.round((score / 100) * items);
  const missed = Math.max(items - correct, 0);

  const subjects =
    tab === "questions"
      ? SAMPLE_QUESTIONS.reduce<
          Record<string, { correct: number; total: number }>
        >((acc, q) => {
          const entry = acc[q.subject] ?? { correct: 0, total: 0 };
          entry.total += 1;
          if (q.status !== "incorrect") entry.correct += 1;
          acc[q.subject] = entry;
          return acc;
        }, {})
      : { [set.subject]: { correct, total: items } };

  const missedCards =
    tab === "questions"
      ? SAMPLE_QUESTIONS.filter((q) => q.status === "incorrect").map((q) => ({
          id: String(q.id),
          prompt: q.text,
          subject: q.subject,
        }))
      : missed > 0
        ? [
            {
              id: "m1",
              prompt: `Review ${missed} missed item${missed === 1 ? "" : "s"} from this set`,
              subject: set.subject,
            },
          ]
        : [];

  return {
    durationSec: Math.max(items * 45, 120),
    subjects: Object.entries(subjects).map(([subject, stats]) => ({
      subject,
      ...stats,
    })),
    missedCards,
    streakBest: Math.min(correct, 5),
  };
}
