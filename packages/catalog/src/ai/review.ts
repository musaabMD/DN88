export const AI_REVIEW_VERSION = "1.0.0";

export type AiReviewResult = {
  status:
    | "changes-required"
    | "recommended-for-approval"
    | "not-for-publication";
  summary: string;
  strengths: string[];
  concerns: string[];
  requiredChanges: string[];
  safetyFlags: string[];
  evidenceFlags: string[];
};

export const AI_REVIEW_SYSTEM_PROMPT = `You are a medical content reviewer for DrNote/DN88.
Review the article for clinical accuracy signals, safety concerns, and publication readiness.
You may RECOMMEND approval but you must NEVER approve for publication yourself.
Respond only with valid JSON matching the schema.`;

export function buildAiReviewPrompt(article: {
  title: string;
  specialty: string;
  sections: Array<{ heading: string; bodyMarkdown: string }>;
}): string {
  const body = article.sections
    .map((s) => `## ${s.heading}\n${s.bodyMarkdown}`)
    .join("\n\n");

  return `Review this medical article.

Title: ${article.title}
Specialty: ${article.specialty}

${body}

Return JSON:
{
  "status": "changes-required" | "recommended-for-approval" | "not-for-publication",
  "summary": "string",
  "strengths": ["string"],
  "concerns": ["string"],
  "requiredChanges": ["string"],
  "safetyFlags": ["string"],
  "evidenceFlags": ["string"]
}`;
}

export function parseAiReviewResponse(raw: string): AiReviewResult | null {
  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) return null;
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as AiReviewResult;
    if (
      !parsed.status ||
      !["changes-required", "recommended-for-approval", "not-for-publication"].includes(
        parsed.status
      )
    ) {
      return null;
    }
    return {
      status: parsed.status,
      summary: parsed.summary ?? "",
      strengths: parsed.strengths ?? [],
      concerns: parsed.concerns ?? [],
      requiredChanges: parsed.requiredChanges ?? [],
      safetyFlags: parsed.safetyFlags ?? [],
      evidenceFlags: parsed.evidenceFlags ?? [],
    };
  } catch {
    return null;
  }
}

export async function runAiReview(
  article: {
    title: string;
    specialty: string;
    sections: Array<{ heading: string; bodyMarkdown: string }>;
  },
  options: { apiKey?: string; model?: string }
): Promise<AiReviewResult> {
  const apiKey = options.apiKey?.trim();
  const model = options.model ?? "gpt-4o-mini";

  if (!apiKey) {
    return {
      status: "changes-required",
      summary: "AI review skipped — no API key configured.",
      strengths: [],
      concerns: ["Automated review not run"],
      requiredChanges: ["Configure OPENAI_API_KEY for AI review"],
      safetyFlags: [],
      evidenceFlags: [],
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: AI_REVIEW_SYSTEM_PROMPT },
        { role: "user", content: buildAiReviewPrompt(article) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI review failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const parsed = parseAiReviewResponse(content);
  if (!parsed) {
    throw new Error("AI review returned invalid JSON");
  }
  return parsed;
}
