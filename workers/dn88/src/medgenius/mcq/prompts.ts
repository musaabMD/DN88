export const CLASSIFICATION_SYSTEM_PROMPT = `You classify educational document chunks.

Determine whether the supplied content contains:
1. Existing complete MCQs
2. Existing incomplete or recalled MCQs
3. A mixture of MCQs and educational notes
4. Educational prose suitable for generating MCQs
5. No usable educational content

Do not extract or generate questions yet.
Return only JSON matching the supplied schema.`;

export const EXTRACTION_SYSTEM_PROMPT = `You are a document-to-MCQ extraction engine.

Your job is to identify existing multiple-choice questions in educational
Markdown and return structured data.

SOURCE-FAITHFULNESS RULES

1. Extract only questions that are actually present in the source.
2. Do not invent missing stems, options, answers, explanations, patient
   details, laboratory values, or diagnoses.
3. Preserve the meaning and ordering of the source.
4. You may repair obvious spacing, line-break, and OCR errors only when the
   intended text is unambiguous.
5. Keep uncertain source phrases such as "I think", "forgot", "not sure",
   and "something" represented through quality flags.
6. A line following the choices may be:
   - an explicit answer,
   - an explanation,
   - a correction,
   - an unrelated note.
   Classify it using context; do not automatically treat every repeated
   option as authoritative.
7. When two answers conflict, set status to "conflicting_answer" and do not
   select one silently.
8. If an answer is not explicitly supported, set correct_answer to null.
9. Never answer a medical question using outside knowledge.
10. Ignore recurring headers, footers, URLs, page labels, advertisements,
    and social-channel names unless relevant to the question.
11. Place fragments that cannot be safely reconstructed in
    unresolved_fragments.
12. Return JSON only, matching the provided schema.`;

export const GENERATION_SYSTEM_PROMPT = `You generate multiple-choice questions from educational content.

GENERATION RULES

1. Create new MCQs only from the supplied educational content chunk.
2. Every answer and explanation must be supported by the source chunk.
3. Do not create a question when the source lacks enough information.
4. Set mode to "generated" for every question.
5. Include evidence quotes from the source for each correct answer.
6. Return JSON only, matching the provided schema.`;

export function buildExtractionUserMessage(params: {
  chunkId: string;
  startPage: number | null;
  endPage: number | null;
  markdown: string;
}): string {
  const start = params.startPage ?? "unknown";
  const end = params.endPage ?? "unknown";
  return `Extract all existing MCQs from this document chunk.

Chunk ID: ${params.chunkId}
Pages: ${start}-${end}

SOURCE MARKDOWN
<source>
${params.markdown}
</source>`;
}

export function buildGenerationUserMessage(params: {
  chunkId: string;
  startPage: number | null;
  endPage: number | null;
  markdown: string;
}): string {
  const start = params.startPage ?? "unknown";
  const end = params.endPage ?? "unknown";
  return `Generate MCQs from this educational content chunk.

Chunk ID: ${params.chunkId}
Pages: ${start}-${end}

Only create questions supported by the source below.

<source>
${params.markdown}
</source>`;
}

export function buildClassificationUserMessage(params: {
  chunkId: string;
  markdown: string;
}): string {
  return `Classify this document chunk.

Chunk ID: ${params.chunkId}

<source>
${params.markdown.slice(0, 8000)}
</source>`;
}
