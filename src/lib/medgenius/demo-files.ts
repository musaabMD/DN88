import type { HomeExamFile } from "./home-data";

const DEMO_COLORS = ["#58CC02", "#1CB0F6", "#CE82FF", "#FFC800"];

function demoFile(
  id: string,
  name: string,
  pages: number,
  colorIndex: number,
  votes: HomeExamFile["votes"]
): HomeExamFile {
  return {
    id,
    name,
    author: "Ready",
    pages,
    color: DEMO_COLORS[colorIndex % DEMO_COLORS.length] ?? "#58CC02",
    votes,
    status: "completed",
    progress: 100,
    isLive: false,
  };
}

const DEMO_BY_EXAM: Record<string, HomeExamFile[]> = {
  smle: [
    demoFile("demo-smle-april-2026", "April 15 2026 SMLE Morning Exam", 10, 0, {
      today: 24,
      week: 96,
      month: 240,
      all: 480,
    }),
    demoFile("demo-smle-july-5-10", "5-10 July", 4, 1, {
      today: 12,
      week: 48,
      month: 120,
      all: 360,
    }),
  ],
  sdle: [
    demoFile("demo-sdle-march", "March Dental Recall Sheet", 8, 0, {
      today: 8,
      week: 32,
      month: 96,
      all: 240,
    }),
  ],
};

export function getDemoFilesForExam(examId: string): HomeExamFile[] {
  return DEMO_BY_EXAM[examId] ?? DEMO_BY_EXAM.smle ?? [];
}

/** True when `?demo=1` forces demo-only mode (hides live files). */
export function isDemoFilesForced(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export function isDemoFilesEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_FILES === "true") return true;
  return isDemoFilesForced();
}
