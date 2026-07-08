import type { SerializableCitation } from "@/components/tool-ui/citation";
import type { ContentTab } from "@/lib/routes";

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
  /** Library bookmarks point at content in another tab/set. */
  sourceTab?: ContentTab;
  sourceSetId?: string;
};

export type QuestionItem = {
  id: number;
  subject: string;
  text: string;
  options: string[];
  answer: number;
  tag: string;
  status: string;
  explanation: string;
  citations?: SerializableCitation[];
};

export type NoteItem = {
  id: number;
  subject: string;
  title: string;
  bullets: string[];
  tag: string;
};

export type ImageItem = {
  id: number;
  subject: string;
  caption: string;
  tag: string;
  gradient: string;
};

export type FlashcardItem = {
  id: number;
  subject: string;
  front: string;
  back: string;
};

export type SessionItem =
  | QuestionItem
  | NoteItem
  | ImageItem
  | FlashcardItem;

export const TAB_ITEM_LABEL: Record<string, string> = {
  questions: "questions",
  summary: "notes",
  images: "images",
  flashcards: "cards",
  library: "items",
};

export const TAB_SET_LABEL: Record<string, string> = {
  questions: "practice sets",
  summary: "note sets",
  images: "image sets",
  flashcards: "card sets",
  library: "saved sets",
};

const QUESTIONS_BY_SET: Record<string, QuestionItem[]> = {
  q1: [
    {
      id: 1,
      subject: "Pharmacology",
      text: "A 45-year-old patient is prescribed metformin for type 2 diabetes. Which is the primary mechanism of metformin?",
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
        "Metformin decreases hepatic glucose output by reducing gluconeogenesis. It does not primarily stimulate insulin secretion.",
      citations: [],
    },
    {
      id: 2,
      subject: "Pharmacology",
      text: "Which oral hypoglycemic is associated with lactic acidosis risk?",
      options: ["Glipizide", "Metformin", "Sitagliptin", "Pioglitazone"],
      answer: 1,
      tag: "High Yield",
      status: "used",
      explanation:
        "Metformin can cause lactic acidosis, especially with renal impairment. Sulfonylureas cause hypoglycemia instead.",
      citations: [],
    },
  ],
  q2: [
    {
      id: 1,
      subject: "Anatomy",
      text: "Which nerve passes through the carpal tunnel?",
      options: ["Ulnar nerve", "Radial nerve", "Median nerve", "Axillary nerve"],
      answer: 2,
      tag: "Exam Ready",
      status: "used",
      explanation: "The median nerve travels through the carpal tunnel with the flexor tendons.",
      citations: [],
    },
    {
      id: 2,
      subject: "Anatomy",
      text: "Erb's palsy typically affects which nerve roots?",
      options: ["C8-T1", "C5-C6", "C7 only", "T1-T2"],
      answer: 1,
      tag: "Exam Ready",
      status: "incorrect",
      explanation: "Erb's palsy involves C5-C6, producing waiter's tip deformity.",
      citations: [],
    },
  ],
  q3: [
    {
      id: 1,
      subject: "Pathology",
      text: "Non-caseating granulomas in the lung are most consistent with:",
      options: ["Tuberculosis", "Sarcoidosis", "Histoplasmosis", "Aspergillosis"],
      answer: 1,
      tag: "Review Needed",
      status: "incorrect",
      explanation: "Sarcoidosis classically shows non-caseating granulomas.",
      citations: [],
    },
  ],
  q4: [
    {
      id: 1,
      subject: "Physiology",
      text: "Frank-Starling law relates preload to:",
      options: [
        "Heart rate",
        "Stroke volume",
        "Systemic vascular resistance",
        "Venous return only",
      ],
      answer: 1,
      tag: "Week 2",
      status: "unused",
      explanation: "Increased preload stretches myocardium and increases stroke volume up to a point.",
      citations: [],
    },
  ],
};

const NOTES_BY_SET: Record<string, NoteItem[]> = {
  s1: [
    {
      id: 1,
      subject: "Pharmacology",
      title: "Adrenergic agonists",
      bullets: [
        "α1 → vasoconstriction; α2 → ↓ NE release",
        "β1 → ↑ HR and contractility; β2 → bronchodilation",
        "Epinephrine activates α and β receptors",
      ],
      tag: "HY Note",
    },
    {
      id: 2,
      subject: "Pharmacology",
      title: "Cholinergic drugs",
      bullets: [
        "Direct agonists: bethanechol, pilocarpine",
        "Indirect: neostigmine, physostigmine",
        "Atropine blocks muscarinic receptors",
      ],
      tag: "HY Note",
    },
  ],
  s2: [
    {
      id: 1,
      subject: "Anatomy",
      title: "Brachial plexus overview",
      bullets: [
        "Roots C5-T1 → trunks → divisions → cords → branches",
        "Upper trunk (C5-C6) → Erb's palsy",
        "Lower trunk (C8-T1) → Klumpke palsy",
      ],
      tag: "HY Note",
    },
    {
      id: 2,
      subject: "Anatomy",
      title: "Rotator cuff (SITS)",
      bullets: [
        "Supraspinatus: abduction initiation",
        "Infraspinatus & teres minor: external rotation",
        "Subscapularis: internal rotation",
      ],
      tag: "HY Note",
    },
  ],
  s3: [
    {
      id: 1,
      subject: "Physiology",
      title: "Cardiac output determinants",
      bullets: [
        "CO = HR × SV",
        "SV depends on preload, afterload, contractility",
        "MAP ≈ CO × SVR",
      ],
      tag: "Week 3",
    },
  ],
};

