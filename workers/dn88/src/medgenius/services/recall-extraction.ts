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

function cleanOption(text: string): string {
  return text.replace(/\/+\s*$/, "").replace(/\*\*/g, "").trim();
}

function splitSlashOptions(line: string): string[] {
  if (!/\/.+\//.test(line) && line.split("/").length < 3) return [];
  return line
    .split(/\s*\/\s*/)
    .map(cleanOption)
    .filter((part) => part.length > 0 && part.length < 120);
}

function looksLikeOption(line: string): boolean {
  const cleaned = cleanOption(line);
  if (!cleaned) return false;
  if (splitSlashOptions(line).length >= 2) return true;
  if (cleaned.length > 90) return false;
  if (/^#/.test(cleaned)) return false;
  if (shouldSkipLine(cleaned)) return false;
  if (/\?$/.test(cleaned) && cleaned.split(/\s+/).length >= 5) return false;
  if (/\b(patient|year old|history of|presenting|physical exam|woman with|man with)\b/i.test(cleaned)) {
    return false;
  }
  return true;
}

function optionsFromLine(line: string): string[] {
  const slash = splitSlashOptions(line);
  if (slash.length >= 2) return slash;
  if (looksLikeOption(line)) return [cleanOption(line)];
  return [];
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

/** Expand "opt1/ opt2/ opt3" onto separate lines for line-based parsing. */
export function normalizeRecallMarkdown(markdown: string): string {
  return markdown
    .split("\n")
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) return [];
      if (trimmed.includes("?")) return [trimmed];
      const slashOpts = splitSlashOptions(trimmed);
      if (slashOpts.length >= 2) return slashOpts;
      return [trimmed];
    })
    .join("\n");
}

/**
 * Heuristic extractor for SMLE-style recall sheets: stem (often ending in "?"),
 * then unlabeled option lines (may be slash-separated on one line).
 */
export function extractRecallMcqsFromMarkdown(markdown: string): ExtractedQuestion[] {
  const normalized = normalizeRecallMarkdown(markdown);
  const lines = normalized
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
      if (next && optionsFromLine(next).length > 0 && stemParts.length >= 1) break;
      if (stemParts.length > 8) break;
    }

    const stem = stemParts.join(" ").trim();
    if (!stem) continue;

    const options: string[] = [];
    while (i < lines.length && options.length < 8) {
      const current = lines[i] ?? "";
      if (shouldSkipLine(current)) {
        i += 1;
        continue;
      }
      if (looksLikeNewStem(current) && options.length >= 2) break;

      const fromLine = optionsFromLine(current);
      if (fromLine.length === 0) break;

      options.push(...fromLine);
      i += 1;
    }

    if (options.length >= 2) {
      questions.push({
        originalText: stem,
        cleanedText: stem,
        options: options.slice(0, 6),
        correctAnswer: null,
        confidence: 0.35,
        tags: ["recall"],
      });
    }
  }

  return questions;
}
