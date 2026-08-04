/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// LX-E2 — the manual mint route must apply the same capstone deploy gate as the
// webhook: no verified deploy → a specific "deploy required" state (localized on
// the client via a stable code); an unreadable deploy state → fail-closed 503.

const {
  getUser,
  isCourseInMaintenance,
  isPlatformFrozen,
  isRateLimited,
  fetchEnrollment,
  fetchCourse,
  getCourseById,
  issueCredential,
  checkCapstoneCredentialGate,
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  isRateLimited: vi.fn<() => Promise<boolean>>(),
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
  getCourseById: vi.fn(),
  issueCredential: vi.fn(),
  checkCapstoneCredentialGate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => {
  // A valid base58 pubkey so the route's `new PublicKey(wallet_address)` works.
  const chain: {
    eq: () => typeof chain;
    single: () => Promise<{ data: { wallet_address: string } }>;
    maybeSingle: () => Promise<{ data: null }>;
  } = {
    eq: () => chain,
    single: async () => ({
      data: { wallet_address: "11111111111111111111111111111111" },
    }),
    maybeSingle: async () => ({ data: null }),
  };
  return {
    createAdminClient: () => ({ from: () => ({ select: () => chain }) }),
  };
});
vi.mock("@/lib/content/queries", () => ({ getCourseById }));
vi.mock("@/lib/solana/academy-program", () => ({
  issueCredential,
  getConnection: () => ({}),
  describeProgramError: () => "unknown",
}));
vi.mock("@/lib/solana/academy-reads", () => ({ fetchEnrollment, fetchCourse }));
vi.mock("@/lib/solana/pda", () => ({ getProgramId: () => "program-id" }));
vi.mock("@/lib/solana/arweave", () => ({ uploadCertificateMetadata: vi.fn() }));
vi.mock("@/lib/solana/credential-metadata", () => ({
  capCredentialName: (n: string) => n,
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/content/deployments", () => ({ isCourseInMaintenance }));
vi.mock("@/lib/platform/freeze", () => ({ isPlatformFrozen }));
vi.mock("@/lib/platform/freeze-http", () => ({
  platformFrozenResponse: () =>
    new Response(JSON.stringify({ maintenance: true }), { status: 503 }),
}));
vi.mock("@/lib/credentials/capstone-gate", () => ({
  checkCapstoneCredentialGate,
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

const CAPSTONE = "course-building-first-program";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/certificates/mint", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  isRateLimited.mockResolvedValue(false);
  isCourseInMaintenance.mockResolvedValue(false);
  isPlatformFrozen.mockResolvedValue(false);
  // Course finalized on-chain, credential not yet issued — reaches the gate.
  fetchEnrollment.mockResolvedValue({
    completed_at: new Date().toISOString(),
    credential_asset: null,
  });
  // After the gate passes, the route reads the content bundle; return null so
  // it stops at a 404 without needing the full mint mocked — a 404 proves the
  // gate did NOT block.
  getCourseById.mockResolvedValue(null);
});

describe("POST /api/certificates/mint — capstone gate (LX-E2)", () => {
  it("returns 403 with a stable code when the capstone deploy is missing", async () => {
    checkCapstoneCredentialGate.mockResolvedValue({
      status: "deploy_required",
    });

    const res = await POST(req({ courseId: CAPSTONE }));

    expect(res.status).toBe(403);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("capstone_deploy_required");
    expect(issueCredential).not.toHaveBeenCalled();
  });

  it("fails closed with 503 when the deploy state is indeterminate", async () => {
    checkCapstoneCredentialGate.mockResolvedValue({ status: "indeterminate" });

    const res = await POST(req({ courseId: CAPSTONE }));

    expect(res.status).toBe(503);
    expect(issueCredential).not.toHaveBeenCalled();
  });

  it("passes the gate (reaches mint) when the deploy is verified", async () => {
    checkCapstoneCredentialGate.mockResolvedValue({ status: "allowed" });

    const res = await POST(req({ courseId: CAPSTONE }));

    // Gate passed → route proceeded to the content read (404 here), not blocked.
    expect(res.status).toBe(404);
    expect(getCourseById).toHaveBeenCalledWith(CAPSTONE);
  });

  it("does not gate a non-capstone course", async () => {
    checkCapstoneCredentialGate.mockResolvedValue({ status: "not_capstone" });

    const res = await POST(req({ courseId: "course-solana-fundamentals" }));

    expect(res.status).toBe(404);
    expect(getCourseById).toHaveBeenCalledWith("course-solana-fundamentals");
  });
});

// Public-alpha dormancy (2026-08-04): the capstone course and the rest of the
// track-1 ladder are parked out of the compiled bundle. Nothing about that may
// make a credential mintable — the route must refuse on BOTH arms of the gate,
// whichever one a parked id lands on, and must never reach `issueCredential`.
// (`getCourseById` returning null IS "absent from the bundle" — that is what
// the route sees for any parked course.)
describe("POST /api/certificates/mint — parked courses cannot mint", () => {
  it("refuses the parked capstone (gate arm: deploy_required)", async () => {
    // What the real, still-pinned gate returns for the parked capstone: it is a
    // capstone course with no verified deploy row and no way to earn one.
    checkCapstoneCredentialGate.mockResolvedValue({
      status: "deploy_required",
    });

    const res = await POST(req({ courseId: CAPSTONE }));

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(issueCredential).not.toHaveBeenCalled();
  });

  it("refuses a parked non-capstone course (gate arm: not_capstone)", async () => {
    // The rest of the parked ladder is not the capstone, so it sails past the
    // gate — the absent-from-bundle 404 is the only thing stopping it.
    checkCapstoneCredentialGate.mockResolvedValue({ status: "not_capstone" });

    const res = await POST(req({ courseId: "course-rust-for-program-devs" }));

    expect(res.status).toBe(404);
    expect(issueCredential).not.toHaveBeenCalled();
  });
});
