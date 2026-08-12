/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  isRateLimited: vi.fn(),
  isPlatformFrozen: vi.fn(),
  isCourseInMaintenance: vi.fn(),
  getCourseById: vi.fn(),
  isEnabled: vi.fn(),
  derive: vi.fn(),
  sendEnroll: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) =>
      table === "profiles"
        ? {
            select: () => ({
              eq: () => ({ single: h.single, maybeSingle: h.single }),
            }),
            update: (values: unknown) => {
              h.update(values);
              return {
                eq: () => ({ is: async () => ({ error: null }) }),
              };
            },
          }
        : { upsert: h.upsert },
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: h.isRateLimited,
  getClientIp: () => "1.2.3.4",
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: h.isPlatformFrozen,
}));
vi.mock("@/lib/platform/freeze-http", () => ({
  platformFrozenResponse: () =>
    new Response(JSON.stringify({ error: "frozen" }), { status: 503 }),
}));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: h.isCourseInMaintenance,
}));
vi.mock("@/lib/content/queries", () => ({
  getCourseById: h.getCourseById,
}));
vi.mock("@/lib/solana/custodial-wallet", () => ({
  isCustodialWalletEnabled: h.isEnabled,
  deriveCustodialKeypair: h.derive,
}));
vi.mock("@/lib/solana/custodial-enroll", () => ({
  sendCustodialEnroll: h.sendEnroll,
}));
vi.mock("@/lib/solana/academy-program", () => ({
  describeProgramError: (e: unknown) => String(e),
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

const CUSTODIAL = "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ";
const OTHER_WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/enroll/custodial", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.isEnabled.mockReturnValue(true);
  h.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  // Fresh walletless account by default; second read (post-bind recheck)
  // returns the claimed custodial address.
  h.single
    .mockResolvedValueOnce({ data: { wallet_address: null, prefs: {} } })
    .mockResolvedValue({ data: { wallet_address: CUSTODIAL } });
  h.upsert.mockResolvedValue({ error: null });
  h.isRateLimited.mockResolvedValue(false);
  h.isPlatformFrozen.mockResolvedValue(false);
  h.isCourseInMaintenance.mockResolvedValue(false);
  h.getCourseById.mockReturnValue({ _id: "course-x" });
  h.derive.mockReturnValue({ publicKey: { toBase58: () => CUSTODIAL } });
  h.sendEnroll.mockResolvedValue({
    signature: "custodial-sig",
    alreadyEnrolled: false,
  });
});

describe("POST /api/enroll/custodial", () => {
  it("503s with a stable key when the feature is off", async () => {
    h.isEnabled.mockReturnValue(false);
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "custodialDisabled" });
    expect(h.sendEnroll).not.toHaveBeenCalled();
  });

  it("rejects an anonymous caller", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(401);
    expect(h.sendEnroll).not.toHaveBeenCalled();
  });

  it("refuses an unknown course before deriving or spending anything", async () => {
    h.getCourseById.mockReturnValue(undefined);
    const res = await POST(post({ courseId: "nope" }));
    expect(res.status).toBe(404);
    expect(h.sendEnroll).not.toHaveBeenCalled();
  });

  it("409s when the account already linked a different (real) wallet", async () => {
    h.single.mockReset();
    h.single.mockResolvedValue({
      data: { wallet_address: OTHER_WALLET, prefs: {} },
    });
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "walletLinked" });
    // Their history belongs to that wallet — never enrol a custodial shadow.
    expect(h.sendEnroll).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });

  it("binds the derived wallet, enrolls on-chain, and mirrors the DB row", async () => {
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(true);
    expect(body.wallet).toBe(CUSTODIAL);
    expect(body.signature).toBe("custodial-sig");

    // wallet_address + provenance stamped in one write.
    expect(h.update).toHaveBeenCalledWith(
      expect.objectContaining({
        wallet_address: CUSTODIAL,
        prefs: expect.objectContaining({ walletProvider: "custodial" }),
      })
    );
    expect(h.sendEnroll).toHaveBeenCalledTimes(1);
    expect(h.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        course_id: "course-x",
        wallet_address: CUSTODIAL,
        tx_signature: "custodial-sig",
      }),
      expect.objectContaining({ onConflict: "user_id,course_id" })
    );
  });

  it("proceeds without re-binding for a returning custodial account", async () => {
    h.single.mockReset();
    h.single.mockResolvedValue({
      data: {
        wallet_address: CUSTODIAL,
        prefs: { walletProvider: "custodial" },
      },
    });
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(200);
    expect(h.update).not.toHaveBeenCalled();
    expect(h.sendEnroll).toHaveBeenCalledTimes(1);
  });

  it("treats an existing on-chain enrolment as success (idempotent)", async () => {
    h.sendEnroll.mockResolvedValue({ signature: null, alreadyEnrolled: true });
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.alreadyEnrolled).toBe(true);
  });

  it("rate-limits per user", async () => {
    h.isRateLimited.mockResolvedValueOnce(true);
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(429);
    expect(h.sendEnroll).not.toHaveBeenCalled();
  });

  it("409s when a concurrent link claims the wallet slot first", async () => {
    h.single.mockReset();
    h.single
      // First read: still walletless…
      .mockResolvedValueOnce({ data: { wallet_address: null, prefs: {} } })
      // …but the post-bind recheck sees another wallet won the race.
      .mockResolvedValue({ data: { wallet_address: OTHER_WALLET } });
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(409);
    expect(h.sendEnroll).not.toHaveBeenCalled();
  });
});
