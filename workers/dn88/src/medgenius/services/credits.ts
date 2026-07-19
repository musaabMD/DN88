import {
  CREDIT_COSTS,
  currentDayKey,
  currentMonthKey,
  PLAN_LIMITS,
  type CreditOperation,
  type PlanTier,
} from "../config/plans";
import type { CreditCheckResult, MedGeniusUserRow } from "../types";

export class CreditError extends Error {
  code: "INSUFFICIENT_CREDITS" | "LIMIT_EXCEEDED" | "RATE_LIMITED";

  constructor(
    code: "INSUFFICIENT_CREDITS" | "LIMIT_EXCEEDED" | "RATE_LIMITED",
    message: string
  ) {
    super(message);
    this.code = code;
    this.name = "CreditError";
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

export function computeCreditCost(
  operation: CreditOperation,
  quantity = 1
): number {
  return CREDIT_COSTS[operation] * quantity;
}

export async function ensureUserProfile(
  db: D1Database,
  userId: string,
  email: string | null,
  plan: PlanTier
): Promise<MedGeniusUserRow> {
  const monthKey = currentMonthKey();
  const dayKey = currentDayKey();
  const limits = PLAN_LIMITS[plan];

  const existing = await db
    .prepare("SELECT * FROM medgenius_users WHERE user_id = ?")
    .bind(userId)
    .first<MedGeniusUserRow>();

  if (existing) {
    let creditsBalance = existing.credits_balance;
    let creditsUsedMonth = existing.credits_used_month;
    let creditsMonthKey = existing.credits_month_key;
    let dailyTokens = existing.daily_ai_tokens;
    let dailyTokensKey = existing.daily_tokens_key;
    let resolvedPlan = existing.plan;

    if (existing.plan !== plan) {
      resolvedPlan = plan;
    }

    if (existing.credits_month_key !== monthKey) {
      creditsBalance = limits.monthlyCredits;
      creditsUsedMonth = 0;
      creditsMonthKey = monthKey;
    } else if (creditsBalance + creditsUsedMonth < limits.monthlyCredits) {
      creditsBalance = Math.max(0, limits.monthlyCredits - creditsUsedMonth);
    }

    if (existing.daily_tokens_key !== dayKey) {
      dailyTokens = 0;
      dailyTokensKey = dayKey;
    }

    if (
      existing.plan !== resolvedPlan ||
      existing.credits_month_key !== creditsMonthKey ||
      existing.daily_tokens_key !== dailyTokensKey ||
      existing.email !== email
    ) {
      await db
        .prepare(
          `UPDATE medgenius_users SET
            email = ?, plan = ?, credits_balance = ?, credits_used_month = ?,
            credits_month_key = ?, daily_ai_tokens = ?, daily_tokens_key = ?,
            updated_at = datetime('now')
          WHERE user_id = ?`
        )
        .bind(
          email,
          resolvedPlan,
          creditsBalance,
          creditsUsedMonth,
          creditsMonthKey,
          dailyTokens,
          dailyTokensKey,
          userId
        )
        .run();
    }

    return {
      ...existing,
      email,
      plan: resolvedPlan,
      credits_balance: creditsBalance,
      credits_used_month: creditsUsedMonth,
      credits_month_key: creditsMonthKey,
      daily_ai_tokens: dailyTokens,
      daily_tokens_key: dailyTokensKey,
    };
  }

  await db
    .prepare(
      `INSERT INTO medgenius_users (
        user_id, email, plan, credits_balance, credits_used_month,
        credits_month_key, daily_ai_tokens, daily_tokens_key
      ) VALUES (?, ?, ?, ?, 0, ?, 0, ?)`
    )
    .bind(userId, email, plan, limits.monthlyCredits, monthKey, dayKey)
    .run();

  const created = await db
    .prepare("SELECT * FROM medgenius_users WHERE user_id = ?")
    .bind(userId)
    .first<MedGeniusUserRow>();

  if (!created) throw new Error("Failed to create user profile");
  return created;
}

export async function checkCredits(
  db: D1Database,
  user: MedGeniusUserRow,
  cost: number,
  options?: { aiTokens?: number }
): Promise<CreditCheckResult> {
  const limits = PLAN_LIMITS[user.plan];
  const dayKey = currentDayKey();

  let dailyTokens = user.daily_ai_tokens;
  if (user.daily_tokens_key !== dayKey) {
    dailyTokens = 0;
  }

  const projectedTokens = dailyTokens + (options?.aiTokens ?? 0);
  if (projectedTokens > limits.dailyAiTokens) {
    return {
      ok: false,
      error: `Daily AI token limit reached (${limits.dailyAiTokens}). Resets tomorrow.`,
      code: "RATE_LIMITED",
    };
  }

  if (user.credits_balance < cost) {
    return {
      ok: false,
      error: `Insufficient credits. Need ${cost}, have ${user.credits_balance}. Upgrade your plan for more.`,
      code: "INSUFFICIENT_CREDITS",
    };
  }

  return { ok: true, reserved: cost };
}

export async function spendCredits(
  db: D1Database,
  userId: string,
  cost: number,
  operation: string,
  reference?: { type?: string; id?: string; metadata?: Record<string, unknown> }
): Promise<number> {
  const user = await db
    .prepare("SELECT * FROM medgenius_users WHERE user_id = ?")
    .bind(userId)
    .first<MedGeniusUserRow>();

  if (!user) throw new CreditError("INSUFFICIENT_CREDITS", "User profile not found");

  const check = await checkCredits(db, user, cost);
  if (!check.ok) {
    throw new CreditError(check.code, check.error);
  }

  const newBalance = user.credits_balance - cost;
  const newUsed = user.credits_used_month + cost;

  await db
    .prepare(
      `UPDATE medgenius_users SET
        credits_balance = ?, credits_used_month = ?, updated_at = datetime('now')
      WHERE user_id = ?`
    )
    .bind(newBalance, newUsed, userId)
    .run();

  await db
    .prepare(
      `INSERT INTO medgenius_credit_ledger
        (id, user_id, amount, balance_after, operation, reference_type, reference_id, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      generateId(),
      userId,
      -cost,
      newBalance,
      operation,
      reference?.type ?? null,
      reference?.id ?? null,
      reference?.metadata ? JSON.stringify(reference.metadata) : null
    )
    .run();

  return newBalance;
}

export async function recordAiTokenUsage(
  db: D1Database,
  userId: string,
  tokens: number,
  tokenCost: number
): Promise<void> {
  const dayKey = currentDayKey();
  const user = await db
    .prepare("SELECT * FROM medgenius_users WHERE user_id = ?")
    .bind(userId)
    .first<MedGeniusUserRow>();

  if (!user) return;

  const dailyTokens =
    user.daily_tokens_key === dayKey ? user.daily_ai_tokens + tokens : tokens;

  await spendCredits(db, userId, tokenCost, "ai_chat", {
    type: "ai",
    metadata: { tokens },
  });

  await db
    .prepare(
      `UPDATE medgenius_users SET
        daily_ai_tokens = ?, daily_tokens_key = ?, updated_at = datetime('now')
      WHERE user_id = ?`
    )
    .bind(dailyTokens, dayKey, userId)
    .run();
}

export async function checkDocumentLimits(
  db: D1Database,
  user: MedGeniusUserRow,
  pageCount: number
): Promise<CreditCheckResult> {
  const limits = PLAN_LIMITS[user.plan];

  if (user.documents_count >= limits.maxDocuments) {
    return {
      ok: false,
      error: `Document limit reached (${limits.maxDocuments} on ${user.plan} plan).`,
      code: "LIMIT_EXCEEDED",
    };
  }

  if (user.pages_processed + pageCount > limits.maxPages) {
    return {
      ok: false,
      error: `Page limit would be exceeded (${limits.maxPages} on ${user.plan} plan).`,
      code: "LIMIT_EXCEEDED",
    };
  }

  const parseCost = computeCreditCost("pageParse", pageCount);
  return checkCredits(db, user, parseCost);
}

export async function incrementDocumentUsage(
  db: D1Database,
  userId: string,
  pageCount: number
): Promise<void> {
  await db
    .prepare(
      `UPDATE medgenius_users SET
        documents_count = documents_count + 1,
        pages_processed = pages_processed + ?,
        updated_at = datetime('now')
      WHERE user_id = ?`
    )
    .bind(pageCount, userId)
    .run();
}

export function getCreditSummary(user: MedGeniusUserRow) {
  const limits = PLAN_LIMITS[user.plan];
  return {
    plan: user.plan,
    creditsBalance: user.credits_balance,
    creditsUsedMonth: user.credits_used_month,
    creditsMonthlyLimit: limits.monthlyCredits,
    documentsCount: user.documents_count,
    documentsLimit: limits.maxDocuments,
    pagesProcessed: user.pages_processed,
    pagesLimit: limits.maxPages,
    dailyAiTokens: user.daily_ai_tokens,
    dailyAiTokensLimit: limits.dailyAiTokens,
  };
}
