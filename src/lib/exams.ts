export type ExamCategory = "medicine" | "pharmacy" | "nursing" | "dentistry";

export type ExamBlueprint = Record<string, number>;

export type Exam = {
  id: string;
  name: string;
  country: string;
  category: ExamCategory;
  blueprint?: ExamBlueprint;
};

export const EXAM_CATEGORIES: ExamCategory[] = [
  "medicine",
  "pharmacy",
  "nursing",
  "dentistry",
];

export const EXAMS: Exam[] = [
  {
    id: "smle",
    name: "SMLE",
    country: "Saudi Arabia",
    category: "medicine",
  },
  {
    id: "sdle",
    name: "SDLE",
    country: "Saudi Arabia",
    category: "dentistry",
  },
  {
    id: "sple",
    name: "SPLE",
    country: "Saudi Arabia",
    category: "pharmacy",
  },
  {
    id: "saudi-fm",
    name: "Family Medicine Saudi Board",
    country: "Saudi Arabia",
    category: "medicine",
    blueprint: {
      "Family Medicine": 19,
      "Internal Medicine": 11,
      Pediatric: 10,
      "Obstetrics and Gynecology": 10,
      "General Surgery": 6,
      Psychiatry: 9,
      "Emergency Medicine (Adult and Pediatric)": 10,
      Dermatology: 5,
      "Orthopedic and Musculoskeletal": 5,
      Ophthalmology: 5,
      Otolaryngology: 5,
      Radiology: 5,
    },
  },
  {
    id: "usmle1",
    name: "USMLE Step 1",
    country: "United States",
    category: "medicine",
  },
  {
    id: "usmle2",
    name: "USMLE Step 2 CK",
    country: "United States",
    category: "medicine",
  },
  {
    id: "abfm",
    name: "Family Medicine ABFM",
    country: "United States",
    category: "medicine",
    blueprint: {
      "Acute Care and Diagnosis": 35,
      "Chronic Care Management": 25,
      "Emergent and Urgent Care": 20,
      "Preventive Care": 15,
      "Foundations of Care": 5,
    },
  },
  {
    id: "abim",
    name: "ABIM",
    country: "United States",
    category: "medicine",
    blueprint: {
      "Allergy and Immunology": 2,
      "Cardiovascular Disease": 14,
      Dermatology: 3,
      "Endocrinology, Diabetes, and Metabolism": 9,
      Gastroenterology: 9,
      Hematology: 6,
      "Infectious Disease": 9,
      Miscellaneous: 2,
      "Nephrology and Urology": 6,
      Neurology: 4,
      "Obstetrics and Gynecology": 3,
      "Medical Oncology": 6,
      Ophthalmology: 1,
      "Otolaryngology and Dental Medicine": 1,
      Psychiatry: 4,
      "Pulmonary Disease": 9,
      "Rheumatology and Orthopedics": 9,
      "Geriatric Syndromes": 3,
    },
  },
  {
    id: "mcat",
    name: "MCAT",
    country: "United States",
    category: "medicine",
  },
  {
    id: "plab",
    name: "PLAB 1",
    country: "United Kingdom",
    category: "medicine",
  },
  {
    id: "nbme",
    name: "NBME Shelf Exams",
    country: "United States",
    category: "medicine",
  },
];

export const DEFAULT_EXAM_ID = "smle";

export function isValidExamId(examId: string): boolean {
  return EXAMS.some((exam) => exam.id === examId);
}

export function getExamById(examId: string): Exam | undefined {
  return EXAMS.find((exam) => exam.id === examId);
}

export function getAllExamStaticParams(): Array<{ examId: string }> {
  return EXAMS.map((exam) => ({ examId: exam.id }));
}

export function getExamBlueprintEntries(
  exam: Exam
): Array<{ label: string; percent: number }> {
  if (!exam.blueprint) return [];
  return Object.entries(exam.blueprint)
    .map(([label, percent]) => ({ label, percent }))
    .sort((a, b) => b.percent - a.percent);
}

export function formatExamCategory(category: ExamCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
