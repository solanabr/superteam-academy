"use client";

/**
 * Client-side probe for the user menu's Admin entry. Asks `/api/admin/me`
 * whether the CURRENT session is on the `admin_users` allowlist. Purely
 * cosmetic — the server gate on every /admin page and /api/admin route is the
 * security boundary; nothing may branch on this for anything but display.
 *
 * Memoized per page load: the menu mounts on every page for signed-in users,
 * and the answer cannot change within a session, so one fetch is enough. A
 * failed fetch resolves `false` and clears the memo so a later mount retries.
 */
let cached: Promise<boolean> | null = null;

export function fetchIsAdmin(): Promise<boolean> {
  cached ??= fetch("/api/admin/me")
    .then(async (res) => {
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { admin?: unknown };
      return data.admin === true;
    })
    .catch(() => {
      cached = null;
      return false;
    });
  return cached;
}
