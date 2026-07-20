import type { ExtractedQuestion } from "../types";

const SKIP_LINE =
  /^(tried to remember|wish you all|may allah|the new questions|the missing questions|recall questions)/i;

function isTitleLine(line: string): boolean {
  return (
    /SMLE/i.test(line) &&
    /exam|morning|evening|recall/i.test(line) &&
    line.length < 120 &&
    !line.includes("?")
  );
}

function shouldSkipLine(line: string): boolean {
  return SKIP_LINE.test(line) || isTitleLine(line);
}

function cleanOption(line: string): string {
  return line.replace(/\/+\s*$/, "").replace(/\*\*/g, "").trim();
}

function looksLikeOption(line: string): boolean {
  const cleaned = cleanOption(line);
  if (!cleaned || cleaned.length > 90) return false;
  if (/^#/.test(cleaned)) return false;
  if (shouldSkipLine(cleaned)) return false;
  if (/\?$/.test(cleaned) && cleaned.split(/\s+/).length >= 5) return false;
  if (/\b(patient|year old|history of|presenting|physical exam|woman with|man with)\b/i.test(cleaned)) {
    return false;
  }
  return true;
}

function isStemLine(line: string): boolean {
  if (shouldSkipLine(line)) return false;
  if (line.includes("?")) return true;
  if (line.length < 20) return false;
  return /\b(what|which|how|when|where|why|best next|most likely|diagnosis|management|assessment|asking about|check for|order to|transmitted)\b/i.test(
    line
  );
}

function looksLikeNewStem(line: string): boolean {
  if (shouldSkipLine(line)) return false;
  return isStemLine(line);
}

/**
 * Heuristic extractor for SMLE-style recall sheets: stem (often ending in "?"),
 * then unlabeled option lines (may end with "/"), without A/B/C/D prefixes.
 */
export function extractRecallMcqsFromMarkdown(markdown: string): ExtractedQuestion[] {
  const lines = markdown
    .replace(/\*\*/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const questions: ExtractedQuestion[] = [];
  let i = 0;

  while (i < lines.length) {
    while (i < lines.length && shouldSkipLine(lines[i] ?? "")) i += 1;
    if (i >= lines.length) break;

    const line = lines[i] ?? "";
    if (!isStemLine(line)) {
      i += 1;
      continue;
    }

    const stemParts: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? "";
      if (shouldSkipLine(current)) {
        i += 1;
        continue;
      }
      stemParts.push(current);
      i += 1;
      if (current.includes("?")) break;
      const next = lines[i];
      if (next && looksLikeOption(next) && stemParts.length >= 1) break;
      if (stemParts.length > 8) break;
    }

    const stem = stemParts.join(" ").trim();
    if (!stem) continue;

    const options: string[] = [];
    while (i < lines.length && options.length < 6) {
      const current = lines[i] ?? "";
      if (shouldSkipLine(current)) {
        i += 1;
        continue;
      }
      if (looksLikeNewStem(current) && options.length >= 2) break;
      if (!looksLikeOption(current)) break;
      options.push(cleanOption(current));
      i += 1;
    }

    if (options.length >= 2) {
      questions.push({
        originalText: stem,
        cleanedText: stem,
        options,
        correctAnswer: null,
        confidence: 0.35,
        tags: ["recall"],
      });
    }
  }

  return questions;
}
