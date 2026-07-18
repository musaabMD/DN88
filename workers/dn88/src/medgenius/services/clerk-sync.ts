import { createClerkClient } from "@clerk/backend";
import {
  ensureUserProfile,
  getCreditSummary,
} from "./credits";
import { resolvePlan, type PlanTier, PLAN_LIMITS } from "../config/plans";
import type { MedGeniusUserRow } from "../types";

export async function syncClerkUserToMedGenius(
  db: D1Database,
  params: {
    userId: string;
    email: string | null;
    publicMetadata?: Record<string, unknown>;
  }
): Promise<MedGeniusUserRow> {
  const plan = resolvePlan(params.publicMetadata);
  return ensureUserProfile(db, params.userId, params.email, plan);
}

export async function updateMedGeniusPlan(
  db: D1Database,
  userId: string,
  plan: PlanTier
): Promise<void> {
  const limits = PLAN_LIMITS[plan];
  const monthKey = new Date().toISOString().slice(0, 7);

  await db
    .prepare(
      `UPDATE medgenius_users SET
        plan = ?,
        credits_balance = CASE WHEN credits_month_key != ? OR credits_balance < ? THEN ? ELSE credits_balance END,
        credits_month_key = ?,
        updated_at = datetime('now')
      WHERE user_id = ?`
    )
    .bind(
      plan,
      monthKey,
      limits.monthlyCredits,
      limits.monthlyCredits,
      monthKey,
      userId
    )
    .run();
}

export async function setClerkUserPlan(
  clerkSecretKey: string,
  clerkPublishableKey: string,
  userId: string,
  plan: PlanTier,
  stripeCustomerId?: string
): Promise<void> {
  const clerk = createClerkClient({
    secretKey: clerkSecretKey,
    publishableKey: clerkPublishableKey,
  });

  const user = await clerk.users.getUser(userId);
  const existing = (user.publicMetadata ?? {}) as Record<string, unknown>;

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...existing,
      plan,
      subscription: plan === "free" || plan === "starter" ? null : plan,
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
    },
  });
}

export async function getMedGeniusProfileForUser(
  db: D1Database,
  params: {
    userId: string;
    email: string | null;
    publicMetadata?: Record<string, unknown>;
  }
) {
  const user = await syncClerkUserToMedGenius(db, params);
  return getCreditSummary(user);
}

export function resolvePlanFromStripePrice(
  priceId: string,
  env: {
    STRIPE_PRICE_MONTHLY?: string;
    STRIPE_PRICE_YEARLY?: string;
    STRIPE_PRICE_STUDENT_MONTHLY?: string;
    STRIPE_PRICE_STUDENT_YEARLY?: string;
    STRIPE_PRICE_PRO_MONTHLY?: string;
    STRIPE_PRICE_PRO_YEARLY?: string;
  }
): PlanTier {
  if (
    priceId === env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === env.STRIPE_PRICE_PRO_YEARLY
  ) {
    return "pro";
  }
  if (
    priceId === env.STRIPE_PRICE_STUDENT_MONTHLY ||
    priceId === env.STRIPE_PRICE_STUDENT_YEARLY ||
    priceId === env.STRIPE_PRICE_MONTHLY ||
    priceId === env.STRIPE_PRICE_YEARLY
  ) {
    return "student";
  }
  return "student";
}

export async function getUserIdByStripeCustomerId(
  db: D1Database,
  stripeCustomerId: string
): Promise<string | null> {
  const row = await db
    .prepare("SELECT user_id FROM medgenius_users WHERE stripe_customer_id = ?")
    .bind(stripeCustomerId)
    .first<{ user_id: string }>();

  return row?.user_id ?? null;
}

export async function updateStripeCustomerId(
  db: D1Database,
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE medgenius_users
       SET stripe_customer_id = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    )
    .bind(stripeCustomerId, userId)
    .run();
}
