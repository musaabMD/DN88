export function getApiBaseUrl(): string {
  const legacyApiUrlKey = ["NEXT_PUBLIC", "DN", "88", "API_URL"].join("_");
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env[legacyApiUrlKey] ??
    "http://localhost:8787"
  );
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
  }>;
}
