import { DEFAULT_EXAM_ID } from "@/lib/exams";
import { examIdFromPathname } from "@/lib/routes";

const STORAGE_KEY = "drnote-current-exam";

export function saveCurrentExamId(examId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, examId);
}

export function loadCurrentExamId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function getDashboardExamId(pathname: string): string {
  const fromPath = examIdFromPathname(pathname);
  if (fromPath) return fromPath;
  return loadCurrentExamId() ?? DEFAULT_EXAM_ID;
}
