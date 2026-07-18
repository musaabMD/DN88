export type BillingInterval = "monthly" | "yearly";
export type CheckoutPlan = "student" | "pro";

export type CheckoutSessionResponse = {
  url: string;
};

export type PortalSessionResponse = {
  url: string;
};

export class StripeCheckoutError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "StripeCheckoutError";
    this.status = status;
  }
}

async function postStripeApi<T extends { url: string }>(
  token: string,
  path: string,
  body?: Record<string, string>
): Promise<string> {
  const { getApiBaseUrl } = await import("@/lib/api");
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new StripeCheckoutError(
      payload && "error" in payload && payload.error
        ? payload.error
        : "Unable to start checkout",
      response.status
    );
  }

  if (!payload || !("url" in payload) || !payload.url) {
    throw new StripeCheckoutError("Invalid Stripe response");
  }

  return payload.url;
}

export async function createStripeCheckoutSession(
  token: string,
  billing: BillingInterval,
  plan: CheckoutPlan = "student"
): Promise<string> {
  return postStripeApi<CheckoutSessionResponse>(token, "/api/stripe/checkout", {
    billing,
    plan,
  });
}

export async function createStripePortalSession(token: string): Promise<string> {
  return postStripeApi<PortalSessionResponse>(token, "/api/stripe/portal");
}
