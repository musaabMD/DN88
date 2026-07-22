"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import {
  fetchDocumentStatus,
  fetchDocuments,
  fetchDocumentMarkdown,
  fetchFlashcards,
  fetchQuestions,
  fetchSummaries,
  type MedGeniusDocument,
  type MedGeniusQuestion,
} from "./api";
import { sanitizeUserError } from "./errors";

const FILE_COLORS = ["#58CC02", "#1CB0F6", "#CE82FF", "#FFC800", "#FF4B4B", "#14B8A6"];

export type HomeExamFile = {
  id: string;
  name: string;
  author: string;
  pages: number;
  color: string;
  votes: { today: number; week: number; month: number; all: number };
  documentId?: string;
  originalFilename?: string;
  mimeType?: string;
  status?: string;
  progress?: number;
  isLive?: boolean;
};

export type HomeQuestion = {
  id?: string;
  stem: string;
  options: string[];
  correct: number;
  explain: string;
};

export type HomeReadPage = {
  h: string;
  body: string[];
  key: string;
};

export type HomeFlashCard = {
  t: string;
  d: string;
  img?: string;
  imgAlt?: string;
};

export type HomeSummary = {
  id: string;
  type: string;
  content: string;
};

function statusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
    case "parsing":
      return "Reading…";
    case "extracting":
      return "Building quiz…";
    case "pending":
      return "Queued…";
    default:
      return "Processing…";
  }
}

export function documentToExamFile(doc: MedGeniusDocument, index: number): HomeExamFile {
  const created = doc.createdAt ? Date.parse(doc.createdAt) : Date.now();
  const ageDays = Math.max(1, Math.floor((Date.now() - created) / 86400000));
  const base = Math.max(1, doc.pageCount * 3);

  return {
    id: doc.id,
    documentId: doc.id,
    name: doc.name,
    originalFilename: doc.originalFilename,
    mimeType: doc.mimeType,
    author: statusLabel(doc.status),
    pages: doc.pageCount || 1,
    color: FILE_COLORS[index % FILE_COLORS.length] ?? "#58CC02",
    votes: {
      today: Math.min(base, ageDays <= 1 ? base : 0),
      week: Math.min(base * 2, ageDays <= 7 ? base * 2 : base),
      month: Math.min(base * 4, ageDays <= 30 ? base * 4 : base * 2),
      all: base * 6,
    },
    status: doc.status,
    progress: doc.progress,
    isLive: true,
  };
}

export function apiQuestionToHome(q: MedGeniusQuestion): HomeQuestion {
  const stem = q.cleanedText?.trim() || q.originalText.trim();
  const options = q.options.length >= 2 ? q.options : ["Option A", "Option B", "Option C", "Option D"];
  const correct =
    q.correctAnswer !== null && q.correctAnswer >= 0 && q.correctAnswer < options.length
      ? q.correctAnswer
      : 0;

  return {
    id: q.id,
    stem,
    options,
    correct,
    explain: q.explanation?.trim() || "Review the source material for the full explanation.",
  };
}

export function apiFlashcardToHome(card: {
  front: string;
  back: string;
  highYieldFact?: string;
}): HomeFlashCard {
  return {
    t: card.front,
    d: card.highYieldFact?.trim() ? `${card.back}\n\n${card.highYieldFact}` : card.back,
  };
}

