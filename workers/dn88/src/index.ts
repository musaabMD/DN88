import { createClerkClient, verifyToken } from "@clerk/backend";
import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
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
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "DN88",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return c.json({ error: "Missing authorization token" }, 401);
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

    return c.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      imageUrl: user.imageUrl,
    });
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
