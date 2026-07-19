export type Exam = {
  id: string;
  code: string;
  name: string;
  description: string;
};

export const EXAMS: Exam[] = [
  {
    id: "smle",
    code: "SMLE",
    name: "Saudi Medical Licensing Exam",
    description: "Practice SMLE questions, summaries, images, and flashcards for Saudi medical licensing exam preparation.",
  },
  {
    id: "sdle",
    code: "SDLE",
    name: "Saudi Dental Licensing Exam",
    description: "Study SDLE dental licensing questions, summaries, images, and flashcards.",
  },
  {
    id: "sple",
    code: "SPLE",
    name: "Saudi Pharmacy Licensing Exam",
    description: "Prepare for SPLE with pharmacy licensing practice questions, summaries, and flashcards.",
  },
  {
    id: "slle",
    code: "SLLE",
    name: "Saudi Lab Licensing Exam",
    description: "Review SLLE laboratory licensing content with focused practice and study modes.",
  },
  {
    id: "snle",
    code: "SNLE",
    name: "Saudi Nursing Licensing Exam",
    description: "Practice SNLE nursing licensing questions, summaries, images, and flashcards.",
  },
  {
    id: "fm",
    code: "FM",
    name: "Family Medicine",
    description: "Study family medicine board topics with question banks, summaries, images, and flashcards.",
  },
  {
    id: "usmle1",
    code: "USMLE Step 1",
    name: "USMLE Step 1",
    description: "Practice USMLE Step 1 questions, summaries, images, and flashcards.",
  },
  {
    id: "usmle2",
    code: "USMLE Step 2 CK",
    name: "USMLE Step 2 CK",
    description: "Prepare for USMLE Step 2 CK with clinical question banks and study tools.",
  },
  {
    id: "mcat",
    code: "MCAT",
    name: "MCAT",
    description: "Practice MCAT-style questions and review high-yield study material.",
  },
  {
    id: "plab",
    code: "PLAB 1",
    name: "PLAB 1",
    description: "Prepare for PLAB 1 with focused question practice and review modes.",
  },
  {
    id: "nbme",
    code: "NBME",
    name: "NBME Shelf Exams",
    description: "Study NBME shelf exam topics with practice sets, summaries, and flashcards.",
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
