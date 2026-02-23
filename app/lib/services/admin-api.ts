function resolveUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/api/admin${path}` : `/api/admin${path}`;
}

export interface AdminLoginParams {
  password: string;
}

export interface AdminLoginResponse {
  token?: string;
  error?: string;
}

export interface GenerateApiKeyParams {
  role: "admin" | "client";
  label?: string;
}

export interface GenerateApiKeyResponse {
  apiKey?: string;
  role?: string;
  label?: string;
  error?: string;
}

export async function adminLogin(
  params: AdminLoginParams
): Promise<AdminLoginResponse> {
  const url = resolveUrl("/login");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const raw = await res.json().catch(() => ({}));
  const data = raw.ok ? raw.data : raw;
  if (!res.ok) {
    return { error: data.error ?? res.statusText };
  }
  return { token: data.token };
}

export async function generateApiKey(
  jwt: string,
  params: GenerateApiKeyParams
): Promise<GenerateApiKeyResponse> {
  const url = resolveUrl("/generate-api-key");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(params),
  });
  const raw = await res.json().catch(() => ({}));
  const data = raw.ok ? raw.data : raw;
  if (!res.ok) {
    return { error: data.error ?? res.statusText };
  }
  return {
    apiKey: data.apiKey,
    role: data.role,
    label: data.label,
  };
}
