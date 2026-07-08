export type Exam = {
  id: string;
  name: string;
};

export const EXAMS: Exam[] = [
  { id: "smle", name: "SMLE" },
  { id: "usmle1", name: "USMLE Step 1" },
  { id: "usmle2", name: "USMLE Step 2 CK" },
  { id: "mcat", name: "MCAT" },
  { id: "plab", name: "PLAB 1" },
  { id: "nbme", name: "NBME Shelf Exams" },
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
