/**
 * Shared constants for the `admin_session` cookie.
 *
 * The session signature is produced and verified in TWO places that run in
 * DIFFERENT runtimes and therefore use DIFFERENT crypto implementations:
 *   - `lib/admin/auth.ts`  — Node runtime (API routes), Node `crypto` HMAC
 *   - `middleware.ts`      — Edge runtime, Web Crypto (`crypto.subtle`) HMAC
 *
 * Those two implementations MUST stay in sync. The cookie value format and the
 * max-age are defined here so the two paths cannot drift on those values.
 *
 * Cookie value format: `"<timestamp>.<signature>"`
 *   - timestamp = `Date.now()` as a base-10 string (ms since epoch)
 *   - signature = lowercase-hex HMAC-SHA256 of the timestamp string, keyed by ADMIN_SECRET
 *
 * This module intentionally has NO imports so it can be loaded from both the
 * Edge and Node runtimes.
 */

/** Max lifetime of an `admin_session` cookie before it is rejected as expired. */
export const ADMIN_SESSION_MAX_AGE_MS = 86400 * 1000; // 24h
