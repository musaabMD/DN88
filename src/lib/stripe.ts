export type BillingInterval = "monthly" | "yearly";
export type CheckoutPlan = "student" | "pro";

export type CheckoutSessionResponse = {
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

export async function createStripeCheckoutSession(
  token: string,
  billing: BillingInterval,
  plan: CheckoutPlan = "student"
): Promise<string> {
  const { getApiBaseUrl } = await import("@/lib/api");
  const response = await fetch(`${getApiBaseUrl()}/api/stripe/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ billing, plan }),
  });

  const payload = (await response.json().catch(() => null)) as
    | CheckoutSessionResponse
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
    throw new StripeCheckoutError("Invalid checkout response");
  }

  return payload.url;
}
