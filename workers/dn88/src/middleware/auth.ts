import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Bindings } from "../types";

export async function getAuthedUser(c: {
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
        publicMetadata: user.publicMetadata as Record<string, unknown>,
      },
    };
  } catch {
    return { error: "Invalid or expired token", status: 401 as const };
  }
}

export async function requireAdmin(c: {
  req: { header: (name: string) => string | undefined };
  env: Bindings;
}) {
  const auth = await getAuthedUser(c);
  if ("error" in auth) return auth;

  const role = auth.user.publicMetadata?.role;
  if (role === "admin") return auth;

  const bootstrap = c.env.ADMIN_BOOTSTRAP_IDS?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (bootstrap?.includes(auth.user.id)) return auth;

  return { error: "Admin access required", status: 403 as const };
}
