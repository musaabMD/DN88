"use client";

import { useCallback, useState } from "react";
import { getClerkToken } from "@/lib/clerk-token";
import {
  fetchCredits,
  sendAiChat,
  type AiChatResponse,
  type CreditSummary,
  MedGeniusApiError,
} from "./api";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

export function useMedGeniusCredits() {
  const clerkEnabled = useClerkEnabled();
  const [credits, setCredits] = useState<CreditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!clerkEnabled) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getClerkToken();
      const data = await fetchCredits(token);
      setCredits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credits");
    } finally {
      setLoading(false);
    }
  }, [clerkEnabled]);

  return { credits, loading, error, refresh };
}

export function useMedGeniusChat() {
  const clerkEnabled = useClerkEnabled();
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const send = useCallback(
    async (params: {
      message: string;
      contextType?: "general" | "document" | "question" | "topic" | "search";
      contextId?: string;
      questionText?: string;
      language?: "en" | "ar";
      mode?: "explain" | "easier" | "harder" | "evidence" | "eli5" | "visual";
    }): Promise<AiChatResponse | null> => {
      if (!clerkEnabled) return null;
      setLoading(true);
      try {
        const token = await getClerkToken();
        const result = await sendAiChat(token, {
          ...params,
          conversationId,
        });
        setConversationId(result.conversationId);
        return result;
      } catch (err) {
        if (err instanceof MedGeniusApiError && err.code === "INSUFFICIENT_CREDITS") {
          throw err;
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clerkEnabled, conversationId]
  );

  return { send, loading, conversationId, resetConversation: () => setConversationId(undefined) };
}
