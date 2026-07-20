import { Hono } from "hono";
import type { Bindings } from "../types";
import { extractRagPage, mergeRagDocumentResult } from "./extract-page";

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
    return c.json({
      ok: true,
      triggerConfigured: Boolean(c.env.TRIGGER_SECRET_KEY),
      openRouterConfigured: Boolean(c.env.OPENROUTER_API_KEY),
      extractionMode: c.env.OPENROUTER_API_KEY
        ? c.env.TRIGGER_SECRET_KEY
          ? "worker_or_trigger"
          : "worker"
        : c.env.TRIGGER_SECRET_KEY
          ? "trigger"
          : "none",
      projectRef: "proj_urgydtjlxezekgtpcxst",
    });
  });

  app.post("/extract-page", async (c) => {
    const apiKey = c.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return c.json({ error: "OPENROUTER_API_KEY not configured on Worker" }, 503);
    }

    const body = (await c.req.json()) as {
      documentId?: string;
      pageNumber?: number;
      pageText?: string | null;
      pageImageUrl?: string | null;
      nearbyPageHints?: Array<{ pageNumber: number; textPreview: string }>;
    };

    if (!body.documentId || !body.pageNumber) {
      return c.json({ error: "documentId and pageNumber are required" }, 400);
    }

    try {
      const result = await extractRagPage(apiKey, {
        documentId: body.documentId,
        pageNumber: body.pageNumber,
        pageText: body.pageText,
        pageImageUrl: body.pageImageUrl,
        nearbyPageHints: body.nearbyPageHints,
      });
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Extraction failed";
      return c.json({ error: message }, 502);
    }
  });

  app.post("/extract-document", async (c) => {
    const apiKey = c.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return c.json({ error: "OPENROUTER_API_KEY not configured on Worker" }, 503);
    }

    const body = (await c.req.json()) as {
      documentId?: string;
      pages?: Array<{
        pageNumber: number;
        pageText?: string | null;
        pageImageUrl?: string | null;
      }>;
    };

    if (!body.documentId || !body.pages?.length) {
      return c.json({ error: "documentId and pages are required" }, 400);
    }

    try {
      const sorted = [...body.pages].sort((a, b) => a.pageNumber - b.pageNumber);
      const pageResults = [];

      for (const page of sorted) {
        const nearby = sorted
          .filter(
            (p) =>
              p.pageNumber !== page.pageNumber &&
              Math.abs(p.pageNumber - page.pageNumber) <= 1,
          )
          .map((p) => ({
            pageNumber: p.pageNumber,
            textPreview: (p.pageText ?? "").slice(0, 500),
          }));

        const result = await extractRagPage(apiKey, {
          documentId: body.documentId,
          pageNumber: page.pageNumber,
          pageText: page.pageText,
          pageImageUrl: page.pageImageUrl,
          nearbyPageHints: nearby,
        });
        pageResults.push(result);
      }

      return c.json(
        mergeRagDocumentResult(body.documentId, sorted.length, pageResults),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Extraction failed";
      return c.json({ error: message }, 502);
    }
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
