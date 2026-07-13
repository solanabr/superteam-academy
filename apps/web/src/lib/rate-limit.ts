import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Cross-instance rate limiter backed by Supabase (P1-7).
//
// Fixed-window counter: all tokens reset at the start of each
// `refillIntervalMs` window. State lives in the `rate_limits` table via the
// atomic `check_rate_limit` SECURITY DEFINER function, so limits hold across
// all serverless instances (unlike the previous in-memory Map).
//
// Fails OPEN: if the store is unreachable we allow the request rather than
// hard-blocking traffic on a transient DB issue (the limiter is abuse/cost
// mitigation, not an auth gate). Failures are logged.

interface RateLimiterOptions {
  maxTokens: number;
  refillIntervalMs: number;
}

/**
 * Collapse an address to the block one actor plausibly controls, so the rate
 * key bounds an ACTOR and not an address.
 *
 * IPv6 is the whole point. A single VPS is routinely handed a routed /64 —
 * 2^64 source addresses — so keying on the full address gives one attacker an
 * unbounded supply of fresh buckets and the per-IP limit degrades to no limit
 * at all. Truncating to the /64 makes the bucket the thing that costs money to
 * acquire. IPv4 has no equivalent slack, so it keys on the full address.
 */
function normalizeIp(raw: string): string {
  // Strip the [..] form and any %zone suffix.
  const addr = (raw.replace(/^\[|\]$/g, "").split("%")[0] ?? raw).trim();
  if (!addr.includes(":")) return addr; // IPv4 → full address.

  // IPv4-mapped IPv6 (::ffff:203.0.113.7): the real client is the IPv4.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(addr);
  if (mapped) return mapped[1]!;

  // Expand the "::" run so the first four hextets are positional, then keep them.
  let hextets: string[];
  if (addr.includes("::")) {
    const [head = "", tail = ""] = addr.split("::");
    const headParts = head ? head.split(":") : [];
    const tailParts = tail ? tail.split(":") : [];
    const zeros = Math.max(0, 8 - headParts.length - tailParts.length);
    hextets = [...headParts, ...Array(zeros).fill("0"), ...tailParts];
  } else {
    hextets = addr.split(":");
  }

  // Canonicalise each hextet, don't just lowercase it. "0db8" and "db8" are the
  // same 16 bits, so emitting them verbatim would key the SAME /64 into two
  // different buckets depending only on how the address was spelled — handing
  // back, through zero-padding, exactly the multi-bucket bypass this collapse
  // exists to close. Parsing to a number and re-emitting makes the key a
  // function of the address rather than of its formatting.
  const prefix = hextets
    .slice(0, 4)
    .map((h) => {
      const value = parseInt(h || "0", 16);
      return Number.isNaN(value) ? "0" : value.toString(16);
    })
    .join(":");
  return `${prefix}::/64`;
}

/**
 * Client IP, for limiters that must bound an actor rather than an account — a
 * per-user key alone cannot bound Sybils, since every fresh account is a fresh
 * key.
 *
 * Header order is a trust order, not a preference. `x-vercel-forwarded-for` is
 * set by Vercel's edge and cannot be overwritten by the client. Plain
 * `x-forwarded-for` IS overwritten by Vercel today (their edge replaces it
 * rather than appending, precisely to stop spoofing) — but that guarantee is
 * void if a proxy is ever placed in front of Vercel, at which point the FIRST
 * comma-separated entry becomes the attacker-supplied one. So it is the last
 * resort, not the first choice.
 *
 * Falls back to "unknown", which buckets all header-less callers together —
 * deliberately degrading to one shared global limit rather than to no limit.
 */
export function getClientIp(headers: Headers): string {
  const raw =
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return raw ? normalizeIp(raw) : "unknown";
}

export async function isRateLimited(
  namespace: string,
  key: string,
  opts: RateLimiterOptions
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: `${namespace}:${key}`,
      p_max_tokens: opts.maxTokens,
      p_window_seconds: Math.max(1, Math.ceil(opts.refillIntervalMs / 1000)),
    });

    if (error) {
      console.warn(
        `[rate-limit] check_rate_limit failed for ${namespace}, allowing:`,
        error.message
      );
      return false;
    }

    return data === true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[rate-limit] limiter unavailable for ${namespace}, allowing:`,
      message
    );
    return false;
  }
}
