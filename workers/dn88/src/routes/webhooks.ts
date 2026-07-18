import { verifyWebhook } from "@clerk/backend/webhooks";
import type { Bindings } from "../types";
import type { PlanTier } from "../medgenius/config/plans";
import {
  setClerkUserPlan,
  syncClerkUserToMedGenius,
  updateMedGeniusPlan,
  resolvePlanFromStripePrice,
} from "../medgenius/services/clerk-sync";
import {
  parseStripeEvent,
  verifyStripeSignature,
} from "../medgenius/services/stripe-webhook";

export async function handleClerkWebhook(
  request: Request,
  env: Bindings
): Promise<Response> {
  if (!env.CLERK_WEBHOOK_SECRET) {
    return Response.json({ error: "Clerk webhook not configured" }, { status: 503 });
  }

  try {
    const event = await verifyWebhook(request, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const data = event.data as {
          id: string;
          email_addresses?: Array<{ email_address: string }>;
          public_metadata?: Record<string, unknown>;
        };

        const primaryEmail = data.email_addresses?.[0]?.email_address ?? null;

        await syncClerkUserToMedGenius(env.DB, {
          userId: data.id,
          email: primaryEmail,
          publicMetadata: data.public_metadata,
        });
        break;
      }
      case "user.deleted": {
        const data = event.data as { id: string };
        await updateMedGeniusPlan(env.DB, data.id, "free");
        break;
      }
      default:
        break;
    }

    return Response.json({ ok: true, type: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function handleStripeWebhook(
  request: Request,
  env: Bindings
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await request.text();
  const valid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = parseStripeEvent(body);
  const object = event.data.object;

  async function applyPlan(userId: string, plan: PlanTier) {
    const customerId =
      typeof object.customer === "string" ? object.customer : undefined;
    await setClerkUserPlan(
      env.CLERK_SECRET_KEY,
      env.CLERK_PUBLISHABLE_KEY,
      userId,
      plan,
      customerId
    );
    await syncClerkUserToMedGenius(env.DB, {
      userId,
      email: null,
      publicMetadata: { plan },
    });
  }

  if (event.type === "checkout.session.completed") {
    const userId =
      typeof object.client_reference_id === "string"
        ? object.client_reference_id
        : null;

    if (userId) {
      const sessionId = typeof object.id === "string" ? object.id : null;
      let priceId: string | undefined;

      if (sessionId) {
        const lineItemsResponse = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items?limit=1`,
          { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
        );
        if (lineItemsResponse.ok) {
          const lineItems = (await lineItemsResponse.json()) as {
            data?: Array<{ price?: { id?: string } }>;
          };
          priceId = lineItems.data?.[0]?.price?.id;
        }
      }

      const plan = priceId
        ? resolvePlanFromStripePrice(priceId, env)
        : "student";
      await applyPlan(userId, plan);
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const metadata = object.metadata as { clerkUserId?: string } | undefined;
    const userId = metadata?.clerkUserId;
    const status = object.status;

    if (userId) {
      if (event.type === "customer.subscription.deleted" || status === "canceled") {
        await applyPlan(userId, "free");
      } else if (status === "active") {
        const priceId = (
          object.items as { data?: Array<{ price?: { id?: string } }> } | undefined
        )?.data?.[0]?.price?.id;
        const plan = priceId ? resolvePlanFromStripePrice(priceId, env) : "student";
        await applyPlan(userId, plan);
      }
    }
  }

  return Response.json({ ok: true, type: event.type });
}