const IMAGES_BY_SET: Record<string, ImageItem[]> = {
  i1: [
    {
      id: 1,
      subject: "Anatomy",
      caption: "Cervical spinal cord cross-section",
      tag: "High Yield",
      gradient: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
    },
    {
      id: 2,
      subject: "Anatomy",
      caption: "Brainstem level: medulla vs pons",
      tag: "High Yield",
      gradient: "linear-gradient(135deg,#e0e7ff,#c7d2fe)",
    },
  ],
  i2: [
    {
      id: 1,
      subject: "Pathology",
      caption: "Reed-Sternberg cells in Hodgkin lymphoma",
      tag: "Exam Ready",
      gradient: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
    },
    {
      id: 2,
      subject: "Pathology",
      caption: "Bone marrow aspirate with blasts",
      tag: "Exam Ready",
      gradient: "linear-gradient(135deg,#fef3c7,#fde68a)",
    },
  ],
};

const FLASHCARDS_BY_SET: Record<string, FlashcardItem[]> = {
  f1: [
    {
      id: 1,
      subject: "Pharmacology",
      front: "ACE inhibitor mechanism?",
      back: "Blocks conversion of angiotensin I → angiotensin II",
    },
    {
      id: 2,
      subject: "Pharmacology",
      front: "Metformin primary action?",
      back: "↓ hepatic gluconeogenesis",
    },
    {
      id: 3,
      subject: "Pharmacology",
      front: "Sulfonylurea mechanism?",
      back: "Closes K-ATP channels → insulin release",
    },
  ],
  f2: [
    {
      id: 1,
      subject: "Anatomy",
      front: "Muscle initiating shoulder abduction?",
      back: "Supraspinatus (first 15°)",
    },
    {
      id: 2,
      subject: "Anatomy",
      front: "Nerve injured in carpal tunnel syndrome?",
      back: "Median nerve",
    },
  ],
  f3: [
    {
      id: 1,
      subject: "Pathology",
      front: "PTT elevated, PT normal — think?",
      back: "Intrinsic pathway defect (hemophilia)",
    },
    {
      id: 2,
      subject: "Pathology",
      front: "DIC hallmark lab finding?",
      back: "↑ D-dimer with ↓ fibrinogen",
    },
  ],
};

export const QUESTION_SETS: StudySet[] = [
  {
    id: "q1",
    title: "Diabetes & Oral Hypoglycemics",
    subject: "Pharmacology",
    about:
      "High-yield MCQs on metformin, sulfonylureas, and first-line type 2 diabetes management.",
    total: QUESTIONS_BY_SET.q1!.length,
    done: 1,
    score: 85,
    tag: "High Yield",
    upvotes: 248,
    comments: 142,
  },
  {
    id: "q2",
    title: "Upper Limb Nerve Injuries",
    subject: "Anatomy",
    about: "Carpal tunnel, Erb's palsy, and peripheral nerve localization.",
    total: QUESTIONS_BY_SET.q2!.length,
    done: 2,
    score: 92,
    tag: "Exam Ready",
    upvotes: 412,
    comments: 240,
  },
  {
    id: "q3",
    title: "Granulomatous Lung Disease",
    subject: "Pathology",
    about: "Caseating vs non-caseating granulomas for sarcoidosis and TB.",
    total: QUESTIONS_BY_SET.q3!.length,
    done: 0,
    score: 61,
    tag: "Review Needed",
    upvotes: 156,
    comments: 91,
  },
  {
    id: "q4",
    title: "Cardiac Physiology Basics",
    subject: "Physiology",
    about: "Frank-Starling, preload/afterload, and pressure-volume relationships.",
    total: QUESTIONS_BY_SET.q4!.length,
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
    about: "Adrenergic and cholinergic drugs with board-style bullet points.",
    total: NOTES_BY_SET.s1!.length,
    done: 1,
    score: 88,
    tag: "HY Note",
    upvotes: 193,
    comments: 112,
  },
  {
    id: "s2",
    title: "Brachial Plexus & Upper Limb",
    subject: "Anatomy",
    about: "Roots, trunks, cords, and classic injury patterns.",
    total: NOTES_BY_SET.s2!.length,
    done: 2,
    score: 95,
    tag: "HY Note",
    upvotes: 327,
    comments: 189,
  },
  {
    id: "s3",
    title: "Hemodynamics Quick Review",
    subject: "Physiology",
    about: "CO, SVR, and hemodynamic curves for rapid pre-exam refresh.",
    total: NOTES_BY_SET.s3!.length,
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
    about: "Labeled cross-sectional anatomy for spinal cord and brainstem.",
    total: IMAGES_BY_SET.i1!.length,
    done: 1,
    score: 78,
    tag: "High Yield",
    upvotes: 201,
    comments: 117,
  },
  {
    id: "i2",
    title: "Hematopathology Slides",
    subject: "Pathology",
    about: "Microscopy sets for lymphoma patterns and marrow findings.",
    total: IMAGES_BY_SET.i2!.length,
    done: 0,
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
    about: "Receptor targets, enzyme inhibitors, and mechanism mnemonics.",
    total: FLASHCARDS_BY_SET.f1!.length,
    done: 2,
    score: 81,
    tag: "High Yield",
    upvotes: 364,
    comments: 211,
  },
  {
    id: "f2",
    title: "Muscles & Innervation",
    subject: "Anatomy",
    about: "SITS rotator cuff and peripheral nerve supply.",
    total: FLASHCARDS_BY_SET.f2!.length,
    done: 2,
    score: 96,
    tag: "Master",
    upvotes: 521,
    comments: 302,
  },
  {
    id: "f3",
    title: "Coagulation Disorders",
    subject: "Pathology",
    about: "DIC, hemophilia, and clotting pathway defects.",
    total: FLASHCARDS_BY_SET.f3!.length,
    done: 1,
    score: 70,
    tag: "Week 4",
    upvotes: 142,
    comments: 83,
  },
];

