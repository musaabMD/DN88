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
  author: string;
  specialty: string;
  text: string;
  tag: string;
};

export type ImageItem = {
  id: number;
  title: string;
  caption: string;
  tag: string;
  src?: string;
};

export type FlashcardItem = {
  id: number;
  deck: string;
  front: string;
  back: string;
  status?: "correct" | "incorrect" | "new";
};

export type LibraryArticleSection = {
  id: string;
  heading: string;
  body: string;
  bullets?: string[];
  citations?: SerializableCitation[];
};

export type LibraryArticle = {
  id: string;
  subject: string;
  title: string;
  readMinutes: number;
  updated: string;
  sections: LibraryArticleSection[];
  highYield?: string;
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
      author: "Dr. Sara",
      specialty: "Internal Medicine",
      text: "Metformin never causes hypoglycemia as monotherapy. If a diabetic on metformin alone is hypoglycemic, look for another cause.",
      tag: "Endocrine",
    },
    {
      id: 2,
      author: "Dr. Omar",
      specialty: "Pharmacology",
      text: "ACE inhibitors cause dry cough via bradykinin accumulation — switch to ARB if intolerable.",
      tag: "Pharm",
    },
    {
      id: 3,
      author: "Dr. Lina",
      specialty: "Endocrinology",
      text: "Sulfonylureas close K-ATP channels → insulin release. Main risk is hypoglycemia, not lactic acidosis.",
      tag: "Endocrine",
    },
  ],
  s2: [
    {
      id: 1,
      author: "Dr. Omar",
      specialty: "Surgery",
      text: "Wrist drop = radial nerve. Think mid-shaft humerus fracture or Saturday night palsy.",
      tag: "Neuro",
    },
    {
      id: 2,
      author: "Dr. Sara",
      specialty: "Anatomy",
      text: "Erb's palsy (C5-C6): waiter's tip. Klumpke (C8-T1): claw hand with intrinsic weakness.",
      tag: "Neuro",
    },
    {
      id: 3,
      author: "Dr. Lina",
      specialty: "Orthopedics",
      text: "Supraspinatus initiates abduction (first 15°). Infraspinatus and teres minor externally rotate.",
      tag: "MSK",
    },
  ],
  s3: [
    {
      id: 1,
      author: "Dr. Sara",
      specialty: "Cardiology",
      text: "CO = HR × SV. Frank-Starling: increased preload → increased stroke volume up to a point.",
      tag: "Physio",
    },
    {
      id: 2,
      author: "Dr. Omar",
      specialty: "Physiology",
      text: "MAP ≈ CO × SVR. Afterload is the resistance the ventricle must overcome to eject blood.",
      tag: "Physio",
    },
  ],
};

const IMAGES_BY_SET: Record<string, ImageItem[]> = {
  i1: [
    {
      id: 1,
      title: "Bilateral hilar lymphadenopathy",
      caption:
        "Classic chest X-ray finding in sarcoidosis: symmetric enlargement of both hila.",
      tag: "Pulm",
    },
    {
      id: 2,
      title: "Wrist drop",
      caption:
        "Radial nerve palsy after mid-shaft humerus fracture — inability to extend the wrist.",
      tag: "Neuro",
    },
    {
      id: 3,
      title: "Cervical spinal cord cross-section",
      caption: "Labeled cross-sectional anatomy for spinal cord levels.",
      tag: "Neuro",
    },
    {
      id: 4,
      title: "Brainstem level: medulla vs pons",
      caption: "Key landmarks distinguishing medullary from pontine sections.",
      tag: "Neuro",
    },
  ],
  i2: [
    {
      id: 1,
      title: "Erythema nodosum",
      caption:
        "Tender red nodules on the shins; think sarcoidosis, strep, IBD, or drugs.",
      tag: "Derm",
    },
    {
      id: 2,
      title: "Reed-Sternberg cells",
      caption: "Owl-eye cells in Hodgkin lymphoma biopsy.",
      tag: "Path",
    },
    {
      id: 3,
      title: "Bone marrow aspirate with blasts",
      caption: "Increased blasts suggest acute leukemia.",
      tag: "Path",
    },
    {
      id: 4,
      title: "Diabetic retinopathy",
      caption: "Microaneurysms and dot-blot hemorrhages on fundoscopy.",
      tag: "Ophtho",
    },
  ],
};

