import { EXAMS } from "@/lib/exams";

/** Only this account can open Qbank while it is in private preview. */
export const QBANK_OWNER_EMAIL = "mousab.r@gmail.com";

const PREORDER_KEY = "drnote-qbank-preorders";

export type QbankPreorder = {
  email: string;
  examId: string;
  examName: string;
  createdAt: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isQbankOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalizeEmail(email) === QBANK_OWNER_EMAIL;
}

function readPreorders(): QbankPreorder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREORDER_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QbankPreorder =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as QbankPreorder).email === "string" &&
        typeof (item as QbankPreorder).examId === "string"
    );
  } catch {
    return [];
  }
}

export function saveQbankPreorder(email: string, examId: string): QbankPreorder {
  const exam = EXAMS.find((e) => e.id === examId) ?? EXAMS[0]!;
  const entry: QbankPreorder = {
    email: normalizeEmail(email),
    examId: exam.id,
    examName: exam.name,
    createdAt: new Date().toISOString(),
  };
  const current = readPreorders().filter((p) => p.email !== entry.email);
  localStorage.setItem(PREORDER_KEY, JSON.stringify([entry, ...current]));
  return entry;
}

export function getQbankPreorders(): QbankPreorder[] {
  return readPreorders();
}

export function hasQbankPreorder(email: string): boolean {
  const normalized = normalizeEmail(email);
  return readPreorders().some((p) => p.email === normalized);
}
