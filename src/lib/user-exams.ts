import { EXAMS, isValidExamId, type Exam } from "@/lib/exams";

const STORAGE_KEY = "drnote-user-exams";

function readIds(): string[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string" && isValidExamId(id));
  } catch {
    return null;
  }
}

function writeIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/** Exams pinned on the user's dashboard (defaults to SMLE). */
export function getUserExamIds(): string[] {
  const saved = readIds();
  if (saved && saved.length > 0) return saved;
  return ["smle"];
}

export function getUserExams(): Exam[] {
  const ids = getUserExamIds();
  return ids
    .map((id) => EXAMS.find((exam) => exam.id === id))
    .filter((exam): exam is Exam => exam !== undefined);
}

export function isUserExam(examId: string): boolean {
  return getUserExamIds().includes(examId);
}

export function addUserExam(examId: string): void {
  if (!isValidExamId(examId)) return;
  const ids = getUserExamIds();
  if (ids.includes(examId)) return;
  writeIds([...ids, examId]);
}

export function removeUserExam(examId: string): void {
  const ids = getUserExamIds().filter((id) => id !== examId);
  writeIds(ids.length > 0 ? ids : ["smle"]);
}
