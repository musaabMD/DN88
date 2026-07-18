import { createClerkClient, verifyToken } from "@clerk/backend";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "./types";
import { catalogPublicRoutes } from "./routes/catalog-public";
import { catalogAdminRoutes } from "./routes/catalog-admin";
import { assetRoutes } from "./routes/assets";
import { syncRoutes } from "./routes/sync";
import { medgeniusRoutes } from "./medgenius/routes/index";
import { handleMedGeniusQueue } from "./medgenius/queue/processor";
import { handleClerkWebhook, handleStripeWebhook } from "./routes/webhooks";
import { getMedGeniusProfileForUser } from "./medgenius/services/clerk-sync";
import type { QueueMessage } from "./medgenius/types";

type BillingInterval = "monthly" | "yearly";
type CheckoutPlan = "student" | "pro";

const CHECKOUT_PRICES: Record<
  CheckoutPlan,
  Record<
    BillingInterval,
    {
      productName: string;
      unitAmount: number;
      recurringInterval: "month" | "year";
    }
  >
> = {
  student: {
    monthly: {
      productName: "DrNote Student",
      unitAmount: 2000,
      recurringInterval: "month",
    },
    yearly: {
      productName: "DrNote Student",
      unitAmount: 19200,
      recurringInterval: "year",
    },
  },
  pro: {
    monthly: {
      productName: "DrNote Pro",
      unitAmount: 3000,
      recurringInterval: "month",
    },
    yearly: {
      productName: "DrNote Pro",
      unitAmount: 28800,
      recurringInterval: "year",
    },
  },
};

const app = new Hono<{ Bindings: Bindings }>();

const allowedOrigins = [
  "http://localhost:3000",
  "https://drnote.co",
  "https://www.drnote.co",
  "https://dn88.pages.dev",
];

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0];
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowHeaders: ["Authorization", "Content-Type", "X-Catalog-Sync-Secret"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

async function getAuthedUser(c: {
  req: { header: (name: string) => string | undefined };
  env: Bindings;
}) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { error: "Missing authorization token", status: 401 as const };
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    const clerk = createClerkClient({
      secretKey: c.env.CLERK_SECRET_KEY,
      publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
    });

    const user = await clerk.users.getUser(payload.sub);

    return {
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? null,
      },
    };
  } catch {
    return { error: "Invalid or expired token", status: 401 as const };
  }
}

function resolveOrigin(requestOrigin: string | undefined): string {
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return "https://drnote.co";
}

function resolveCheckoutPriceId(
  env: Bindings,
  plan: CheckoutPlan,
  billing: BillingInterval
): string | undefined {
  if (plan === "pro") {
    return billing === "yearly"
      ? env.STRIPE_PRICE_PRO_YEARLY ?? env.STRIPE_PRICE_YEARLY
      : env.STRIPE_PRICE_PRO_MONTHLY ?? env.STRIPE_PRICE_MONTHLY;
  }

  return billing === "yearly"
    ? env.STRIPE_PRICE_STUDENT_YEARLY ?? env.STRIPE_PRICE_YEARLY
    : env.STRIPE_PRICE_STUDENT_MONTHLY ?? env.STRIPE_PRICE_MONTHLY;
}

function resolveCheckoutLineItem(
  env: Bindings,
  plan: CheckoutPlan,
  billing: BillingInterval
) {
  const priceId = resolveCheckoutPriceId(env, plan, billing);
  if (priceId) return { priceId };

  return { priceData: CHECKOUT_PRICES[plan][billing] };
}

async function createStripeCheckoutSession(
  secretKey: string,
  params: {
    lineItem:
      | { priceId: string; priceData?: never }
      | {
          priceId?: never;
          priceData: {
            productName: string;
            unitAmount: number;
            recurringInterval: "month" | "year";
          };
        };
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string | null;
    customerId?: string | null;
    clientReferenceId: string;
    checkoutPlan: CheckoutPlan;
  }
): Promise<{ url: string }> {
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  if (params.lineItem.priceId) {
    body.set("line_items[0][price]", params.lineItem.priceId);
  } else {
    const { priceData } = params.lineItem;
    body.set("line_items[0][price_data][currency]", "usd");
    body.set("line_items[0][price_data][unit_amount]", String(priceData.unitAmount));
    body.set(
      "line_items[0][price_data][recurring][interval]",
      priceData.recurringInterval
    );
    body.set("line_items[0][price_data][product_data][name]", priceData.productName);
    body.set("line_items[0][price_data][product_data][metadata][app]", "drnote");
    body.set(
      "line_items[0][price_data][product_data][metadata][plan]",
      params.checkoutPlan
    );
  }
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("client_reference_id", params.clientReferenceId);
  body.set("metadata[clerkUserId]", params.clientReferenceId);
  body.set("subscription_data[metadata][clerkUserId]", params.clientReferenceId);
  body.set("subscription_data[metadata][plan]", params.checkoutPlan);
  if (params.customerId) {
    body.set("customer", params.customerId);
  } else if (params.customerEmail) {
    body.set("customer_email", params.customerEmail);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as {
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Stripe checkout failed");
  }

  if (!payload.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { url: payload.url };
}

async function createStripePortalSession(
  secretKey: string,
  params: {
    customerId: string;
    returnUrl: string;
  }
): Promise<{ url: string }> {
  const body = new URLSearchParams();
  body.set("customer", params.customerId);
  body.set("return_url", params.returnUrl);

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as {
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Stripe billing portal failed");
  }

  if (!payload.url) {
    throw new Error("Stripe did not return a billing portal URL");
  }

  return { url: payload.url };
}

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "DN88",
    timestamp: new Date().toISOString(),
  });
});

