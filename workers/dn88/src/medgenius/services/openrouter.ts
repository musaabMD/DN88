import type { OpenRouterMessage } from "../types";

export type OpenRouterResult = {
  content: string;
  tokensUsed: number;
  model: string;
};

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
const REASONING_MODEL = "anthropic/claude-3.5-sonnet";

export async function chatCompletion(
  apiKey: string,
  messages: OpenRouterMessage[],
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
    throw new Error(payload.error?.message ?? "OpenRouter request failed");
  }

  const content = payload.choices?.[0]?.message?.content ?? "";
  const tokensUsed = payload.usage?.total_tokens ?? Math.ceil(content.length / 4);

  return { content, tokensUsed, model };
}

export async function extractQuestionsFromMarkdown(
  apiKey: string,
  markdown: string,
  documentName: string
): Promise<string> {
  const truncated =
    markdown.length > 80_000 ? `${markdown.slice(0, 80_000)}\n\n[truncated]` : markdown;

  const result = await chatCompletion(
    apiKey,
    [
      {
        role: "system",
        content: `You extract medical exam questions from study materials. Return valid JSON only with shape:
{"questions":[{"originalText":"...","cleanedText":"...","options":["A","B","C","D"],"correctAnswer":0,"confidence":0.9,"explanation":"...","topic":"Cardiology","subtopic":"ACS","difficulty":"medium","page":1,"tags":["high-yield"]}]}
Rules:
- Preserve original wording in originalText; put polished board-style text in cleanedText
- correctAnswer is 0-based index or null if unknown
- confidence 0-1 for answer certainty
- Mark conflicting answers with confidence < 0.5
- Extract ALL recall-style questions, MCQs, and vignettes
- Never invent questions not present in the source`,
      },
      {
        role: "user",
        content: `Document: ${documentName}\n\n${truncated}`,
      },
    ],
    { jsonMode: true, maxTokens: 8192 }
  );

  return result.content;
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
