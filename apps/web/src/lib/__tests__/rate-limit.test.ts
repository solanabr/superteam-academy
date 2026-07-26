import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { getClientIp, isRateLimited, releaseRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const h = (headers: Record<string, string>) => new Headers(headers);

// Wire createAdminClient().rpc("check_rate_limit", …) to a canned result: an
// object resolves to { data, error }; an Error instance makes rpc throw.
function stubRpc(result: { data?: unknown; error?: unknown } | Error) {
  vi.mocked(createAdminClient).mockReturnValue({
    rpc: vi.fn(async () => {
      if (result instanceof Error) throw result;
      return { data: result.data ?? null, error: result.error ?? null };
    }),
  } as unknown as ReturnType<typeof createAdminClient>);
}

describe("getClientIp — header trust order", () => {
  it("prefers x-vercel-forwarded-for, which the client cannot forge", () => {
    expect(
      getClientIp(
        h({
          "x-vercel-forwarded-for": "203.0.113.1",
          "x-real-ip": "203.0.113.2",
          "x-forwarded-for": "203.0.113.3",
        })
      )
    ).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip before x-forwarded-for", () => {
    expect(
      getClientIp(
        h({ "x-real-ip": "203.0.113.2", "x-forwarded-for": "203.0.113.3" })
      )
    ).toBe("203.0.113.2");
  });

  it("uses x-forwarded-for only as a last resort", () => {
    expect(getClientIp(h({ "x-forwarded-for": "203.0.113.3" }))).toBe(
      "203.0.113.3"
    );
  });

  it("takes the first x-forwarded-for entry (Vercel's edge replaces, not appends)", () => {
    expect(
      getClientIp(h({ "x-forwarded-for": "203.0.113.3, 70.41.3.18" }))
    ).toBe("203.0.113.3");
  });

  it("buckets header-less callers together rather than exempting them", () => {
    expect(getClientIp(h({}))).toBe("unknown");
  });
});

// The reason this matters: a single VPS is routinely handed a routed /64, i.e.
// 2^64 source addresses. Keying the limiter on the full IPv6 address would give
// one actor an unbounded supply of fresh buckets — the per-IP limit would be
// decorative. These pin the collapse.
describe("getClientIp — IPv6 collapses to a /64 bucket", () => {
  it("maps every address in one /64 to the SAME key", () => {
    const key = (ip: string) => getClientIp(h({ "x-real-ip": ip }));

    const a = key("2001:db8:abcd:1234::1");
    const b = key("2001:db8:abcd:1234::dead:beef");
    const c = key("2001:db8:abcd:1234:ffff:ffff:ffff:ffff");

    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).toBe("2001:db8:abcd:1234::/64");
  });

  it("keeps DIFFERENT /64s in different buckets", () => {
    const key = (ip: string) => getClientIp(h({ "x-real-ip": ip }));
    expect(key("2001:db8:abcd:1234::1")).not.toBe(key("2001:db8:abcd:9999::1"));
  });

  it("expands a compressed :: run positionally, not textually", () => {
    // "2001:db8::1" is 2001:0db8:0000:0000:...:0001 — the /64 is 2001:db8:0:0,
    // NOT "2001:db8:1" as a naive split(':').slice(0,4) would produce.
    expect(getClientIp(h({ "x-real-ip": "2001:db8::1" }))).toBe(
      "2001:db8:0:0::/64"
    );
    expect(getClientIp(h({ "x-real-ip": "::1" }))).toBe("0:0:0:0::/64");
  });

  it("keys on the ADDRESS, not on how it was spelled", () => {
    // Same /64, three spellings: compressed, fully expanded, and zero-padded.
    // Lowercasing a hextet without canonicalising it would emit "0db8" and
    // "db8" as different keys — re-opening, via zero-padding alone, the very
    // multi-bucket bypass the /64 collapse exists to close.
    const key = (ip: string) => getClientIp(h({ "x-real-ip": ip }));

    const compressed = key("2001:db8:85a3::8a2e:370:7334");
    const expanded = key("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    const padded = key("2001:0db8:85a3:0::1");

    expect(expanded).toBe(compressed);
    expect(padded).toBe(compressed);
    expect(compressed).toBe("2001:db8:85a3:0::/64");
  });

  it("uppercase hex is the same bucket as lowercase", () => {
    const key = (ip: string) => getClientIp(h({ "x-real-ip": ip }));
    expect(key("2001:DB8:ABCD:1234::1")).toBe(key("2001:db8:abcd:1234::1"));
  });

  it("unwraps an IPv4-mapped IPv6 address to the real IPv4", () => {
    expect(getClientIp(h({ "x-real-ip": "::ffff:203.0.113.7" }))).toBe(
      "203.0.113.7"
    );
  });

  it("strips brackets and a %zone suffix", () => {
    expect(getClientIp(h({ "x-real-ip": "[2001:db8:abcd:1234::1]" }))).toBe(
      "2001:db8:abcd:1234::/64"
    );
    expect(getClientIp(h({ "x-real-ip": "fe80::1%eth0" }))).toBe(
      "fe80:0:0:0::/64"
    );
  });

  it("leaves IPv4 at full precision (no equivalent slack to collapse)", () => {
    expect(getClientIp(h({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(getClientIp(h({ "x-real-ip": "203.0.113.8" }))).not.toBe(
      "203.0.113.7"
    );
  });
});

// The default is fail-OPEN (a store blip must not hard-block traffic on a
// non-auth throttle); cost-critical callers opt into fail-CLOSED. #590 turns the
// AI route fail-closed so a limiter outage can't hand out unmetered generations
// on the platform-funded Gemini key.
describe("isRateLimited — fail-open default, fail-closed opt-in", () => {
  const OPTS = { maxTokens: 20, refillIntervalMs: 60_000 };

  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset();
  });

  it("returns the store verdict when the store is healthy (limited)", async () => {
    stubRpc({ data: true });
    expect(await isRateLimited("ns", "key", OPTS)).toBe(true);
  });

  it("returns the store verdict when the store is healthy (allowed)", async () => {
    stubRpc({ data: false });
    expect(await isRateLimited("ns", "key", OPTS)).toBe(false);
  });

  it("fails OPEN by default when the RPC returns an error", async () => {
    stubRpc({ error: { message: "store down" } });
    expect(await isRateLimited("ns", "key", OPTS)).toBe(false);
  });

  it("fails OPEN by default when the RPC throws", async () => {
    stubRpc(new Error("connection refused"));
    expect(await isRateLimited("ns", "key", OPTS)).toBe(false);
  });

  it("fails CLOSED (denies) on an RPC error when failClosed is set", async () => {
    stubRpc({ error: { message: "store down" } });
    expect(
      await isRateLimited("ai:partner", "key", { ...OPTS, failClosed: true })
    ).toBe(true);
  });

  it("fails CLOSED (denies) on an RPC throw when failClosed is set", async () => {
    stubRpc(new Error("connection refused"));
    expect(
      await isRateLimited("ai:partner", "key", { ...OPTS, failClosed: true })
    ).toBe(true);
  });

  it("a flagged and an unflagged caller diverge on the SAME store error", async () => {
    stubRpc({ error: { message: "store down" } });
    // Same failure, opposite verdicts — the flag is the only difference, so one
    // route hardening cannot silently change another caller's semantics.
    expect(await isRateLimited("other", "key", OPTS)).toBe(false);
    expect(
      await isRateLimited("ai:partner", "key", { ...OPTS, failClosed: true })
    ).toBe(true);
  });
});

// Release hands a lock-style key (maxTokens: 1) back early so the next request
// starts clean instead of waiting out the window — the correctness half of the
// #693 grading-dedup guard. It deletes the row directly (check_rate_limit only
// counts up) and must fail SOFT: a store blip can never surface to the caller,
// since a leaked lock self-heals when its window expires.
describe("releaseRateLimit — early lock hand-back, fail-soft", () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset();
  });

  /** Capture the `.eq("key", …)` filter and return a canned delete outcome. */
  function stubDelete(outcome: { error?: unknown } | Error) {
    const eq = vi.fn(async () => {
      if (outcome instanceof Error) throw outcome;
      return { error: outcome.error ?? null };
    });
    const from = vi.fn(() => ({ delete: () => ({ eq }) }));
    vi.mocked(createAdminClient).mockReturnValue({
      from,
    } as unknown as ReturnType<typeof createAdminClient>);
    return { from, eq };
  }

  it("deletes the rate_limits row keyed EXACTLY `${namespace}:${key}`", async () => {
    const { from, eq } = stubDelete({});
    await releaseRateLimit(
      "lessons:complete:grading-dedup",
      "user-1:lesson-1:ab"
    );
    expect(from).toHaveBeenCalledWith("rate_limits");
    expect(eq).toHaveBeenCalledWith(
      "key",
      "lessons:complete:grading-dedup:user-1:lesson-1:ab"
    );
  });

  it("fails SOFT when the delete returns an error (never throws)", async () => {
    stubDelete({ error: { message: "delete failed" } });
    await expect(releaseRateLimit("ns", "key")).resolves.toBeUndefined();
  });

  it("fails SOFT when the admin client throws (never throws)", async () => {
    stubDelete(new Error("connection refused"));
    await expect(releaseRateLimit("ns", "key")).resolves.toBeUndefined();
  });
});
