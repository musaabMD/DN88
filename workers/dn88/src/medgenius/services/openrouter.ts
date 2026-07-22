import type { ExtractedQuestion, OpenRouterMessage } from "../types";
import { sanitizeUserError } from "./user-errors";
import type { StoredPageImage } from "./markdown-images";

export type OpenRouterResult = {
  content: string;
  tokensUsed: number;
  model: string;
};

type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
};

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
const REASONING_MODEL = "anthropic/claude-3.5-sonnet";
const EXTRACTION_MODEL = "google/gemini-2.0-flash-001";

export async function chatCompletion(
  apiKey: string,
  messages: OpenRouterMessage[] | OpenRouterChatMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }
): Promise<OpenRouterResult> {
  const model = options?.model ?? DEFAULT_MODEL;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: options?.maxTokens ?? 2048,
    temperature: options?.temperature ?? 0.3,
  };

  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://drnote.co",
      "X-Title": "MedGenius AI",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(sanitizeUserError(payload.error?.message ?? "AI request failed", "ai"));
  }

  const content = payload.choices?.[0]?.message?.content ?? "";
  const tokensUsed = payload.usage?.total_tokens ?? Math.ceil(content.length / 4);

  return { content, tokensUsed, model };
}

export function parseLlmJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  return JSON.parse(body);
}

const EXTRACTION_SYSTEM_PROMPT = `You extract medical exam questions from study materials. Return valid JSON only with shape:
{"questions":[{"originalText":"...","cleanedText":"...","options":["A","B","C","D"],"correctAnswer":0,"confidence":0.9,"explanation":"...","topic":"Cardiology","subtopic":"ACS","difficulty":"medium","page":1,"imageRefs":[0],"tags":["high-yield"]}]}
Rules:
- Preserve original wording in originalText; put polished board-style text in cleanedText
- correctAnswer is 0-based index or null if unknown
- confidence 0-1 for answer certainty
- Mark conflicting answers with confidence < 0.5
- Extract ALL numbered MCQs (1. 2. 3.), A/B/C/D options, recall Q&A, and clinical vignettes
- SMLE/recall sheets: stem ends with "?", options are unlabeled lines below (may end with "/"), skip title/intro lines
- Include questions even when the answer key is missing (set correctAnswer null, confidence low)
- Never invent questions not present in the source chunk
- Always set page to the PDF page number provided in the user message
- Adjacent-page context may be included for stems/options that cross a page break — use it to complete questions that start or continue on this page; do not extract questions that belong entirely to another page
- When images are attached, use imageRefs (0-based indices) for questions that reference ECGs, scans, histology, or diagrams
- Image-based MCQs: describe what the image shows in cleanedText when the stem references a figure`;

/** Characters of neighboring pages to include so vignettes spanning page breaks stay intact. */
const ADJACENT_PAGE_OVERLAP_CHARS = 1_200;

