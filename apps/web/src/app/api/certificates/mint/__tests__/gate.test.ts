/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const {
  getUser,
  isCourseInMaintenance,
  isPlatformFrozen,
  isRateLimited,
  fetchEnrollment,
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  isRateLimited: vi.fn<() => Promise<boolean>>(),
  fetchEnrollment: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => {
  // A self-referencing chain: real call sites chain a variable number of
  // `.eq()`s before a terminal `.single()`/`.maybeSingle()` — this mock only
  // needs to get the request far enough to observe the maintenance gate.
  const chain: {
    eq: () => typeof chain;
    single: () => Promise<{ data: { wallet_address: string } }>;
    maybeSingle: () => Promise<{ data: null }>;
  } = {
    eq: () => chain,
    single: async () => ({ data: { wallet_address: "wallet-1" } }),
    maybeSingle: async () => ({ data: null }),
  };
  return {
    createAdminClient: () => ({ from: () => ({ select: () => chain }) }),
  };
});
vi.mock("@/lib/content/queries", () => ({ getCourseById: vi.fn() }));
vi.mock("@/lib/solana/academy-program", () => ({
  issueCredential: vi.fn(),
  getConnection: () => ({}),
  describeProgramError: () => "unknown",
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchEnrollment,
  fetchCourse: vi.fn(),
}));
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
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

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
  fetchEnrollment.mockResolvedValue(null);
});

describe("POST /api/certificates/mint — global freeze gate (reset wave B2)", () => {
  it("503 { maintenance: true } before rate-limit / on-chain reads when frozen", async () => {
    isPlatformFrozen.mockResolvedValue(true);

    const res = await POST(req({ courseId: "course-1" }));

    expect(res.status).toBe(503);
    const body = (await res.json()) as { maintenance?: boolean };
    expect(body.maintenance).toBe(true);
    // Frozen short-circuits before any paid/rate-limited work.
    expect(isRateLimited).not.toHaveBeenCalled();
    expect(fetchEnrollment).not.toHaveBeenCalled();
  });

  it("proceeds past the freeze gate when not frozen", async () => {
    isPlatformFrozen.mockResolvedValue(false);

    await POST(req({ courseId: "course-1" }));

    expect(isPlatformFrozen).toHaveBeenCalled();
    expect(isRateLimited).toHaveBeenCalled();
  });
});

describe("POST /api/certificates/mint — maintenance gate (WS-2 #453 rail 3)", () => {
  it("503s and never reaches the rate limiter or on-chain reads when gated", async () => {
    isCourseInMaintenance.mockResolvedValue(true);

    const res = await POST(req({ courseId: "course-1" }));

    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/maintenance/i);
    expect(isRateLimited).not.toHaveBeenCalled();
    expect(fetchEnrollment).not.toHaveBeenCalled();
  });

  it("proceeds past the gate when the course is not under maintenance", async () => {
    isCourseInMaintenance.mockResolvedValue(false);

    await POST(req({ courseId: "course-1" }));

    expect(isCourseInMaintenance).toHaveBeenCalledWith("course-1");
    expect(isRateLimited).toHaveBeenCalled();
  });
});
