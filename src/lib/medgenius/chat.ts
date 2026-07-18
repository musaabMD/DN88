import { sendAiChat, MedGeniusApiError } from "./api";
import { sanitizeUserError } from "./errors";

export type AskAiParams = {
  message: string;
  conversationId?: string;
  contextType?: "general" | "document" | "question" | "topic" | "search";
  contextId?: string;
  questionText?: string;
  documentContext?: string;
  language?: "en" | "ar";
  mode?: "explain" | "easier" | "harder" | "evidence" | "eli5" | "visual";
};

export type AskAiResult = {
  reply: string;
  conversationId: string;
  creditsRemaining?: number;
  fromApi: boolean;
};

/**
 * Calls MedGenius backend when authenticated; otherwise returns a local fallback.
 */
export async function askMedGeniusAi(
  token: string | null,
  params: AskAiParams,
  fallback: () => string
): Promise<AskAiResult> {
  if (!token) {
    return { reply: fallback(), conversationId: "", fromApi: false };
  }

  try {
    const result = await sendAiChat(token, {
      message: params.message,
      conversationId: params.conversationId,
      contextType: params.contextType,
      contextId: params.contextId,
      questionText: params.questionText ?? params.documentContext,
      language: params.language,
      mode: params.mode,
    });

    return {
      reply: result.reply,
      conversationId: result.conversationId,
      creditsRemaining: result.creditsRemaining,
      fromApi: true,
    };
  } catch (error) {
    if (error instanceof MedGeniusApiError && error.status === 402) {
      return {
        reply: sanitizeUserError(error.message, "credits"),
        conversationId: params.conversationId ?? "",
        fromApi: false,
      };
    }
    if (error instanceof MedGeniusApiError) {
      return {
        reply: sanitizeUserError(error.message, "ai"),
        conversationId: params.conversationId ?? "",
        fromApi: false,
      };
    }
    return { reply: fallback(), conversationId: params.conversationId ?? "", fromApi: false };
  }
}