export function markdownToReadPages(markdown: string): HomeReadPage[] {
  const text = markdown.trim();
  if (!text) return [];

  const sections = text.split(/\n(?=##?\s+)/).filter((s) => s.trim());
  if (sections.length <= 1 && !/^#/.test(text)) {
    const paragraphs = text.split(/\n{2,}/).filter(Boolean);
    return paragraphs.slice(0, 12).map((block, i) => {
      const lines = block.split("\n").filter(Boolean);
      return {
        h: lines[0]?.replace(/^#+\s*/, "") || `Section ${i + 1}`,
        body: lines.slice(1).length ? lines.slice(1) : [block],
        key: lines.find((l) => l.startsWith(">"))?.replace(/^>\s*/, "") || lines[0] || "",
      };
    });
  }

  return sections.map((section, i) => {
    const lines = section.trim().split("\n").filter(Boolean);
    const heading = lines[0]?.replace(/^#+\s*/, "") || `Section ${i + 1}`;
    const body = lines.slice(1).filter((l) => !l.startsWith(">"));
    const key = lines.find((l) => l.startsWith(">"))?.replace(/^>\s*/, "") || body[0] || heading;
    return {
      h: heading,
      body: body.length ? body : [section.replace(/^#+\s*[^\n]+\n?/, "").trim() || section],
      key,
    };
  });
}

function useClerkSessionReady(): boolean {
  const clerkEnabled = useClerkEnabled();
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    if (!clerkEnabled) return;

    let cancelled = false;
    let interval: number | null = null;
    let timeout: number | null = null;

    const waitForToken = async (): Promise<boolean> => {
      const token = await getClerkToken();
      if (cancelled) return false;
      if (token) {
        setTokenReady(true);
        return true;
      }
      return false;
    };

    void (async () => {
      if (await waitForToken()) return;

      interval = window.setInterval(() => {
        void waitForToken().then((hasToken) => {
          if (hasToken && interval !== null) window.clearInterval(interval);
        });
      }, 150);
      timeout = window.setTimeout(() => {
        if (interval !== null) window.clearInterval(interval);
        if (!cancelled) setTokenReady(true);
      }, 8000);
    })();

    return () => {
      cancelled = true;
      if (interval !== null) window.clearInterval(interval);
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [clerkEnabled]);

  return !clerkEnabled || tokenReady;
}

export function useExamDocuments(examId: string | undefined, refreshKey = 0) {
  const clerkEnabled = useClerkEnabled();
  const sessionReady = useClerkSessionReady();
  const signedIn = clerkEnabled && sessionReady && isClerkSignedIn();
  const canFetch = signedIn && Boolean(examId);
  const [files, setFiles] = useState<HomeExamFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!canFetch || !examId) return;

    setError(null);
    setLoading(true);
    try {
      const token = await getClerkToken();
      if (!token) return;
      const { documents } = await fetchDocuments(token, examId);
      setFiles(documents.map(documentToExamFile));
    } catch (err) {
      setError(sanitizeUserError(err instanceof Error ? err.message : "Failed to load files"));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [canFetch, examId]);

  const refresh = useCallback(async () => {
    if (!clerkEnabled || !examId) {
      setFiles([]);
      return;
    }
    if (!signedIn) return;
    await loadDocuments();
  }, [clerkEnabled, examId, loadDocuments, signedIn]);

  useEffect(() => {
    if (!canFetch || !examId) return;

    let cancelled = false;
    void (async () => {
      setError(null);
      setLoading(true);
      try {
        const token = await getClerkToken();
        if (cancelled || !token) return;
        const { documents } = await fetchDocuments(token, examId);
        if (cancelled) return;
        setFiles(documents.map(documentToExamFile));
      } catch (err) {
        if (cancelled) return;
        setError(sanitizeUserError(err instanceof Error ? err.message : "Failed to load files"));
        setFiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetch, examId, refreshKey]);

  const waitingForSession = clerkEnabled && Boolean(examId) && !sessionReady;

  return {
    files: clerkEnabled && examId && signedIn ? files : [],
    loading: clerkEnabled && examId ? waitingForSession || loading : false,
    error: clerkEnabled && examId ? error : null,
    refresh,
  };
}

export type DocumentStudyData = {
  questions: HomeQuestion[];
  flashcards: HomeFlashCard[];
  readPages: HomeReadPage[];
  summaries: HomeSummary[];
  rawMarkdown: string | null;
  status: string | null;
  progress: number;
  processingError: string | null;
  loading: boolean;
  error: string | null;
};

const EMPTY_STUDY: DocumentStudyData = {
  questions: [],
  flashcards: [],
  readPages: [],
  summaries: [],
  rawMarkdown: null,
  status: null,
  progress: 0,
  processingError: null,
  loading: false,
  error: null,
};

export function useDocumentStudy(documentId: string | undefined): DocumentStudyData {
  const clerkEnabled = useClerkEnabled();
  const enabled = clerkEnabled && Boolean(documentId);
  const [questions, setQuestions] = useState<HomeQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<HomeFlashCard[]>([]);
  const [readPages, setReadPages] = useState<HomeReadPage[]>([]);
  const [summaries, setSummaries] = useState<HomeSummary[]>([]);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !documentId) return;

    let cancelled = false;

    const loadContent = async () => {
      setError(null);
      try {
        const token = await getClerkToken();
        if (cancelled) return;
        setLoading(true);
        const doc = await fetchDocumentStatus(token, documentId);
        if (cancelled) return;
        setStatus(doc.status);
        setProgress(doc.progress ?? 0);
        setProcessingError(doc.error ?? null);

        const [qRes, fRes, sRes] = await Promise.all([
          fetchQuestions(token, { documentId, limit: 200 }),
          fetchFlashcards(token, documentId),
          fetchSummaries(token, documentId),
        ]);

        if (cancelled) return;
        setQuestions(qRes.questions.map(apiQuestionToHome));
        setFlashcards(fRes.flashcards.map(apiFlashcardToHome));
        setSummaries(sRes.summaries);

        if (doc.status === "completed" || doc.status === "extracting" || doc.status === "embedding") {
          try {
            const md = await fetchDocumentMarkdown(token, documentId);
            if (!cancelled && md.markdown) {
              setRawMarkdown(md.markdown);
              setReadPages(markdownToReadPages(md.markdown));
            }
          } catch {
            /* markdown optional until parse finishes */
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(sanitizeUserError(err instanceof Error ? err.message : "Failed to load study content"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadContent();

    pollRef.current = window.setInterval(async () => {
      try {
        const token = await getClerkToken();
        const doc = await fetchDocumentStatus(token, documentId);
        if (cancelled) return;
        setStatus(doc.status);
        setProgress(doc.progress ?? 0);
        setProcessingError(doc.error ?? null);
        if (doc.status === "completed" || doc.status === "failed") {
          if (pollRef.current !== null) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
          if (doc.status === "completed") {
            void loadContent();
          }
        } else if (doc.status === "extracting" || doc.status === "embedding") {
          try {
            const mdToken = await getClerkToken();
            const md = await fetchDocumentMarkdown(mdToken, documentId);
            if (!cancelled && md.markdown) {
              setRawMarkdown(md.markdown);
              setReadPages(markdownToReadPages(md.markdown));
            }
          } catch {
            /* markdown may not exist yet */
          }
          void loadContent();
        }
      } catch {
        /* ignore polling errors */
      }
    }, 4000);

    return () => {
      cancelled = true;
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, documentId]);

  if (!enabled) return EMPTY_STUDY;

  return {
    questions,
    flashcards,
    readPages,
    summaries,
    rawMarkdown,
    status,
    progress,
    processingError,
    loading,
    error,
  };
}

/** Resolve a document id from the URL into a HomeExamFile before the exam file list refreshes. */
export function useResolvedExamFile(
  documentId: string | null | undefined,
  liveFiles: HomeExamFile[],
  refreshKey = 0
): { file: HomeExamFile | null; loading: boolean; error: string | null } {
  const clerkEnabled = useClerkEnabled();
  const sessionReady = useClerkSessionReady();
  const signedIn = clerkEnabled && sessionReady && isClerkSignedIn();
  const enabled = signedIn && Boolean(documentId);

  const fromList = useMemo(() => {
    if (!documentId) return null;
    return (
      liveFiles.find((item) => item.documentId === documentId || item.id === documentId) ?? null
    );
  }, [documentId, liveFiles]);

  const [fetched, setFetched] = useState<{ id: string; file: HomeExamFile } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !documentId || fromList) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getClerkToken();
        if (cancelled || !token) return;
        const doc = await fetchDocumentStatus(token, documentId);
        if (cancelled) return;
        setFetched({ id: documentId, file: documentToExamFile(doc, 0) });
      } catch (err) {
        if (!cancelled) {
          setError(
            sanitizeUserError(err instanceof Error ? err.message : "Failed to load document")
          );
          setFetched(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId, enabled, fromList, refreshKey]);

  const resolved =
    fetched && documentId && fetched.id === documentId ? fetched.file : null;

  return {
    file: fromList ?? resolved,
    loading: Boolean(documentId && enabled && !fromList && loading),
    error: documentId ? error : null,
  };
}
