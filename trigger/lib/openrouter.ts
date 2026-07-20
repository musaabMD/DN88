type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
};

export async function chatCompletionJson(options: {
  apiKey: string;
  system: string;
  user: string | OpenRouterContentPart[];
  model?: string;
  maxTokens?: number;
}): Promise<{ content: string; model: string; tokensUsed: number }> {
  const model = options.model ?? "google/gemini-2.0-flash-001";
  const messages: OpenRouterMessage[] = [
    { role: "system", content: options.system },
    { role: "user", content: options.user },
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://drnote.co",
      "X-Title": "DrNote RAG Extraction",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens ?? 8192,
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
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
  return {
    content,
    model,
    tokensUsed: payload.usage?.total_tokens ?? Math.ceil(content.length / 4),
  };
}

export function parseLlmJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  return JSON.parse(body);
}
