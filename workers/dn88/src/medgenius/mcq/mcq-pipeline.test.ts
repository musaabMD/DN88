import { describe, expect, it } from "vitest";
import { chunkMarkdownByQuestionBoundaries, normalizeStemForDedup } from "./chunker";
import { ensurePageAwareMarkdown, mergePageRangeMarkdown } from "./markdown-pages";
import { detectSuspiciousPages, stripRepeatedHeadersAndUrls } from "./preprocess";
import { applyValidation, dedupeQuestions, validateQuestion } from "./validation";
import type { StructuredMcq } from "./types";

describe("markdown-pages", () => {
  it("adds page markers when missing", () => {
    const result = ensurePageAwareMarkdown("Hello world");
    expect(result).toContain("<!-- PAGE:1 -->");
  });

  it("merges page range parts", () => {
    const merged = mergePageRangeMarkdown([
      { startPage: 1, markdown: "Page one" },
      { startPage: 2, markdown: "Page two" },
    ]);
    expect(merged).toContain("<!-- PAGE:1 -->");
    expect(merged).toContain("<!-- PAGE:2 -->");
  });
});

describe("chunker", () => {
  it("chunks around question boundaries", () => {
    const markdown = `<!-- PAGE:1 -->
Which of the following is true?
A. One
B. Two

What is the diagnosis?
A. Alpha
B. Beta`;

    const chunks = chunkMarkdownByQuestionBoundaries(markdown);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks.some((c) => c.likelyMcqBlock)).toBe(true);
  });

  it("dedupes normalized stems", () => {
    const a = normalizeStemForDedup("What is the cause?");
    const b = normalizeStemForDedup("What   is the cause?");
    expect(a).toBe(b);
  });
});

describe("validation", () => {
  const baseQuestion: StructuredMcq = {
    id: "q1",
    mode: "extracted",
    status: "incomplete_options",
    stem: "A patient presents with chest pain. What is the next step?",
    options: [
      { label: "A", text: "ECG" },
      { label: "B", text: "CT scan" },
      { label: "C", text: null },
      { label: "D", text: null },
    ],
    correctAnswer: null,
    explanation: null,
    topic: null,
    source: { page: 3, chunkId: "chunk_001", quote: "..." },
    quality: {
      stemComplete: true,
      optionsComplete: false,
      answerExplicit: false,
      containsSourceUncertainty: true,
      needsReview: true,
      issues: ["Options C and D are missing"],
    },
  };

  it("flags missing options without inventing them", () => {
    const issues = validateQuestion(baseQuestion);
    expect(issues.some((i) => i.includes("missing"))).toBe(true);
  });

  it("dedupes by stem", () => {
    const other = { ...baseQuestion, id: "q2", correctAnswer: { label: "A", text: "ECG", confidence: 0.9, evidence: "A" }, status: "complete" as const };
    const deduped = dedupeQuestions([baseQuestion, other]);
    expect(deduped).toHaveLength(1);
  });

  it("applies validation issues to quality", () => {
    const validated = applyValidation(baseQuestion);
    expect(validated.quality.needsReview).toBe(true);
  });
});

describe("preprocess", () => {
  it("strips telegram urls", () => {
    const cleaned = stripRepeatedHeadersAndUrls("Question\nhttps://t.me/example\nA. Yes");
    expect(cleaned).not.toContain("t.me");
  });

  it("detects broken options", () => {
    const markdown = `<!-- PAGE:6 -->
Recall question?
A. Start medication
B. Related
C. >
D. >`;
    const suspicious = detectSuspiciousPages(markdown);
    expect(suspicious.some((p) => p.page === 6)).toBe(true);
  });
});
