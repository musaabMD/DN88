export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_DN88_API_URL ?? "http://localhost:8787";
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
