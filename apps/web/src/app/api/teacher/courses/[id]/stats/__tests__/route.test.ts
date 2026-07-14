import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from,
  }),
}));

// Issue #478: the course's creator wallet is resolved directly off the
// committed content bundle's `coursesById` (`course.creator`), no separate
// instructor document to deref.
let coursesById = new Map<string, { _id: string; creator?: unknown }>();
vi.mock("@/lib/content/store", () => ({
  get coursesById() {
    return coursesById;
  },
}));

const getCourseStats = vi.fn();
vi.mock("@/lib/teacher/stats", () => ({
  getCourseStats: (...args: unknown[]) => getCourseStats(...args),
}));

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/teacher/courses/course-1/stats");
}

function makeParams(id = "course-1"): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

/** A bundle where `course-1` carries the given creator wallet. */
function bundleWithWallet(wallet: string | null): void {
  coursesById = new Map([
    ["course-1", { _id: "course-1", creator: wallet ?? undefined }],
  ]);
}

beforeEach(() => {
  vi.resetModules();
  getUser.mockReset();
  maybeSingle.mockReset();
  getCourseStats.mockReset();
  from.mockClear();
  select.mockClear();
  eq.mockClear();
  coursesById = new Map();
});

describe("GET /api/teacher/courses/[id]/stats", () => {
  it("returns 401 when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    bundleWithWallet("WALLET_A");

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(401);
    expect(getCourseStats).not.toHaveBeenCalled();
  });

  it("returns 200 with stats when the course's creator wallet matches the session wallet", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { wallet_address: "WALLET_A" },
      error: null,
    });
    bundleWithWallet("WALLET_A");
    const stats = {
      enrolledCount: 3,
      completionCount: 1,
      certificateCount: 1,
    };
    getCourseStats.mockResolvedValue(stats);

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams("course-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(stats);
    expect(getCourseStats).toHaveBeenCalledWith("course-1");

    // Session wallet resolution matches the /teach viewer mechanism exactly.
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("wallet_address");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("returns 403 when the course's creator wallet differs from the session wallet", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { wallet_address: "WALLET_A" },
      error: null,
    });
    bundleWithWallet("WALLET_B");

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(403);
    expect(getCourseStats).not.toHaveBeenCalled();
  });

  it("returns 403 when the course has no creator wallet (no fallback, no admin override)", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { wallet_address: "WALLET_A" },
      error: null,
    });
    bundleWithWallet(null);

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(403);
    expect(getCourseStats).not.toHaveBeenCalled();
  });

  it("returns 403 when the course is absent from the bundle", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { wallet_address: "WALLET_A" },
      error: null,
    });
    // empty bundle — no course to resolve a creator wallet from.

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams("course-missing"));

    expect(res.status).toBe(403);
    expect(getCourseStats).not.toHaveBeenCalled();
  });

  it("returns 403 when the session has no linked wallet", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    bundleWithWallet("WALLET_A");

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(403);
    expect(getCourseStats).not.toHaveBeenCalled();
  });
});
