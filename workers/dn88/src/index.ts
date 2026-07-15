import { createClerkClient, verifyToken } from "@clerk/backend";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "./types";
import { catalogPublicRoutes } from "./routes/catalog-public";
import { catalogAdminRoutes } from "./routes/catalog-admin";
import { assetRoutes } from "./routes/assets";
import { syncRoutes } from "./routes/sync";

type BillingInterval = "monthly" | "yearly";

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
    allowMethods: ["GET", "POST", "OPTIONS"],
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

async function createStripeCheckoutSession(
  secretKey: string,
  params: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string | null;
    clientReferenceId: string;
  }
): Promise<{ url: string }> {
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", params.priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("client_reference_id", params.clientReferenceId);
  if (params.customerEmail) {
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

  return c.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user.imageUrl,
    role: user.publicMetadata?.role ?? null,
  });
});

app.post("/api/stripe/checkout", async (c) => {
  const auth = await getAuthedUser(c);
  if ("error" in auth) {
    return c.json({ error: auth.error }, auth.status);
  }

  const stripeSecret = c.env.STRIPE_SECRET_KEY;
  const monthlyPrice = c.env.STRIPE_PRICE_MONTHLY;
  const yearlyPrice = c.env.STRIPE_PRICE_YEARLY;

  if (!stripeSecret || !monthlyPrice || !yearlyPrice) {
    return c.json(
      { error: "Stripe is not configured yet. Add billing keys to DN88." },
      503
    );
  }

  let billing: BillingInterval;
  try {
    const body = await c.req.json<{ billing?: string }>();
    if (body.billing !== "monthly" && body.billing !== "yearly") {
      return c.json({ error: "Invalid billing interval" }, 400);
    }
    billing = body.billing;
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const origin = resolveOrigin(c.req.header("Origin"));
  const priceId = billing === "yearly" ? yearlyPrice : monthlyPrice;

  try {
    const session = await createStripeCheckoutSession(stripeSecret, {
      priceId,
      successUrl: `${origin}/upgrade/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/upgrade/`,
      customerEmail: auth.user.email,
      clientReferenceId: auth.user.id,
    });

    return c.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout session";
    return c.json({ error: message }, 502);
  }
});

app.route("/api/catalog", catalogPublicRoutes);
app.route("/api/admin", catalogAdminRoutes);
app.route("/api/dl88-assets", assetRoutes);
app.route("/api/admin/sync", syncRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
