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

const sanityFetch = vi.fn();
vi.mock("@/lib/sanity/client", () => ({
  sanityFetch: (...args: unknown[]) => sanityFetch(...args),
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

beforeEach(() => {
  vi.resetModules();
  getUser.mockReset();
  maybeSingle.mockReset();
  sanityFetch.mockReset();
  getCourseStats.mockReset();
});

describe("GET /api/teacher/courses/[id]/stats", () => {
  it("returns 401 when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(401);
    expect(sanityFetch).not.toHaveBeenCalled();
    expect(getCourseStats).not.toHaveBeenCalled();
  });

  it("returns 200 with stats when the course's instructor wallet matches the session wallet", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { wallet_address: "WALLET_A" },
      error: null,
    });
    sanityFetch.mockResolvedValue({ wallet: "WALLET_A" });
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

    // Session wallet resolution matches the Task-6 viewer mechanism exactly.
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("wallet_address");
    expect(eq).toHaveBeenCalledWith("id", "user-1");

    const [query, params, revalidate] = sanityFetch.mock.calls[0] as [
      string,
      unknown,
      number,
    ];
    expect(query.replace(/\s+/g, " ")).toContain(
      '*[_type=="course" && _id==$id][0]{"wallet": instructor->wallet}'
    );
    expect(params).toEqual({ id: "course-1" });
    expect(revalidate).toBe(0);
  });

  it("returns 403 when the course's instructor wallet differs from the session wallet", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { wallet_address: "WALLET_A" },
      error: null,
    });
    sanityFetch.mockResolvedValue({ wallet: "WALLET_B" });

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(403);
    expect(getCourseStats).not.toHaveBeenCalled();
  });

  it("returns 403 when the course has no instructor wallet (no fallback, no admin override)", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { wallet_address: "WALLET_A" },
      error: null,
    });
    sanityFetch.mockResolvedValue({ wallet: null });

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(403);
    expect(getCourseStats).not.toHaveBeenCalled();
  });

  it("returns 403 when the session has no linked wallet", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    sanityFetch.mockResolvedValue({ wallet: "WALLET_A" });

    const { GET } = await import("../route");
    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(403);
    expect(getCourseStats).not.toHaveBeenCalled();
  });
});
