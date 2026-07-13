import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { getClientIp } from "@/lib/rate-limit";

const h = (headers: Record<string, string>) => new Headers(headers);

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
