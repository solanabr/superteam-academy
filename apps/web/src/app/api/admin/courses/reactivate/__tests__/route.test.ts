/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  updateCoursePda: vi.fn(),
  writeCourseActive: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class AdminAuthError extends Error {},
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(),
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: async () => false,
}));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: () => h.isCourseInMaintenance(),
}));
vi.mock("@/lib/solana/admin-signer", () => ({
  updateCoursePda: (...args: unknown[]) => h.updateCoursePda(...args),
}));
vi.mock("@/lib/content/deployment-writes", () => ({
  writeCourseActive: (...args: unknown[]) => h.writeCourseActive(...args),
}));
vi.mock("@/lib/content/changelog-writes", () => ({
  recordCourseReactivated: vi.fn(),
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchCourse: async () => null,
}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SOLANA_RPC_URL: "https://api.devnet.solana.com" },
}));
vi.mock("@/lib/content/queries", () => ({ COURSES_CACHE_TAG: "courses" }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const post = async (body: unknown): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(
    new Request("https://app.test/api/admin/courses/reactivate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  h.isCourseInMaintenance.mockReset();
  h.isCourseInMaintenance.mockResolvedValue(false);
  h.updateCoursePda.mockReset();
  h.updateCoursePda.mockResolvedValue({ success: true, signature: "sig" });
  h.writeCourseActive.mockReset();
  h.writeCourseActive.mockResolvedValue(undefined);
});

describe("POST /api/admin/courses/reactivate — maintenance gate", () => {
  it("503s while the course is in maintenance, and never touches the chain", async () => {
    h.isCourseInMaintenance.mockResolvedValue(true);

    const res = await post({ courseId: "course-1" });

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("60");
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/maintenance/i);
    expect(h.updateCoursePda).not.toHaveBeenCalled();
  });

  it("re-activates on-chain when the course is not in maintenance", async () => {
    const res = await post({ courseId: "course-1" });

    expect(res.status).toBe(200);
    expect(h.updateCoursePda).toHaveBeenCalledWith({
      courseId: "course-1",
      newIsActive: true,
    });
  });
});
