"use client";

import type {
  HomeFlashCard,
  HomeQuestion,
  HomeReadPage,
  HomeSummary,
} from "@/lib/medgenius/home-data";
import { markdownToReadPages } from "@/lib/medgenius/home-data";
import type { DocumentExtractionResult } from "@/lib/rag/schemas";

const DB_NAME = "drnote-splitscreen-local";
const DB_VERSION = 1;
const STORE_NAME = "documents";

export type LocalSplitScreenDocument = {
  id: string;
  name: string;
  pageCount: number;
  color: string;
  rawMarkdown: string;
  readPages: HomeReadPage[];
  questions: HomeQuestion[];
  flashcards: HomeFlashCard[];
  summaries: HomeSummary[];
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open local document store"));
  });
}

export function isLocalSplitScreenDocumentId(id: string | null | undefined): id is string {
  return Boolean(id?.startsWith("local_"));
}

export async function saveLocalSplitScreenDocument(
  document: LocalSplitScreenDocument,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(document);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to save local document"));
  });
  db.close();
}

export async function loadLocalSplitScreenDocument(
  id: string,
): Promise<LocalSplitScreenDocument | null> {
  const db = await openDb();
  const result = await new Promise<LocalSplitScreenDocument | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as LocalSplitScreenDocument | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Failed to load local document"));
  });
  db.close();
  return result;
}

export function extractionToLocalDocument(params: {
  id: string;
  name: string;
  color: string;
  pageTexts: Array<{
    pageNumber: number;
    pageText: string;
    textSource?: "native" | "ocr" | "native+ocr" | "none";
  }>;
  extraction: DocumentExtractionResult;
}): LocalSplitScreenDocument {
  const rawMarkdown = buildMarkdown(params.name, params.pageTexts, params.extraction);
  const questions = params.extraction.questions.map((question, index) => {
    const version = question.versions.quizReady;
    const choices = version.choices.length > 0
      ? version.choices.map((choice) => choice.text)
      : ["A", "B", "C", "D"];
    const correctLabel = question.answer.correctChoiceId?.toLowerCase() ?? "";
    const correct = Math.max(
      0,
      version.choices.findIndex((choice) => choice.id.toLowerCase() === correctLabel),
    );

    return {
      id: question.id || `${params.id}_q${index + 1}`,
      stem:
        version.stem?.trim() ||
        question.versions.normalized.stem?.trim() ||
        question.versions.source.stem?.trim() ||
        `Question ${index + 1}`,
      options: choices,
      correct,
      explain: question.answer.rawAnswerText
        ? `Source answer: ${question.answer.rawAnswerText}`
        : "Review the source page for the explanation.",
    };
  });

  const flashcards = questions.slice(0, 120).map((question, index) => {
    const answer = question.options[question.correct] ?? "Review source answer";
    return {
      t: `Q${index + 1}: ${question.stem}`,
      d: `${answer}\n\n${question.explain}`,
    };
  });

  const pagesWithText = params.pageTexts.filter((page) => page.pageText.trim()).length;
  const quizReady = params.extraction.questions.filter(
    (question) => question.usabilityStatus === "quiz_ready",
  ).length;
  const reviewNeeded = Math.max(0, params.extraction.questions.length - quizReady);

  return {
    id: params.id,
    name: params.name,
    pageCount: params.extraction.pageCount,
    color: params.color,
    rawMarkdown,
    readPages: markdownToReadPages(rawMarkdown),
    questions,
    flashcards,
    summaries: [
      {
        id: `${params.id}_summary`,
        type: "Extraction summary",
        content: [
          `${params.extraction.pageCount} pages processed locally.`,
          `${pagesWithText} pages had extracted text.`,
          `${questions.length} MCQs detected.`,
          `${quizReady} quiz-ready questions.`,
          reviewNeeded ? `${reviewNeeded} questions need review.` : "No review-only questions detected.",
        ].join(" "),
      },
      ...buildPageSummaries(params.pageTexts).slice(0, 12),
    ],
    createdAt: Date.now(),
  };
}

function buildMarkdown(
  title: string,
  pageTexts: Array<{
    pageNumber: number;
    pageText: string;
    textSource?: "native" | "ocr" | "native+ocr" | "none";
  }>,
  extraction: DocumentExtractionResult,
): string {
  const chunks = [`# ${title}`];

  if (extraction.questions.length > 0) {
    chunks.push("## Extracted Questions");
    for (const [index, question] of extraction.questions.entries()) {
      const version = question.versions.quizReady;
      chunks.push(`### Q${index + 1}`);
      chunks.push(
        version.stem?.trim() ||
          question.versions.normalized.stem?.trim() ||
          question.versions.source.stem?.trim() ||
          `Question ${index + 1}`,
      );
      for (const choice of version.choices) {
        chunks.push(`- ${choice.label}. ${choice.text}`);
      }
      if (question.answer.rawAnswerText) {
        chunks.push(`> ${question.answer.rawAnswerText}`);
      }
    }
  }

  chunks.push("## Page Text");
  for (const page of pageTexts) {
    chunks.push(`### Page ${page.pageNumber}`);
    chunks.push(`Source: ${page.textSource ?? "native"}`);
    chunks.push(page.pageText.trim() || "_No selectable text found on this page._");
  }

  return chunks.join("\n\n");
}

function buildPageSummaries(
  pageTexts: Array<{
    pageNumber: number;
    pageText: string;
    textSource?: "native" | "ocr" | "native+ocr" | "none";
  }>,
): HomeSummary[] {
  return pageTexts
    .filter((page) => page.pageText.trim().length > 80)
    .map((page) => {
      const lines = page.pageText
        .split(/\n+/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean);
      const content = lines.slice(0, 5).join(" ");
      return {
        id: `page_${page.pageNumber}_summary`,
        type: `Page ${page.pageNumber}`,
        content: `${content.slice(0, 700)}${content.length > 700 ? "..." : ""}`,
      };
    });
}
