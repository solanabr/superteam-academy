/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  AdminAuthError: class AdminAuthError extends Error {},
  state: { authThrows: false },
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  deactivateCoursePda: vi.fn(),
  writeCourseActive: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(() => {
    if (h.state.authThrows) throw new h.AdminAuthError();
  }),
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: () => h.isPlatformFrozen(),
}));
vi.mock("@/lib/solana/admin-signer", () => ({
  deactivateCoursePda: (...args: unknown[]) => h.deactivateCoursePda(...args),
}));
vi.mock("@/lib/content/deployment-writes", () => ({
  writeCourseActive: (...args: unknown[]) => h.writeCourseActive(...args),
}));
vi.mock("@/lib/content/queries", () => ({ COURSES_CACHE_TAG: "courses" }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const post = async (body: unknown): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(
    new Request("https://app.test/api/admin/courses/deactivate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );
};

beforeEach(() => {
  h.state.authThrows = false;
  h.isPlatformFrozen.mockReset();
  h.isPlatformFrozen.mockResolvedValue(false);
  h.deactivateCoursePda.mockReset();
  h.deactivateCoursePda.mockResolvedValue({ success: true, signature: "sig" });
  h.writeCourseActive.mockReset();
  h.writeCourseActive.mockResolvedValue(undefined);
});

describe("POST /api/admin/courses/deactivate — global freeze gate (reset wave B2)", () => {
  it("503 { maintenance: true } when frozen, and never touches the chain", async () => {
    h.isPlatformFrozen.mockResolvedValue(true);

    const res = await post({ courseId: "course-1" });

    expect(res.status).toBe(503);
    const body = (await res.json()) as { maintenance?: boolean };
    expect(body.maintenance).toBe(true);
    expect(h.deactivateCoursePda).not.toHaveBeenCalled();
  });

  it("401s (before the freeze check) without an admin session", async () => {
    h.state.authThrows = true;
    h.isPlatformFrozen.mockResolvedValue(true);

    const res = await post({ courseId: "course-1" });

    expect(res.status).toBe(401);
    expect(h.isPlatformFrozen).not.toHaveBeenCalled();
    expect(h.deactivateCoursePda).not.toHaveBeenCalled();
  });

  it("proceeds to the on-chain deactivate when not frozen", async () => {
    h.isPlatformFrozen.mockResolvedValue(false);

    const res = await post({ courseId: "course-1" });

    expect(res.status).toBe(200);
    expect(h.deactivateCoursePda).toHaveBeenCalledWith("course-1");
  });
});
