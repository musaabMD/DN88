export type StoredSessionReport = {
  sessionId: string;
  setId: string;
  durationSec: number;
  correctCount: number;
  answeredCount: number;
  totalCount: number;
  subjects: Array<{ subject: string; correct: number; total: number }>;
  missedCards: Array<{ id: string; prompt: string; subject: string }>;
  streakBest: number;
  readinessPct: number;
  startedAt: number;
};

const storageKey = (setId: string) => `drnote-session-report:${setId}`;

export function saveSessionReport(setId: string, report: StoredSessionReport): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(storageKey(setId), JSON.stringify(report));
}

export function loadSessionReport(setId: string): StoredSessionReport | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey(setId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSessionReport;
  } catch {
    return null;
  }
}

export function storedReportToSessionReportData(report: StoredSessionReport) {
  return {
    durationSec: report.durationSec,
    subjects: report.subjects,
    missedCards: report.missedCards,
    streakBest: report.streakBest,
    readinessPct: report.readinessPct,
    correctCount: report.correctCount,
    answeredCount: report.answeredCount,
    totalCount: report.totalCount,
  };
}