const FLASHCARDS_BY_SET: Record<string, FlashcardItem[]> = {
  f1: [
    {
      id: 1,
      deck: "Drug Mechanisms Rapid Fire",
      front: "ACE inhibitor mechanism?",
      back: "Blocks conversion of angiotensin I → angiotensin II",
      status: "correct",
    },
    {
      id: 2,
      deck: "Drug Mechanisms Rapid Fire",
      front: "Metformin primary action?",
      back: "↓ hepatic gluconeogenesis",
      status: "correct",
    },
    {
      id: 3,
      deck: "Drug Mechanisms Rapid Fire",
      front: "Sulfonylurea mechanism?",
      back: "Closes K-ATP channels → insulin release",
      status: "incorrect",
    },
  ],
  f2: [
    {
      id: 1,
      deck: "Upper Limb Nerve Injuries",
      front:
        "A patient cannot extend the wrist after a mid-shaft humerus fracture. Which nerve is injured?",
      back: "Radial nerve — it runs in the spiral groove of the humerus. Presents as wrist drop.",
      status: "correct",
    },
    {
      id: 2,
      deck: "Upper Limb Nerve Injuries",
      front: "Which nerve is injured in a surgical neck fracture of the humerus?",
      back: "Axillary nerve — deltoid weakness and loss of sensation over the lateral shoulder.",
      status: "new",
    },
    {
      id: 3,
      deck: "Upper Limb Nerve Injuries",
      front: "Claw hand with a fracture of the medial epicondyle points to which nerve?",
      back: "Ulnar nerve — weak interossei and sensory loss over the 4th and 5th digits.",
      status: "incorrect",
    },
  ],
  f3: [
    {
      id: 1,
      deck: "Coagulation Disorders",
      front: "PTT elevated, PT normal — think?",
      back: "Intrinsic pathway defect (hemophilia)",
      status: "new",
    },
    {
      id: 2,
      deck: "Coagulation Disorders",
      front: "DIC hallmark lab finding?",
      back: "↑ D-dimer with ↓ fibrinogen",
      status: "new",
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
    title: "Endocrine & Diabetes HY Notes",
    subject: "Pharmacology",
    about: "Tweet-length high-yield facts on metformin, sulfonylureas, and diabetes management.",
    total: NOTES_BY_SET.s1!.length * 6,
    done: 1,
    score: 88,
    tag: "HY Note",
    upvotes: 193,
    comments: 112,
  },
  {
    id: "s2",
    title: "Upper Limb Nerve Injuries",
    subject: "Anatomy",
    about: "Radial, axillary, and ulnar nerve patterns in tweet-sized HY notes.",
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
    title: "Pulmonary & Neuro HY Images",
    subject: "Anatomy",
    about: "High-yield exam images: hilar lymphadenopathy, wrist drop, neuroanatomy.",
    total: IMAGES_BY_SET.i1!.length,
    done: 1,
    score: 78,
    tag: "High Yield",
    upvotes: 201,
    comments: 117,
  },
  {
    id: "i2",
    title: "Derm & Path HY Images",
    subject: "Pathology",
    about: "Erythema nodosum, Reed-Sternberg cells, marrow blasts, and fundoscopy.",
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
    total: FLASHCARDS_BY_SET.f2!.length * 6,
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
    title: "Endocrine & Diabetes HY Notes",
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
    title: "Pulmonary & Neuro HY Images",
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

export const LIBRARY_ARTICLES: LibraryArticle[] = [
  {
    id: "art1",
    subject: "Pulmonology",
    title: "Sarcoidosis",
    readMinutes: 8,
    updated: "Jun 2026",
    sections: [
      {
        id: "overview",
        heading: "Overview",
        body: "Sarcoidosis is a multisystem inflammatory disease of unknown etiology characterized by noncaseating granulomas. It most commonly affects young adults and typically involves the lungs and intrathoracic lymph nodes, though almost any organ can be affected.",
        citations: [
          {
            id: "art1-overview-1",
            href: "https://www.uptodate.com/contents/clinical-manifestations-and-diagnosis-of-pulmonary-sarcoidosis",
            title: "Clinical manifestations and diagnosis of pulmonary sarcoidosis",
            domain: "uptodate.com",
            author: "UpToDate",
            type: "article",
          },
          {
            id: "art1-overview-2",
            href: "https://pubmed.ncbi.nlm.nih.gov/30145904/",
            title: "Sarcoidosis — a review",
            domain: "pubmed.ncbi.nlm.nih.gov",
            author: "Iannuzzi MC et al.",
            type: "article",
          },
        ],
      },
      {
        id: "pathophysiology",
        heading: "Pathophysiology",
        body: "An exaggerated cell-mediated immune response leads to granuloma formation. Activated macrophages within granulomas express 1-alpha-hydroxylase, converting vitamin D to its active form and producing hypercalcemia in a subset of patients.",
        citations: [
          {
            id: "art1-patho-1",
            href: "https://pubmed.ncbi.nlm.nih.gov/28789989/",
            title: "Pathogenesis of sarcoidosis",
            domain: "pubmed.ncbi.nlm.nih.gov",
            author: "Grunewald J",
            type: "article",
          },
        ],
      },
      {
        id: "clinical-features",
        heading: "Clinical features",
        body: "",
        bullets: [
          "Dry cough, dyspnea, and chest discomfort",
          "Erythema nodosum and lupus pernio (skin)",
          "Anterior uveitis (eyes)",
          "Loefgren syndrome: fever, arthritis, erythema nodosum, hilar adenopathy",
        ],
        citations: [
          {
            id: "art1-clinical-1",
            href: "https://www.uptodate.com/contents/extrapulmonary-manifestations-of-sarcoidosis",
            title: "Extrapulmonary manifestations of sarcoidosis",
            domain: "uptodate.com",
            author: "UpToDate",
            type: "article",
          },
        ],
      },
      {
        id: "diagnosis",
        heading: "Diagnosis",
        body: "Bilateral hilar lymphadenopathy on chest imaging is the classic finding. Elevated ACE and hypercalcemia support the diagnosis. Biopsy showing noncaseating granulomas confirms when needed.",
        citations: [
          {
            id: "art1-dx-1",
            href: "https://pubmed.ncbi.nlm.nih.gov/31578133/",
            title: "ATS/ERS/WASOG statement on sarcoidosis",
            domain: "pubmed.ncbi.nlm.nih.gov",
            author: "Judson MA et al.",
            type: "article",
          },
        ],
      },
      {
        id: "treatment",
        heading: "Treatment",
        body: "Many patients require no treatment. Indications for corticosteroids include significant pulmonary symptoms, hypercalcemia, cardiac involvement, or neurologic disease.",
        citations: [
          {
            id: "art1-tx-1",
            href: "https://www.uptodate.com/contents/treatment-of-pulmonary-sarcoidosis",
            title: "Treatment of pulmonary sarcoidosis",
            domain: "uptodate.com",
            author: "UpToDate",
            type: "article",
          },
        ],
      },
    ],
    highYield:
      "Bilateral hilar lymphadenopathy on chest X-ray in an asymptomatic young patient is the classic exam presentation. Look for elevated ACE and hypercalcemia in the stem.",
  },
  {
    id: "art2",
    subject: "Neurology",
    title: "Radial Nerve Injury",
    readMinutes: 5,
    updated: "Jun 2026",
    sections: [
      {
        id: "overview",
        heading: "Overview",
        body: "Radial nerve injury presents with wrist drop and inability to extend the fingers and thumb. The nerve runs in the spiral groove of the humerus and is vulnerable to mid-shaft fractures and compression (Saturday night palsy).",
        citations: [
          {
            id: "art2-overview-1",
            href: "https://www.uptodate.com/contents/overview-of-upper-extremity-peripheral-nerve-lesions",
            title: "Overview of upper extremity peripheral nerve lesions",
            domain: "uptodate.com",
            author: "UpToDate",
            type: "article",
          },
        ],
      },
      {
        id: "clinical-features",
        heading: "Clinical features",
        body: "",
        bullets: [
          "Wrist drop — inability to extend wrist and fingers",
          "Sensory loss over the posterior forearm and dorsum of hand",
          "Saturday night palsy from prolonged compression",
          "Mid-shaft humerus fracture as classic association",
        ],
        citations: [
          {
            id: "art2-clinical-1",
            href: "https://pubmed.ncbi.nlm.nih.gov/28722823/",
            title: "Radial nerve palsy",
            domain: "pubmed.ncbi.nlm.nih.gov",
            author: "Lowe JB III et al.",
            type: "article",
          },
        ],
      },
      {
        id: "diagnosis",
        heading: "Diagnosis",
        body: "Clinical exam with weakness of wrist and finger extension. EMG/NCS can localize the lesion and assess severity.",
        citations: [
          {
            id: "art2-dx-1",
            href: "https://www.uptodate.com/contents/electrodiagnostic-assessment-of-the-upper-extremity",
            title: "Electrodiagnostic assessment of the upper extremity",
            domain: "uptodate.com",
            author: "UpToDate",
            type: "article",
          },
        ],
      },
      {
        id: "treatment",
        heading: "Treatment",
        body: "Conservative management with splinting for neuropraxia. Surgical exploration if open injury or no recovery after 3–6 months.",
        citations: [
          {
            id: "art2-tx-1",
            href: "https://pubmed.ncbi.nlm.nih.gov/25511309/",
            title: "Management of radial nerve palsy",
            domain: "pubmed.ncbi.nlm.nih.gov",
            author: "Shao YC et al.",
            type: "article",
          },
        ],
      },
    ],
    highYield:
      "Wrist drop after mid-shaft humerus fracture = radial nerve in the spiral groove. Saturday night palsy = compression at the axilla.",
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
  const loopPreviewSets: Record<string, number> = {
    s1: 6,
    f2: 6,
  };

  let items: SessionItem[];
  switch (tab) {
    case "questions":
      items = QUESTIONS_BY_SET[setId] ?? [];
      break;
    case "summary":
      items = NOTES_BY_SET[setId] ?? [];
      break;
    case "images":
      items = IMAGES_BY_SET[setId] ?? [];
      break;
    case "flashcards":
      items = FLASHCARDS_BY_SET[setId] ?? [];
      break;
    default:
      items = [];
  }

  const loops = loopPreviewSets[setId];
  if (!loops || loops <= 1 || items.length === 0) return items;

  const expanded: SessionItem[] = [];
  for (let round = 0; round < loops; round++) {
    for (const item of items) {
      expanded.push({
        ...item,
        id: round * 100 + (item as { id: number }).id,
      } as SessionItem);
    }
  }
  return expanded;
}

export function sessionItemCount(tab: string, setId: string): number {
  const resolvedTab = tab === "library" ? "questions" : tab;
  const items = getSessionItems(resolvedTab, setId);
  return items.length > 0 ? items.length : 1;
}

export function getSetById(tab: string, setId: string): StudySet | undefined {
  return (SETS_BY_TAB[tab] ?? []).find((set) => set.id === setId);
}

export function getLibraryArticleById(
  articleId: string
): LibraryArticle | undefined {
  return LIBRARY_ARTICLES.find((a) => a.id === articleId);
}

export function filterLibraryArticles(
  query: string,
  subject?: string
): LibraryArticle[] {
  const q = query.trim().toLowerCase();
  return LIBRARY_ARTICLES.filter((article) => {
    if (subject && article.subject !== subject) return false;
    if (!q) return true;
    return (
      article.title.toLowerCase().includes(q) ||
      article.subject.toLowerCase().includes(q) ||
      article.sections.some(
        (s) =>
          s.heading.toLowerCase().includes(q) ||
          s.body.toLowerCase().includes(q)
      )
    );
  });
}
