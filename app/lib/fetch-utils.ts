type FetchJsonResult<T> = { data: T; error: null } | { data: null; error: Error };

export async function fetchJson<T>(
	url: string,
	options?: RequestInit
): Promise<FetchJsonResult<T>> {
	try {
		const res = await fetch(url, options);
		if (!res.ok) {
			const body = (await res.json().catch(() => ({}))) as { error?: string };
			return { data: null, error: new Error(body.error ?? `HTTP ${res.status}`) };
		}
		const data = (await res.json()) as T;
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
	}
}

export function postJson<T>(url: string, body: unknown): Promise<FetchJsonResult<T>> {
	return fetchJson<T>(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

export function patchJson<T>(url: string, body: unknown): Promise<FetchJsonResult<T>> {
	return fetchJson<T>(url, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}
