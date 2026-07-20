import {
  checkCredits,
  ensureUserProfile,
  getCreditSummary,
  recordAiTokenUsage,
} from "./credits";
import { resolvePlan } from "../config/plans";
import { tutorReply, estimateTokenCreditCost } from "./openrouter";
import { isMedGeniusTestMode } from "./test-mode";
import type { Bindings } from "../../types";

export async function handleTutorChat(
  env: Bindings,
  params: {
    userId: string;
    email: string | null;
    publicMetadata?: Record<string, unknown>;
    message: string;
    conversationId?: string;
    contextType?: "general" | "document" | "question" | "topic" | "search";
    contextId?: string;
    questionText?: string;
    documentMarkdown?: string;
    language?: "en" | "ar";
    mode?: "explain" | "easier" | "harder" | "evidence" | "eli5" | "visual";
  }
): Promise<{
  conversationId: string;
  messageId: string;
  reply: string;
  tokensUsed: number;
  creditsRemaining: number;
}> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("AI tutor is not configured");
  }

  const plan = resolvePlan(params.publicMetadata);
  const user = await ensureUserProfile(env.DB, params.userId, params.email, plan);

  const estimatedCost = 13;
  const testMode = isMedGeniusTestMode(env.MEDGENIUS_TEST_MODE);
  const check = await checkCredits(env.DB, user, estimatedCost, { aiTokens: 2000, testMode });
  if (!check.ok) {
    throw new Error(check.error);
  }

  let conversationId = params.conversationId;
  if (!conversationId) {
    conversationId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO medgenius_ai_conversations (id, user_id, context_type, context_id, title)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        conversationId,
        params.userId,
        params.contextType ?? "general",
        params.contextId ?? null,
        params.message.slice(0, 80)
      )
      .run();
  }

  const userMessageId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO medgenius_ai_messages (id, conversation_id, role, content)
     VALUES (?, ?, 'user', ?)`
  )
    .bind(userMessageId, conversationId, params.message)
    .run();

  const result = await tutorReply(env.OPENROUTER_API_KEY, {
    userMessage: params.message,
    context: params.documentMarkdown,
    questionText: params.questionText,
    language: params.language,
    mode: params.mode,
  });

  const tokenCost = estimateTokenCreditCost(result.tokensUsed);
  const creditsRemaining = await recordAiTokenUsageAndGetBalance(
    env,
    params.userId,
    result.tokensUsed,
    tokenCost,
    testMode
  );

  const assistantMessageId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO medgenius_ai_messages (id, conversation_id, role, content, tokens_used, model)
     VALUES (?, ?, 'assistant', ?, ?, ?)`
  )
    .bind(assistantMessageId, conversationId, result.content, result.tokensUsed, result.model)
    .run();

  await env.DB.prepare(
    "UPDATE medgenius_ai_conversations SET updated_at = datetime('now') WHERE id = ?"
  )
    .bind(conversationId)
    .run();

  return {
    conversationId,
    messageId: assistantMessageId,
    reply: result.content,
    tokensUsed: result.tokensUsed,
    creditsRemaining,
  };
}

async function recordAiTokenUsageAndGetBalance(
  env: Bindings,
  userId: string,
  tokens: number,
  tokenCost: number,
  testMode: boolean
): Promise<number> {
  await recordAiTokenUsage(env.DB, userId, tokens, tokenCost, { testMode });
  const user = await env.DB.prepare("SELECT * FROM medgenius_users WHERE user_id = ?")
    .bind(userId)
    .first<{ credits_balance: number }>();
  return user?.credits_balance ?? 0;
}

export async function getUserCredits(
  env: Bindings,
  userId: string,
  email: string | null,
  publicMetadata?: Record<string, unknown>
) {
  const plan = resolvePlan(publicMetadata);
  const user = await ensureUserProfile(env.DB, userId, email, plan);
  return getCreditSummary(user);
}
