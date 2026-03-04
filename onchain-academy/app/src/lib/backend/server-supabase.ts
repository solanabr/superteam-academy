const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

type QueryArgs = {
  table: string;
  select?: string;
  filters?: Record<string, string>;
  order?: string;
  limit?: number;
};

function buildUrl(args: QueryArgs) {
  const url = new URL(`/rest/v1/${args.table}`, supabaseUrl);
  if (args.select) url.searchParams.set("select", args.select);
  if (args.order) url.searchParams.set("order", args.order);
  if (typeof args.limit === "number") url.searchParams.set("limit", String(args.limit));
  if (args.filters) {
    Object.entries(args.filters).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

async function request<T>(input: RequestInfo, init: RequestInit): Promise<T | null> {
  if (!hasSupabaseConfig()) return null;
  const response = await fetch(input, {
    ...init,
    headers: {
      apikey: serviceRoleKey as string,
      Authorization: `Bearer ${serviceRoleKey as string}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  if (response.status === 204) return null;
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export const supabaseRest = {
  hasConfig: hasSupabaseConfig,
  async select<T>(args: QueryArgs) {
    const url = buildUrl(args);
    return request<T[]>(url, { method: "GET" });
  },
  async upsert<T>(table: string, payload: Record<string, unknown>, onConflict: string) {
    const url = buildUrl({ table, filters: { on_conflict: onConflict } });
    return request<T[]>(url, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    });
  },
  async insert<T>(table: string, payload: Record<string, unknown>) {
    const url = buildUrl({ table });
    return request<T[]>(url, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
  },
};
