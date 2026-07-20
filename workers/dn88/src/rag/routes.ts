import { Hono } from "hono";
import type { Bindings } from "../types";

type AuthedEnv = {
  Bindings: Bindings;
  Variables: { userId: string };
};

const TRIGGER_API = "https://api.trigger.dev/api/v1";

async function triggerTask(
  secretKey: string,
  taskId: string,
  payload: unknown,
): Promise<{ id: string; publicAccessToken?: string }> {
  const response = await fetch(`${TRIGGER_API}/tasks/${taskId}/trigger`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });

  const data = (await response.json()) as {
    id?: string;
    publicAccessToken?: string;
    error?: string;
    message?: string;
  };

  if (!response.ok || !data.id) {
    throw new Error(data.error ?? data.message ?? `Failed to trigger ${taskId}`);
  }

  return { id: data.id, publicAccessToken: data.publicAccessToken };
}

async function fetchRun(secretKey: string, runId: string): Promise<unknown> {
  const response = await fetch(`${TRIGGER_API}/runs/${runId}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const data = (await response.json()) as {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to fetch run");
  }

  return data;
}

export function createRagRoutes(getAuthedUserId: (c: {
  req: { header: (name: string) => string | undefined };
  env: Bindings;
}) => Promise<string | null>) {
  const app = new Hono<AuthedEnv>();

  app.use("*", async (c, next) => {
    const userId = await getAuthedUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("userId", userId);
    await next();
  });

  app.get("/health", (c) => {
    const configured = Boolean(c.env.TRIGGER_SECRET_KEY);
    return c.json({
      ok: true,
      triggerConfigured: configured,
      projectRef: "proj_urgydtjlxezekgtpcxst",
    });
  });

  app.post("/tasks/:taskId/trigger", async (c) => {
    const secret = c.env.TRIGGER_SECRET_KEY;
    if (!secret) {
      return c.json({ error: "TRIGGER_SECRET_KEY not configured on Worker" }, 503);
    }

    const taskId = c.req.param("taskId");
    const allowed = new Set([
      "hello-world",
      "extract-page",
      "process-document",
      "generate-question",
    ]);
    if (!allowed.has(taskId)) {
      return c.json({ error: `Task not allowed: ${taskId}` }, 400);
    }

    const body = (await c.req.json().catch(() => ({}))) as { payload?: unknown };
    try {
      const handle = await triggerTask(secret, taskId, body.payload ?? {});
      return c.json({
        runId: handle.id,
        publicAccessToken: handle.publicAccessToken ?? null,
        taskId,
        userId: c.get("userId"),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Trigger failed";
      return c.json({ error: message }, 502);
    }
  });

  app.get("/runs/:runId", async (c) => {
    const secret = c.env.TRIGGER_SECRET_KEY;
    if (!secret) {
      return c.json({ error: "TRIGGER_SECRET_KEY not configured on Worker" }, 503);
    }

    try {
      const run = await fetchRun(secret, c.req.param("runId"));
      return c.json({ run });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fetch run failed";
      return c.json({ error: message }, 502);
    }
  });

  return app;
}