export const LIBRARY_SETS: StudySet[] = [
  {
    id: "lib1",
    title: "Diabetes & Oral Hypoglycemics",
    subject: "Pharmacology",
    about: "Bookmarked practice questions",
    total: QUESTIONS_BY_SET.q1!.length,
    done: 1,
    score: 85,
    tag: "Bookmark",
    upvotes: 2,
    comments: 0,
    sourceTab: "questions",
    sourceSetId: "q1",
  },
  {
    id: "lib2",
    title: "Autonomic Pharmacology Notes",
    subject: "Pharmacology",
    about: "Saved note set",
    total: NOTES_BY_SET.s1!.length,
    done: 1,
    score: 88,
    tag: "Bookmark",
    upvotes: 2,
    comments: 0,
    sourceTab: "summary",
    sourceSetId: "s1",
  },
  {
    id: "lib3",
    title: "Neuroanatomy Cross-Sections",
    subject: "Anatomy",
    about: "Saved image set",
    total: IMAGES_BY_SET.i1!.length,
    done: 1,
    score: 78,
    tag: "Bookmark",
    upvotes: 2,
    comments: 0,
    sourceTab: "images",
    sourceSetId: "i1",
  },
  {
    id: "lib4",
    title: "Drug Mechanisms Rapid Fire",
    subject: "Pharmacology",
    about: "Saved flashcard deck",
    total: FLASHCARDS_BY_SET.f1!.length,
    done: 2,
    score: 81,
    tag: "Bookmark",
    upvotes: 3,
    comments: 0,
    sourceTab: "flashcards",
    sourceSetId: "f1",
  },
];

export const SETS_BY_TAB: Record<string, StudySet[]> = {
  questions: QUESTION_SETS,
  summary: SUMMARY_SETS,
  images: IMAGE_SETS,
  flashcards: FLASHCARD_SETS,
  library: LIBRARY_SETS,
};

export function resolveSessionTab(tab: string, set: StudySet): ContentTab {
  if (tab === "library" && set.sourceTab) return set.sourceTab;
  if (tab === "questions" || tab === "summary" || tab === "images" || tab === "flashcards") {
    return tab;
  }
  return "questions";
}

export function resolveSessionSetId(tab: string, set: StudySet): string {
  if (tab === "library" && set.sourceSetId) return set.sourceSetId;
  return set.id;
}

export function getSessionItems(tab: string, setId: string): SessionItem[] {
  switch (tab) {
    case "questions":
      return QUESTIONS_BY_SET[setId] ?? [];
    case "summary":
      return NOTES_BY_SET[setId] ?? [];
    case "images":
      return IMAGES_BY_SET[setId] ?? [];
    case "flashcards":
      return FLASHCARDS_BY_SET[setId] ?? [];
    default:
      return [];
  }
}

export function sessionItemCount(tab: string, setId: string): number {
  const resolvedTab = tab === "library" ? "questions" : tab;
  const items = getSessionItems(resolvedTab, setId);
  return items.length > 0 ? items.length : 1;
}

export function getSetById(tab: string, setId: string): StudySet | undefined {
  return (SETS_BY_TAB[tab] ?? []).find((set) => set.id === setId);
}
