const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

export async function apiFetch<TResponse>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<TResponse> {
  const headers = new Headers(options?.headers);
  headers.set("content-type", "application/json");
  if (options?.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as TResponse;
}