export function chunkMarkdownForExtraction(markdown: string, maxChunkSize = 18_000): string[] {
  if (markdown.length <= maxChunkSize) return [markdown];

  const sections = markdown.split(/\n(?=##?\s+)/).filter((s) => s.trim());
  if (sections.length <= 1) {
    const chunks: string[] = [];
    for (let i = 0; i < markdown.length; i += maxChunkSize) {
      chunks.push(markdown.slice(i, i + maxChunkSize));
    }
    return chunks;
  }

  const chunks: string[] = [];
  let current = "";
  for (const section of sections) {
    if (current.length + section.length > maxChunkSize && current) {
      chunks.push(current);
      current = section;
    } else {
      current = current ? `${current}\n${section}` : section;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export type PageExtractionInput = {
  pageNumber: number;
  markdown: string;
  images: StoredPageImage[];
  imageDataUrls?: string[];
};

function tailText(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(-maxChars);
}

function headText(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars);
}

function buildPageExtractionContent(
  documentName: string,
  page: PageExtractionInput,
  pageTotal: number,
  adjacent?: { previous?: string; next?: string }
): OpenRouterChatMessage["content"] {
  const sections: string[] = [
    `Document: ${documentName}`,
    `PDF page ${page.pageNumber} of ${pageTotal}`,
    "",
  ];

  if (adjacent?.previous?.trim()) {
    sections.push(
      `--- Context from end of previous page (for incomplete stems only) ---`,
      adjacent.previous.trim(),
      ""
    );
  }

  sections.push(`--- Current page (extract questions from here) ---`, page.markdown);

  if (adjacent?.next?.trim()) {
    sections.push(
      "",
      `--- Context from start of next page (for options/answers continuing past the break) ---`,
      adjacent.next.trim()
    );
  }

  const header = sections.join("\n");
  const parts: OpenRouterContentPart[] = [{ type: "text", text: header }];

  const dataUrls = page.imageDataUrls ?? [];
  for (const url of dataUrls) {
    if (url.startsWith("data:")) {
      parts.push({ type: "image_url", image_url: { url } });
    }
  }

  if (page.images.length > 0 && dataUrls.length === 0) {
    const imageList = page.images
      .map((img, index) => `[${index}] ${img.alt || img.filename}`)
      .join("\n");
    parts[0] = {
      type: "text",
      text: `${header}\n\nImages on this page:\n${imageList}`,
    };
  }

  return parts.length > 1 ? parts : header;
}

async function extractQuestionsFromPage(
  apiKey: string,
  page: PageExtractionInput,
  documentName: string,
  pageTotal: number,
  adjacent?: { previous?: string; next?: string }
): Promise<string> {
  const result = await chatCompletion(
    apiKey,
    [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildPageExtractionContent(documentName, page, pageTotal, adjacent),
      },
    ],
    { model: EXTRACTION_MODEL, jsonMode: true, maxTokens: 8192, temperature: 0.2 }
  );
  return result.content;
}

export async function extractQuestionsFromPages(
  apiKey: string,
  pages: PageExtractionInput[],
  documentName: string
): Promise<string> {
  const merged = new Map<string, ExtractedQuestion>();
  const pageTotal = pages.length;

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    if (!page || !page.markdown.trim()) continue;

    const previousPage = pages[index - 1];
    const nextPage = pages[index + 1];
    const adjacent = {
      previous: previousPage?.markdown
        ? tailText(previousPage.markdown, ADJACENT_PAGE_OVERLAP_CHARS)
        : undefined,
      next: nextPage?.markdown
        ? headText(nextPage.markdown, ADJACENT_PAGE_OVERLAP_CHARS)
        : undefined,
    };

    try {
      const jsonContent = await extractQuestionsFromPage(
        apiKey,
        page,
        documentName,
        pageTotal,
        adjacent
      );
      const parsed = parseLlmJsonContent(jsonContent) as {
        questions?: Array<
          ExtractedQuestion & {
            imageRefs?: number[];
          }
        >;
      };
      if (!Array.isArray(parsed.questions)) continue;

      for (const q of parsed.questions) {
        const key = q.originalText?.trim().toLowerCase().slice(0, 240);
        if (!key || merged.has(key)) continue;

        const withPage: ExtractedQuestion = {
          ...q,
          page: page.pageNumber,
        };

        if (Array.isArray(q.imageRefs) && q.imageRefs.length > 0) {
          withPage.images = q.imageRefs
            .map((refIndex) => page.images[refIndex])
            .filter((img): img is StoredPageImage => Boolean(img))
            .map((img) => ({
              r2Key: img.r2Key,
              page: img.page,
              type: img.mimeType,
              position: img.position,
              alt: img.alt,
            }));
        }

        merged.set(key, withPage);
      }
    } catch (error) {
      console.error("Question extraction page failed", {
        documentName,
        page: page.pageNumber,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return JSON.stringify({ questions: [...merged.values()] });
}

async function extractQuestionsFromChunk(
  apiKey: string,
  chunk: string,
  documentName: string,
  chunkIndex: number,
  chunkTotal: number
): Promise<string> {
  const result = await chatCompletion(
    apiKey,
    [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Document: ${documentName}\nChunk ${chunkIndex} of ${chunkTotal}\n\n${chunk}`,
      },
    ],
    { model: EXTRACTION_MODEL, jsonMode: true, maxTokens: 8192, temperature: 0.2 }
  );
  return result.content;
}

export async function extractQuestionsFromMarkdown(
  apiKey: string,
  markdown: string,
  documentName: string,
  pages?: PageExtractionInput[]
): Promise<string> {
  if (pages && pages.length > 0) {
    return extractQuestionsFromPages(apiKey, pages, documentName);
  }

  const chunks = chunkMarkdownForExtraction(markdown);
  const merged = new Map<string, import("../types").ExtractedQuestion>();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    try {
      const jsonContent = await extractQuestionsFromChunk(
        apiKey,
        chunk,
        documentName,
        i + 1,
        chunks.length
      );
      const parsed = parseLlmJsonContent(jsonContent) as {
        questions?: import("../types").ExtractedQuestion[];
      };
      if (!Array.isArray(parsed.questions)) continue;
      for (const q of parsed.questions) {
        const key = q.originalText?.trim().toLowerCase().slice(0, 240);
        if (key && !merged.has(key)) merged.set(key, q);
      }
    } catch (error) {
      console.error("Question extraction chunk failed", {
        documentName,
        chunk: i + 1,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return JSON.stringify({ questions: [...merged.values()] });
}

export async function tutorReply(
  apiKey: string,
  params: {
    userMessage: string;
    context?: string;
    questionText?: string;
    language?: "en" | "ar";
    mode?: "explain" | "easier" | "harder" | "evidence" | "eli5" | "visual";
  }
): Promise<OpenRouterResult> {
  const modeInstructions: Record<string, string> = {
    explain: "Explain the medical concept clearly for an exam student.",
    easier: "Give a simpler example with a basic clinical scenario.",
    harder: "Give a more complex variant with comorbidities or atypical presentation.",
    evidence: "Cite guideline-level reasoning (ACC/AHA, NICE, etc.) without fabricating specific citations.",
    eli5: "Explain like the student is five years old, then add one clinical pearl.",
    visual: "Describe what the student should visualize (ECG pattern, anatomy, histology).",
  };

  const langNote =
    params.language === "ar"
      ? "Respond in Arabic (Modern Standard Arabic suitable for medical students)."
      : "Respond in English.";

  const systemParts = [
    "You are MedGenius AI, an expert medical exam tutor for USMLE, SMLE, PLAB, MRCP, and similar licensing exams.",
    langNote,
    params.mode ? modeInstructions[params.mode] ?? modeInstructions.explain : modeInstructions.explain,
    "Never pretend uncertain answers are correct. If evidence is weak, say so.",
    "Keep responses concise but high-yield.",
  ];

  const userParts: string[] = [];
  if (params.questionText) userParts.push(`Question context:\n${params.questionText}`);
  if (params.context) userParts.push(`Study material:\n${params.context.slice(0, 12_000)}`);
  userParts.push(`Student asks: ${params.userMessage}`);

  return chatCompletion(
    apiKey,
    [
      { role: "system", content: systemParts.join("\n") },
      { role: "user", content: userParts.join("\n\n") },
    ],
    { model: params.mode === "evidence" ? REASONING_MODEL : DEFAULT_MODEL }
  );
}

export async function semanticSearchQuery(
  apiKey: string,
  query: string,
  questionSummaries: string[]
): Promise<number[]> {
  if (questionSummaries.length === 0) return [];

  const result = await chatCompletion(
    apiKey,
    [
      {
        role: "system",
        content:
          'Rank question indices by relevance to the search query. Return JSON: {"rankedIndices":[0,2,1,...]} including only relevant indices, most relevant first. Max 50.',
      },
      {
        role: "user",
        content: `Query: ${query}\n\nQuestions:\n${questionSummaries.map((q, i) => `[${i}] ${q.slice(0, 200)}`).join("\n")}`,
      },
    ],
    { jsonMode: true, maxTokens: 512 }
  );

  try {
    const parsed = JSON.parse(result.content) as { rankedIndices?: number[] };
    return parsed.rankedIndices ?? [];
  } catch {
    return [];
  }
}

export async function generateFlashcardsFromQuestion(
  apiKey: string,
  questionText: string,
  explanation: string
): Promise<string> {
  const result = await chatCompletion(
    apiKey,
    [
      {
        role: "system",
        content:
          'Generate one flashcard. Return JSON: {"front":"...","back":"...","highYieldFact":"...","memoryTrick":"..."}',
      },
      {
        role: "user",
        content: `Question: ${questionText}\nExplanation: ${explanation}`,
      },
    ],
    { jsonMode: true, maxTokens: 512 }
  );

  return result.content;
}

export async function generateDocumentSummary(
  apiKey: string,
  markdown: string,
  summaryType: string
): Promise<string> {
  const typePrompts: Record<string, string> = {
    summary: "Write a structured summary with headings.",
    cheat_sheet: "Write a dense cheat sheet with bullet points.",
    high_yield: "Extract only high-yield exam facts.",
    exam_pearls: "List exam pearls and common traps.",
    one_page: "Fit everything on one page — ultra condensed.",
  };

  const result = await chatCompletion(
    apiKey,
    [
      {
        role: "system",
        content: `You are a medical education expert. ${typePrompts[summaryType] ?? typePrompts.summary} Use markdown.`,
      },
      {
        role: "user",
        content: markdown.slice(0, 60_000),
      },
    ],
    { maxTokens: 4096 }
  );

  return result.content;
}

export function estimateTokenCreditCost(tokensUsed: number): number {
  const base = 5;
  const per1k = Math.ceil(tokensUsed / 1000) * 8;
  return base + per1k;
}
