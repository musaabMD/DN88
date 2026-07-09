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
  /** Condensed summary for library study mode (not exam sets). */
  summary?: string;
  /** Practice questions tied to this article. */
  questions?: QuestionItem[];
  /** Flashcards tied to this article. */
  flashcards?: FlashcardItem[];
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
    id: "endocrinology-and-metabolic-disorders-diabetes-mellitus",
    subject: "Endocrinology and metabolic disorders",
    title: "Diabetes mellitus",
    readMinutes: 12,
    updated: "Jun 2026",
    sections: [
      {
        id: "summary",
        heading: "Summary",
        body: "Diabetes mellitus is chronic hyperglycemia from absolute (type 1) or relative (type 2) insulin deficiency. Type 1 is autoimmune \u03b2-cell destruction; type 2 is insulin resistance with progressive \u03b2-cell failure, usually linked to obesity. Diagnose with glucose or HbA1c criteria; treat glycemia while screening for and preventing micro- and macrovascular complications.",
      },
      {
        id: "overview",
        heading: "Type 1 vs type 2",
        body: "T1DM accounts for ~5\u201310% of cases and often presents in childhood with acute symptoms or DKA. T2DM is far more common, frequently undiagnosed for years, and strongly associated with obesity and family history.",
        bullets: [
          "T1DM: HLA-DR3/DR4, autoimmune \u03b2-cell loss, low/absent C-peptide, high DKA risk \u2192 insulin always",
          "T2DM: insulin resistance + \u03b2-cell dysfunction, obesity-linked, low DKA risk \u2192 lifestyle, metformin, then add-ons",
          "Classic triad: polyuria, polydipsia, polyphagia (\u00b1 weight loss) \u2014 more prominent in T1DM",
          "T2DM clues: acanthosis nigricans, skin tags, recurrent infections, often asymptomatic at diagnosis",
          "Other types to know: gestational DM, LADA (late autoimmune T1), MODY (autosomal dominant, onset <25 y)",
        ],
      },
      {
        id: "pathophysiology",
        heading: "Pathophysiology",
        body: "Insulin is the only hormone that directly lowers blood glucose. Proinsulin cleavage produces insulin and C-peptide \u2014 a useful marker when type is unclear.",
        bullets: [
          "T1DM: environmental trigger in genetically susceptible host \u2192 autoantibodies (anti-GAD, anti-ICA) \u2192 \u03b2-cell destruction \u2192 absolute insulin deficiency",
          "T2DM: central obesity \u2192 \u2191 free fatty acids \u2192 impaired insulin signaling (IRS-1, GLUT4) \u2192 insulin resistance; amylin deposits worsen \u03b2-cell function over time",
          "Early T2DM: compensatory hyperinsulinemia; later: postprandial then fasting hyperglycemia as secretion fails",
        ],
      },
      {
        id: "clinical-features",
        heading: "Presentation & screening",
        body: "T1DM usually presents abruptly; DKA is the first manifestation in up to half of cases. T2DM develops insidiously and may present only when complications appear or during routine labs.",
        bullets: [
          "Screen all adults \u226535 years; screen younger patients if overweight/obese plus \u22651 risk factor (FHx, HTN, dyslipidemia, PCOS, GDM history, inactivity, high-risk ethnicity)",
          "Repeat normal screens every 3 years; annually if prediabetes; every 1\u20133 years after gestational diabetes",
          "Suspect DM with unexplained weight loss, blurred vision, fatigue, poor wound healing, or recurrent UTIs/candidiasis",
        ],
      },
      {
        id: "diagnosis",
        heading: "Diagnosis",
        body: "Confirm diabetes with symptoms plus random glucose \u2265200 mg/dL, or with two abnormal tests on separate days in asymptomatic patients.",
        bullets: [
          "Diabetes: FPG \u2265126, 2-h OGTT \u2265200, or HbA1c \u22656.5%",
          "Prediabetes: FPG 100\u2013125, OGTT 140\u2013199, or HbA1c 5.7\u20136.4%",
          "Initial workup: BMP, UACR, CBC, LFTs, lipid panel",
          "Type unclear? Check C-peptide (low in T1DM) and islet autoantibodies (anti-GAD first; then IA-2, ZnT8)",
          "HbA1c can be unreliable with hemoglobinopathies, anemia, CKD, or pregnancy \u2014 use glucose testing when discordant",
        ],
      },
      {
        id: "management",
        heading: "Management principles",
        body: "Goals are symptom relief, individualized glycemic targets, and comprehensive prevention of complications. Avoid hypoglycemia \u2014 it limits how aggressively you can treat.",
        bullets: [
          "Typical adult targets: HbA1c <7%, preprandial glucose 80\u2013130 mg/dL, postprandial <180 mg/dL (individualize)",
          "Lifestyle: \u2265150 min/week moderate activity, resistance training 2\u20133\u00d7/week, weight loss \u22653\u20137% in T2DM with obesity",
          "ASCVD prevention: BP control, statin for age \u226540, ACEi/ARB if albuminuria, antiplatelet therapy when indicated",
          "Check HbA1c every 3\u20136 months; screen microvascular complications at T2DM diagnosis or 5 years after T1DM onset, then yearly",
        ],
      },
      {
        id: "glycemic-treatment",
        heading: "Pharmacotherapy",
        body: "T1DM requires insulin from diagnosis. T2DM starts with lifestyle plus pharmacotherapy at diagnosis \u2014 metformin first for most patients without compelling CV or kidney indications for another agent.",
        bullets: [
          "T1DM: MDI or pump; typical TDD 0.4\u20131.0 units/kg/day (roughly 50% basal / 50% bolus)",
          "T2DM first-line: metformin; add SGLT2i and/or GLP-1 RA if ASCVD, high ASCVD risk, HF, or CKD",
          "Step up therapy sequentially; consider insulin if HbA1c >10%, glucose \u2265300, catabolic symptoms, or targets unmet on oral agents",
          "Prefer GLP-1 RA before insulin when appropriate; do not combine DPP-4 inhibitors with GLP-1 RAs",
          "Acute crises: DKA (T1DM >> T2DM) and HHS (often elderly T2DM) \u2014 see hyperglycemic crisis management",
        ],
      },
      {
        id: "complications",
        heading: "Complications",
        body: "Acute: DKA, hyperosmolar hyperglycemic state (HHS), and treatment-related hypoglycemia. Chronic hyperglycemia drives microvascular injury (nephropathy, retinopathy, neuropathy, foot disease) and macrovascular atherosclerosis (MI, stroke, PAD) \u2014 the leading causes of morbidity and death.",
        bullets: [
          "Annual screening: UACR + eGFR, dilated eye exam, monofilament foot exam",
          "Strict glycemic control best prevents microvascular disease; also manage BP and lipids aggressively",
          "Prediabetes: ~10% annual progression to T2DM \u2014 lifestyle (\u22657% weight loss) first; consider metformin in high-risk adults",
          "Pediatrics: >90% T1DM; screen T2DM in obese children \u226510 y with risk factors; sulfonylureas, TZDs, DPP-4i, and SGLT2i have limited pediatric approval",
        ],
      },
    ],
    highYield:
      "T1DM = autoimmune \u03b2-cell destruction (HLA-DR3/DR4), absolute insulin deficiency, high DKA risk \u2014 always insulin. T2DM = insulin resistance + \u03b2-cell failure, obesity-linked \u2014 metformin first; add SGLT2i/GLP-1 RA for ASCVD, HF, or CKD. Diagnose: FPG \u2265126, OGTT \u2265200, HbA1c \u22656.5%, or random \u2265200 + symptoms.",
    summary:
      "Diabetes mellitus is chronic hyperglycemia from absolute (type 1) or relative (type 2) insulin deficiency. T1DM is autoimmune and insulin-dependent; T2DM is insulin resistance with progressive \u03b2-cell failure. Diagnose with standard glucose/HbA1c thresholds, treat glycemia while preventing micro- and macrovascular complications, and screen complications annually.",
    questions: [
      {
        id: 1,
        subject: "Endocrinology",
        text: "A 14-year-old presents with polyuria, polydipsia, and weight loss. Labs show glucose 420 mg/dL and positive anti-GAD antibodies. Which is the most likely diagnosis?",
        options: ["Type 2 diabetes mellitus", "Type 1 diabetes mellitus", "MODY II", "Gestational diabetes"],
        answer: 1,
        tag: "High Yield",
        status: "unused",
        explanation: "Anti-GAD antibodies and acute classic symptoms in an adolescent support autoimmune T1DM.",
        citations: [],
      },
      {
        id: 2,
        subject: "Endocrinology",
        text: "Which finding best distinguishes prediabetes from diabetes by HbA1c?",
        options: ["HbA1c 5.0\u20135.6%", "HbA1c 5.7\u20136.4%", "HbA1c \u22656.5%", "HbA1c <5.0%"],
        answer: 1,
        tag: "High Yield",
        status: "unused",
        explanation: "Prediabetes is HbA1c 5.7\u20136.4%; diabetes is \u22656.5%.",
        citations: [],
      },
      {
        id: 3,
        subject: "Endocrinology",
        text: "A patient with T2DM, eGFR 45, and heart failure with reduced ejection fraction. Which drug class is preferred?",
        options: ["Sulfonylurea", "DPP-4 inhibitor alone", "SGLT-2 inhibitor", "Thiazolidinedione"],
        answer: 2,
        tag: "High Yield",
        status: "unused",
        explanation: "SGLT2 inhibitors are preferred in T2DM with HF and/or CKD.",
        citations: [],
      },
      {
        id: 4,
        subject: "Endocrinology",
        text: "A thin 8-year-old presents in DKA. Which feature most strongly supports type 1 over type 2 diabetes?",
        options: [
          "BMI at the 95th percentile",
          "Acanthosis nigricans",
          "Anti-GAD antibodies",
          "Family history of T2DM in a parent",
        ],
        answer: 2,
        tag: "High Yield",
        status: "unused",
        explanation: "Autoantibodies confirm autoimmune T1DM; obesity and acanthosis nigricans favor T2DM.",
        citations: [],
      },
    ],
    flashcards: [
      {
        id: 1,
        deck: "Diabetes mellitus",
        front: "Diagnostic thresholds for diabetes?",
        back: "FPG \u2265126, 2-h OGTT \u2265200, HbA1c \u22656.5%, or random \u2265200 + symptoms",
        status: "new",
      },
      {
        id: 2,
        deck: "Diabetes mellitus",
        front: "HLA associations in T1DM?",
        back: "HLA-DR3 and HLA-DR4",
        status: "new",
      },
      {
        id: 3,
        deck: "Diabetes mellitus",
        front: "First-line pharmacologic therapy for most T2DM?",
        back: "Metformin (unless contraindicated or CV/CKD indication for alternative)",
        status: "new",
      },
      {
        id: 4,
        deck: "Diabetes mellitus",
        front: "Preferred agents in T2DM with ASCVD, HF, or CKD?",
        back: "SGLT2 inhibitors and/or GLP-1 receptor agonists",
        status: "new",
      },
      {
        id: 5,
        deck: "Diabetes mellitus",
        front: "Typical adult HbA1c target?",
        back: "<7% for most nonpregnant adults (individualize)",
        status: "new",
      },
      {
        id: 6,
        deck: "Diabetes mellitus",
        front: "When to start microvascular complication screening?",
        back: "At T2DM diagnosis; 5 years after T1DM onset \u2014 then annually",
        status: "new",
      },
    ],
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
