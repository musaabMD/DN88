const PRODUCTION_API_URL = "https://api.drnote.co";

function productionApiUrlFromHostname(hostname: string): string | null {
  if (hostname === "drnote.co" || hostname === "www.drnote.co") {
    return PRODUCTION_API_URL;
  }
  if (hostname.endsWith(".pages.dev")) {
    return PRODUCTION_API_URL;
  }
  return null;
}

export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_DN88_API_URL ??
    null;

  if (configured && configured !== "http://localhost:8787") {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const fromHost = productionApiUrlFromHostname(window.location.hostname);
    if (fromHost) return fromHost;
  }

  return configured?.replace(/\/$/, "") ?? "http://localhost:8787";
}

export async function fetchCurrentUser(token: string | null) {
  if (!token) return null;

  const response = await fetch(`${getApiBaseUrl()}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  return response.json() as Promise<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string;
    role: string | null;
    plan?: string;
    medgenius?: {
      plan: string;
      creditsBalance: number;
      creditsMonthlyLimit: number;
      documentsCount: number;
      documentsLimit: number;
    } | null;
  }>;
}
