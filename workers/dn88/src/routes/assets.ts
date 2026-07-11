import { Hono } from "hono";
import type { Bindings } from "../types";

type Env = { Bindings: Bindings };

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
]);

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export const assetRoutes = new Hono<Env>();

assetRoutes.get("/:commitSha/*", async (c) => {
  const commitSha = c.req.param("commitSha");
  const path = c.req.path.replace(`/api/dl88-assets/${commitSha}/`, "");

  if (!path || path.includes("..") || path.startsWith("/")) {
    return c.json({ error: "Invalid path" }, 400);
  }

  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return c.json({ error: "Extension not allowed" }, 403);
  }

  const key = `catalog/snapshots/${commitSha}/assets/${path}`;
  const object = await c.env.SNAPSHOTS.get(key);
  if (!object) return c.json({ error: "Not found" }, 404);

  let body = await object.arrayBuffer();
  if (ext === ".svg") {
    const text = new TextDecoder().decode(body);
    const sanitized = sanitizeSvg(text);
    body = new TextEncoder().encode(sanitized).buffer;
  }

  return new Response(body, {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(['"])[^'"]*\1/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/xlink:href\s*=\s*(['"])https?:[^'"]*\1/gi, "");
}