app.get("/catalog/articles/:file", async (c) => {
  const file = c.req.param("file");
  if (/^(dn88|dl88)-/i.test(file)) {
    return c.json(
      { error: "Not found" },
      404,
      {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      }
    );
  }

  const originUrl = new URL(c.req.url);
  originUrl.hostname = "dn88.pages.dev";

  const response = await fetch(originUrl.toString(), {
    headers: {
      Accept: c.req.header("Accept") ?? "application/json",
    },
  });
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});

app.get("/api/me", async (c) => {
  const auth = await getAuthedUser(c);
  if ("error" in auth) {
    return c.json({ error: auth.error }, auth.status);
  }

  const clerk = createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
    publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
  });

  const user = await clerk.users.getUser(auth.user.id);
  const publicMetadata = user.publicMetadata as Record<string, unknown>;

  let medgenius = null;
  try {
    medgenius = await getMedGeniusProfileForUser(c.env.DB, {
      userId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      publicMetadata,
    });
  } catch {
    medgenius = null;
  }

  return c.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user.imageUrl,
    role: publicMetadata?.role ?? null,
    plan: publicMetadata?.plan ?? medgenius?.plan ?? "free",
    medgenius,
  });
});

app.post("/api/webhooks/clerk", async (c) => handleClerkWebhook(c.req.raw, c.env));
app.post("/api/webhooks/stripe", async (c) => handleStripeWebhook(c.req.raw, c.env));

app.post("/api/stripe/checkout", async (c) => {
  const auth = await getAuthedUser(c);
  if ("error" in auth) {
    return c.json({ error: auth.error }, auth.status);
  }

  const stripeSecret = c.env.STRIPE_SECRET_KEY;

  if (!stripeSecret) {
    return c.json({ error: "Billing is not configured yet." }, 503);
  }

  let billing: BillingInterval;
  let checkoutPlan: CheckoutPlan = "student";
  try {
    const body = await c.req.json<{ billing?: string; plan?: string }>();
    if (body.billing !== "monthly" && body.billing !== "yearly") {
      return c.json({ error: "Invalid billing interval" }, 400);
    }
    billing = body.billing;
    if (body.plan === "pro" || body.plan === "student") {
      checkoutPlan = body.plan;
    }
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const lineItem = resolveCheckoutLineItem(c.env, checkoutPlan, billing);

  const origin = resolveOrigin(c.req.header("Origin"));

  const clerk = createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
    publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
  });
  const clerkUser = await clerk.users.getUser(auth.user.id);
  const publicMetadata = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>;
  const stripeCustomerId =
    typeof publicMetadata.stripeCustomerId === "string"
      ? publicMetadata.stripeCustomerId
      : null;

  try {
    const session = await createStripeCheckoutSession(stripeSecret, {
      lineItem,
      successUrl: `${origin}/upgrade/success/?session_id={CHECKOUT_SESSION_ID}&plan=${checkoutPlan}`,
      cancelUrl: `${origin}/upgrade/`,
      customerEmail: auth.user.email,
      customerId: stripeCustomerId,
      clientReferenceId: auth.user.id,
      checkoutPlan,
    });

    return c.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout session";
    return c.json({ error: message }, 502);
  }
});

app.post("/api/stripe/portal", async (c) => {
  const auth = await getAuthedUser(c);
  if ("error" in auth) {
    return c.json({ error: auth.error }, auth.status);
  }

  const stripeSecret = c.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return c.json({ error: "Billing is not configured yet." }, 503);
  }

  const clerk = createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
    publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
  });
  const clerkUser = await clerk.users.getUser(auth.user.id);
  const publicMetadata = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>;
  let stripeCustomerId =
    typeof publicMetadata.stripeCustomerId === "string"
      ? publicMetadata.stripeCustomerId
      : null;

  if (!stripeCustomerId) {
    const row = await c.env.DB.prepare(
      "SELECT stripe_customer_id FROM medgenius_users WHERE user_id = ?"
    )
      .bind(auth.user.id)
      .first<{ stripe_customer_id: string | null }>();
    stripeCustomerId = row?.stripe_customer_id ?? null;
  }

  if (!stripeCustomerId) {
    return c.json({ error: "No active Stripe subscription found." }, 404);
  }

  const origin = resolveOrigin(c.req.header("Origin"));

  try {
    const session = await createStripePortalSession(stripeSecret, {
      customerId: stripeCustomerId,
      returnUrl: `${origin}/upgrade/`,
    });

    return c.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to open billing portal";
    return c.json({ error: message }, 502);
  }
});

app.route("/api/catalog", catalogPublicRoutes);
app.route("/api/admin", catalogAdminRoutes);
app.route("/api/dl88-assets", assetRoutes);
app.route("/api/admin/sync", syncRoutes);
app.route("/api/medgenius", medgeniusRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

const worker = {
  fetch: app.fetch,
  async queue(batch: MessageBatch<QueueMessage>, env: Bindings) {
    await handleMedGeniusQueue(batch, env);
  },
};

export default worker;
