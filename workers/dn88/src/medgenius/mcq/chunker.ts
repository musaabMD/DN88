import type { ExtractionChunk } from "./types";

const QUESTION_PATTERNS = [
  /\bwhich of the following\b/i,
  /\bwhat is the (?:most appropriate|next|likely)\b/i,
  /\bwhat is the diagnosis\b/i,
  /\bwhat is the cause\b/i,
  /\bwhat is the management\b/i,
  /\bwhat is the best\b/i,
  /\bhow (?:should|would) you\b/i,
  /\bmost likely diagnosis\b/i,
  /\bnext best step\b/i,
];

const OPTION_PATTERN = /(?:^|\n)\s*([A-H])[\.\)]\s+/g;
const PAGE_MARKER = /^<!--\s*PAGE:(\d+)\s*-->$/;

const OVERLAP_CHARS = 200;
const TEXTBOOK_CHUNK_CHARS = 6000;
const MAX_CHUNK_CHARS = 12_000;

export function chunkMarkdownByQuestionBoundaries(markdown: string): ExtractionChunk[] {
  const cleaned = markdown.trim();
  if (!cleaned) return [];

  const blocks = splitIntoQuestionBlocks(cleaned);
  if (blocks.length === 0) {
    return [makeChunk("chunk_001", cleaned, null, null, false)];
  }

  const chunks: ExtractionChunk[] = [];
  let chunkIndex = 0;

  for (const block of blocks) {
    if (block.text.length <= MAX_CHUNK_CHARS) {
      chunkIndex++;
      chunks.push(
        makeChunk(
          `chunk_${String(chunkIndex).padStart(3, "0")}`,
          block.text,
          block.startPage,
          block.endPage,
          block.likelyMcq
        )
      );
      continue;
    }

    const subChunks = splitLargeBlock(block.text, TEXTBOOK_CHUNK_CHARS);
    for (const sub of subChunks) {
      chunkIndex++;
      chunks.push(
        makeChunk(
          `chunk_${String(chunkIndex).padStart(3, "0")}`,
          sub,
          block.startPage,
          block.endPage,
          block.likelyMcq
        )
      );
    }
  }

  return applyOverlap(chunks);
}

type QuestionBlock = {
  text: string;
  startPage: number | null;
  endPage: number | null;
  likelyMcq: boolean;
};

function splitIntoQuestionBlocks(markdown: string): QuestionBlock[] {
  const lines = markdown.split("\n");
  const blocks: QuestionBlock[] = [];
  let buffer: string[] = [];
  let startPage: number | null = null;
  let endPage: number | null = null;
  let likelyMcq = false;

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text.length >= 40) {
      blocks.push({ text, startPage, endPage, likelyMcq });
    }
    buffer = [];
    likelyMcq = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const pageMatch = line.match(PAGE_MARKER);
    if (pageMatch?.[1]) {
      const page = parseInt(pageMatch[1], 10);
      if (startPage === null) startPage = page;
      endPage = page;
    }

    const isQuestionStart = looksLikeQuestionStart(line, lines.slice(i, i + 8).join("\n"));
    if (isQuestionStart && buffer.length > 0) {
      flush();
      startPage = pageMatch ? parseInt(pageMatch[1]!, 10) : startPage;
    }

    if (isQuestionStart) likelyMcq = true;
    buffer.push(line);
  }
  flush();

  if (blocks.length === 0 && markdown.length > 0) {
    return [{ text: markdown, startPage: null, endPage: null, likelyMcq: hasMcqSignals(markdown) }];
  }

  return blocks;
}

function looksLikeQuestionStart(line: string, lookahead: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^\d+[\.\)]\s/.test(trimmed) && trimmed.includes("?")) return true;
  if (trimmed.includes("?") && trimmed.length >= 15) return true;
  if (QUESTION_PATTERNS.some((p) => p.test(trimmed))) return true;
  if (/^\*\*Q\d+/i.test(trimmed)) return true;

  OPTION_PATTERN.lastIndex = 0;
  const optionMatches = lookahead.match(OPTION_PATTERN);
  return (optionMatches?.length ?? 0) >= 2;
}

function hasMcqSignals(text: string): boolean {
  OPTION_PATTERN.lastIndex = 0;
  const options = text.match(OPTION_PATTERN);
  return (options?.length ?? 0) >= 2 || text.includes("?");
}

function splitLargeBlock(text: string, maxSize: number): string[] {
  const sections = text.split(/\n(?=##?\s+)/).filter((s) => s.trim());
  if (sections.length <= 1) {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxSize - OVERLAP_CHARS) {
      chunks.push(text.slice(i, i + maxSize));
    }
    return chunks;
  }

  const chunks: string[] = [];
  let current = "";
  for (const section of sections) {
    if (current.length + section.length > maxSize && current) {
      chunks.push(current);
      current = section;
    } else {
      current = current ? `${current}\n${section}` : section;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function applyOverlap(chunks: ExtractionChunk[]): ExtractionChunk[] {
  if (chunks.length <= 1) return chunks;

  return chunks.map((chunk, index) => {
    if (index === 0) return chunk;
    const prev = chunks[index - 1]?.markdown ?? "";
    const overlap = prev.slice(-OVERLAP_CHARS);
    return {
      ...chunk,
      markdown: overlap ? `${overlap}\n\n${chunk.markdown}` : chunk.markdown,
    };
  });
}

function makeChunk(
  chunkId: string,
  markdown: string,
  startPage: number | null,
  endPage: number | null,
  likelyMcqBlock: boolean
): ExtractionChunk {
  return { chunkId, markdown, startPage, endPage, likelyMcqBlock };
}

export function filterChunksForExtraction(chunks: ExtractionChunk[]): ExtractionChunk[] {
  const mcqChunks = chunks.filter((c) => c.likelyMcqBlock);
  return mcqChunks.length > 0 ? mcqChunks : chunks;
}

export function normalizeStemForDedup(stem: string): string {
  return stem
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s?]/g, "")
    .trim()
    .slice(0, 240);
}
