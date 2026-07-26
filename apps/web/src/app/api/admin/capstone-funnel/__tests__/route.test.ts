/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { requireAdminAuth, getCapstoneFunnel, logEvent } = vi.hoisted(() => ({
  requireAdminAuth: vi.fn(),
  getCapstoneFunnel: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  adminUnauthorizedResponse: () => new Response("{}", { status: 401 }),
  requireAdminAuth,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({}) as never,
}));
vi.mock("@/lib/credentials/capstone-funnel", () => ({ getCapstoneFunnel }));
vi.mock("@/lib/logging", () => ({ logEvent }));

import { GET } from "../route";
import { AdminAuthError } from "@/lib/admin/auth";

function reqFor(): NextRequest {
  return new Request(
    "https://x/api/admin/capstone-funnel"
  ) as unknown as NextRequest;
}

const healthyFunnel = {
  courseId: "course-building-first-program",
  deployLessonId: "lesson-bfsp-m4-capstone",
  completions: 5,
  deploys: 3,
  deferrals: 0,
  certificates: 3,
  verdict: "healthy" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminAuth.mockReturnValue(undefined);
  getCapstoneFunnel.mockResolvedValue(healthyFunnel);
});

describe("GET /api/admin/capstone-funnel", () => {
  it("401s when admin auth fails, without reading the funnel", async () => {
    requireAdminAuth.mockImplementation(() => {
      throw new AdminAuthError();
    });

    const res = await GET(reqFor());

    expect(res.status).toBe(401);
    expect(getCapstoneFunnel).not.toHaveBeenCalled();
  });

  it("returns the funnel counters for an authed admin", async () => {
    const res = await GET(reqFor());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(healthyFunnel);
  });

  it("does not raise an alert log when the funnel is healthy", async () => {
    await GET(reqFor());
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("emits a loud error log when the funnel signals a broken write path", async () => {
    getCapstoneFunnel.mockResolvedValue({
      ...healthyFunnel,
      completions: 4,
      deploys: 0,
      deferrals: 2,
      certificates: 0,
      verdict: "write_path_suspect",
    });

    const res = await GET(reqFor());

    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "capstone-funnel.write_path_suspect",
        level: "error",
        context: expect.objectContaining({
          completions: 4,
          deploys: 0,
          deferrals: 2,
        }),
      })
    );
  });
});
