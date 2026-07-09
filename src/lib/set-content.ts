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
    readMinutes: 28,
    updated: "Jun 2026",
    sections: [
      {
        id: "summary",
        heading: "Summary",
        body: "Diabetes mellitus (DM) describes a group of metabolic diseases characterized by chronic hyperglycemia. Type 1 diabetes mellitus (T1DM) is caused by an autoimmune response that destroys insulin-producing beta cells, resulting in absolute insulin deficiency. It often develops during childhood with acute onset (e.g., diabetic ketoacidosis). Type 2 diabetes mellitus (T2DM) is much more common, has a strong genetic component, and is associated with obesity and a sedentary lifestyle. T2DM is characterized by insulin resistance and impaired insulin secretion due to pancreatic beta-cell dysfunction, resulting in relative insulin deficiency. Testing for hyperglycemia is recommended for patients with classic symptoms, and screening is recommended for asymptomatic patients at high risk. The diagnosis is made based on blood glucose or HbA1c levels. The main goal of treatment is blood glucose control tailored to glycemic targets while avoiding hypoglycemia. Diabetes care should be comprehensive and patient-centered and include monitoring and management of ASCVD risk factors, microvascular complications, and macrovascular complications.",
      },
      {
        id: "overview",
        heading: "Overview",
        body: "Type 1 and type 2 diabetes differ in genetics, pathogenesis, onset, and treatment. T1DM shows HLA-DR3/DR4 association, autoimmune \u03b2-cell destruction, childhood onset, low C-peptide, and high ketoacidosis risk. T2DM is polygenic with strong familial predisposition, insulin resistance with progressive \u03b2-cell dysfunction, adult onset (typically >40 years), and association with obesity.",
        bullets: [
          "T1DM: absolute insulin deficiency; treat with insulin",
          "T2DM: insulin resistance + relative deficiency; lifestyle \u00b1 oral agents \u00b1 insulin",
          "Classic symptoms: polyuria, polydipsia, polyphagia, weight loss \u2014 common in T1DM",
        ],
      },
      {
        id: "epidemiology",
        heading: "Epidemiology",
        body: "T1DM accounts for about 5\u201310% of diabetes (~1.6 million people in the US) and typically begins in childhood, with peaks at ages 4\u20136 and 10\u201314 years; prevalence is highest in non-Hispanic White individuals. T2DM affects ~10.5% of US adults (~34 million with diabetes, including ~7.3 million undiagnosed). Incidence is about 6.7 per 1,000 US adults. Adult onset is typically >40 years, though mean age of onset is decreasing. Prevalence is highest in Native Americans, Hispanics, African Americans, and Asian non-Hispanic Americans.",
      },
      {
        id: "etiology",
        heading: "Etiology",
        body: "T1DM results from autoimmune destruction of pancreatic \u03b2 cells in genetically susceptible individuals (HLA-DR3 and HLA-DR4). It is associated with other autoimmune conditions such as Hashimoto thyroiditis, type A gastritis, celiac disease, and primary adrenal insufficiency. T2DM risk factors include family history, high-risk race/ethnicity, dyslipidemia, prediabetes, physical inactivity, CVD, PCOS, hypertension, gestational diabetes history, poor sleep, obesity, and medications such as glucocorticoids, thiazides, and some antipsychotics.",
        bullets: [
          "Mnemonic: DR4 and DR3 are associated with Diabetes Mellitus type 1",
          "T2DM: overweight/obesity and insulin resistance are central drivers",
        ],
      },
      {
        id: "classification",
        heading: "Classification",
        body: "WHO/ADA classification includes type 1 (autoimmune type 1A, idiopathic type 1B, and LADA), type 2, gestational diabetes, and other types. Other forms include MODY (maturity-onset diabetes of the young), pancreatogenic diabetes, endocrinopathy-related diabetes (Cushing, acromegaly), drug-induced diabetes, genetic insulin defects, infection-related diabetes, and syndromic diabetes (e.g., Down syndrome).",
        bullets: [
          "MODY: autosomal dominant, onset <25 years, not obesity/autoantibody related",
          "MODY II (glucokinase): often diet-managed; other MODY subtypes need meds",
          "LADA: late-onset autoimmune diabetes often mistaken for T2DM",
        ],
      },
      {
        id: "pathophysiology",
        heading: "Pathophysiology",
        body: "Insulin is synthesized in \u03b2 cells; cleavage of proinsulin yields C-peptide and insulin. Insulin lowers blood glucose, promotes protein and lipid storage, and drives intracellular potassium uptake. In T1DM, genetic susceptibility plus environmental triggers lead to autoantibodies (e.g., anti-GAD, anti-ICA) and progressive \u03b2-cell destruction with absolute insulin deficiency. In T2DM, central obesity and free fatty acids impair insulin-dependent glucose uptake; IRS-1 phosphorylation reduces GLUT4 expression. Pro-amylin accumulation contributes to \u03b2-cell dysfunction. Initially hyperinsulinemia compensates; later insulin secretion falls and fasting hyperglycemia appears.",
      },
      {
        id: "clinical-features",
        heading: "Clinical features",
        body: "T1DM often presents suddenly; DKA is the first manifestation in 25\u201350% of cases. T2DM typically develops gradually and is often asymptomatic; some present with hyperglycemic crisis or HHS. Classic hyperglycemia symptoms include polyuria, polydipsia, and polyphagia. Nonspecific features include unexplained weight loss, blurred vision, fatigue, pruritus, poor wound healing, and recurrent infections. Cutaneous signs of insulin resistance include acanthosis nigricans and acrochordons.",
        bullets: [
          "Suspect DM with recurrent cellulitis, candidiasis, UTIs, osteomyelitis, or TB reactivation",
          "Thin appearance is typical for T1DM; insulin-resistance skin signs suggest T2DM",
        ],
      },
      {
        id: "screening",
        heading: "Screening",
        body: "Per ADA guidance, screen all individuals \u226535 years. Screen younger adults who are overweight/obese with \u22651 risk factor (family history, high-risk race/ethnicity, inactivity, CVD, PCOS, hypertension, dyslipidemia, insulin resistance stigmata), or who have prediabetes, prior GDM, or risk-enhancing comorbidities (HIV, CF, post-transplant, pancreatitis). If normal, repeat at least every 3 years; test prediabetes annually and prior GDM every 1\u20133 years.",
      },
      {
        id: "diagnosis",
        heading: "Diagnosis",
        body: "Diagnose diabetes with random glucose \u2265200 mg/dL plus classic symptoms or hyperglycemic crisis, or \u22652 abnormal tests in asymptomatic patients. Diagnostic thresholds: FPG \u2265126 mg/dL, 2-hour OGTT \u2265200 mg/dL, or HbA1c \u22656.5%. Prediabetes: FPG 100\u2013125, OGTT 140\u2013199, or HbA1c 5.7\u20136.4%. Initial labs include BMP, UACR, CBC, LFTs, and lipids. C-peptide and islet autoantibodies help distinguish T1DM from T2DM when unclear.",
        bullets: [
          "HbA1c reflects ~8\u201312 weeks of glycemia; interpret carefully with anemia/hemoglobinopathies",
          "Anti-GAD positivity supports T1DM; consider IA-2 and ZnT8 if GAD negative",
        ],
      },
      {
        id: "management",
        heading: "Management",
        body: "The main goal is individualized glycemic control while avoiding hypoglycemia. T1DM always requires insulin. T2DM may be managed with noninsulin agents and/or insulin. Comprehensive care includes DSMES, lifestyle modification, screening for microvascular disease, comorbidity management, vaccinations, and ASCVD prevention (BP, lipids, obesity, antiplatelet therapy when indicated). Reassess education needs and check HbA1c every 3\u20136 months.",
        bullets: [
          "Exercise \u2265150 min/week moderate-vigorous + 2\u20133 resistance sessions",
          "T2DM with overweight/obesity: aim for \u22653\u20137% weight loss",
          "Typical adult HbA1c target <7%; individualize based on hypoglycemia risk and comorbidities",
        ],
      },
      {
        id: "glycemic-treatment",
        heading: "Glycemic treatment",
        body: "T1DM: insulin pump or multiple daily injections; typical TDD 0.4\u20131.0 units/kg/day (~50% basal / 50% prandial). T2DM: start therapy at diagnosis; metformin is first-line for most without CV/kidney indications for alternative agents. Prefer SGLT2i and/or GLP-1 RA when ASCVD, high ASCVD risk, HF, or CKD is present. Add agents sequentially; start insulin if targets unmet, glucose \u2265300 mg/dL, HbA1c >10%, or catabolic symptoms.",
        bullets: [
          "Avoid combining DPP-4 inhibitors with GLP-1 RAs",
          "Sulfonylureas + insulin increase hypoglycemia risk",
          "Include GLP-1 RA before insulin in many T2DM patients when appropriate",
        ],
      },
      {
        id: "complications-screening",
        heading: "Screening for complications",
        body: "Screen for microvascular disease at T2DM diagnosis and 5 years after T1DM onset, then at least annually: UACR + eGFR (nephropathy), dilated eye exam or retinal photography (retinopathy), sensory foot exam (neuropathy), and autonomic signs as indicated. For macrovascular risk, check BP every visit and obtain lipids at diagnosis (repeat periodically). Routine CAD screening is not recommended in asymptomatic patients.",
      },
      {
        id: "complications",
        heading: "Complications",
        body: "Acute complications include DKA, HHS, and iatrogenic hypoglycemia. Long-term macrovascular disease (CHD, stroke, PAD) is a leading cause of death, especially in T2DM. Microvascular complications include nephropathy, retinopathy, neuropathy, and diabetic foot, typically after 5\u201310 years. Other complications include necrobiosis lipoidica, mucormycosis, diabetic cardiomyopathy, limited joint mobility, and increased infection risk.",
        bullets: [
          "Strict glycemic control is crucial to prevent microvascular disease",
          "Gastroparesis can impair oral drug absorption and insulin timing",
        ],
      },
      {
        id: "prediabetes",
        heading: "Prediabetes",
        body: "Prediabetes is elevated glucose/HbA1c that does not meet diabetes criteria (~38% of US adults). Confirm with OGTT 140\u2013199, FPG 100\u2013125, or HbA1c 5.7\u20136.4%. Management centers on lifestyle change (\u22657% weight loss when overweight), diabetes prevention programs, and consideration of metformin for high-risk patients. About 10% of untreated people with prediabetes progress to T2DM yearly.",
      },
      {
        id: "pediatrics",
        heading: "Diabetes in children",
        body: "Over 90% of pediatric diabetes is T1DM, but T2DM incidence is rising. Features favoring T1DM include DKA at presentation, onset <10 years or prepubertal, BMI <85th percentile, and absence of insulin-resistance signs. Screen for T2DM in children \u226510 years (or after puberty) with overweight/obesity plus risk factors. Pediatric T1DM management centers on insulin, multidisciplinary care, and comorbidity screening (thyroid, celiac, lipids, BP). Pediatric T2DM often starts with metformin (\u00b1 basal insulin if HbA1c \u22658.5%), lifestyle therapy, and stepwise add-on of approved GLP-1 RA or SGLT2i.",
      },
      {
        id: "prognosis",
        heading: "Prognosis and prevention",
        body: "Diabetes is a leading cause of death, blindness, nontraumatic amputation, ESRD, and CVD in the US. Prognosis depends on glycemic control and treatment of comorbidities. Primary prevention emphasizes healthy diet, weight, \u2265150 minutes of exercise weekly, sleep, and management of modifiable risk factors. High-risk adults may benefit from diabetes prevention programs and metformin in selected cases.",
      },
    ],
    highYield: "T1DM = autoimmune \u03b2-cell destruction (HLA-DR3/DR4), absolute insulin deficiency, high DKA risk \u2014 treat with insulin. T2DM = insulin resistance + progressive \u03b2-cell failure, obesity-linked \u2014 metformin first-line; use SGLT2i/GLP-1 RA when ASCVD, HF, or CKD present. Diagnose with FPG \u2265126, OGTT \u2265200, HbA1c \u22656.5%, or random \u2265200 + symptoms.",
    summary: "Diabetes mellitus (DM) describes a group of metabolic diseases characterized by chronic hyperglycemia. Type 1 diabetes mellitus (T1DM) is caused by an autoimmune response that destroys insulin-producing beta cells, resulting in absolute insulin deficiency. It often develops during childhood with acute onset (e.g., diabetic ketoacidosis). Type 2 diabetes mellitus (T2DM) is much more common, has a strong genetic component, and is associated with obesity and a sedentary lifestyle. T2DM is characterized by insulin resistance and impaired insulin secretion due to pancreatic beta-cell dysfunction, resulting in relative insulin deficiency. Testing for hyperglycemia is recommended for patients with classic symptoms, and screening is recommended for asymptomatic patients at high risk. The diagnosis is made based on blood glucose or HbA1c levels. The main goal of treatment is blood glucose control tailored to glycemic targets while avoiding hypoglycemia. Diabetes care should be comprehensive and patient-centered and include monitoring and management of ASCVD risk factors, microvascular complications, and macrovascular complications.",
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
    ],
    flashcards: [
      {
        id: 1,
        deck: "Diabetes mellitus",
        front: "Classic diagnostic thresholds for diabetes?",
        back: "FPG \u2265126, OGTT \u2265200, HbA1c \u22656.5%, or random \u2265200 + symptoms",
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
