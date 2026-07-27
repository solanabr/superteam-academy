/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  AdminAuthError: class AdminAuthError extends Error {},
  authThrows: false,
  course: { title: "New Course", slug: "new-course" } as {
    title: string;
    slug: string;
  } | null,
  sendResult: {
    status: "sent",
    recipients: 3,
    sent: 3,
    failedBatches: 0,
  },
  sendSpy: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(() => {
    if (h.authThrows) throw new h.AdminAuthError();
  }),
}));
vi.mock("@/lib/content/queries", () => ({
  getCourseById: vi.fn(async () => h.course),
}));
vi.mock("@/lib/email/campaign", () => ({
  sendNewCourseAnnouncement: (...args: unknown[]) => {
    h.sendSpy(...args);
    return Promise.resolve(h.sendResult);
  },
}));
vi.mock("@/lib/i18n/config", () => ({ defaultLocale: "en" }));

const post = async (body: unknown): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(
    new Request("https://app.test/api/admin/email/announce-course", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );
};

beforeEach(() => {
  h.authThrows = false;
  h.course = { title: "New Course", slug: "new-course" };
  h.sendSpy.mockReset();
  process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
});

describe("POST /api/admin/email/announce-course", () => {
  it("401s when not an admin", async () => {
    h.authThrows = true;
    const res = await post({ courseId: "course-x" });
    expect(res.status).toBe(401);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("400s without a courseId", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("404s when the course does not exist", async () => {
    h.course = null;
    const res = await post({ courseId: "nope" });
    expect(res.status).toBe(404);
  });

  it("500s when NEXT_PUBLIC_APP_URL is unset (email needs absolute links)", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const res = await post({ courseId: "course-x" });
    expect(res.status).toBe(500);
    expect(h.sendSpy).not.toHaveBeenCalled();
  });

  it("dispatches the campaign with the resolved course + absolute URLs", async () => {
    const res = await post({ courseId: "course-x" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "sent", sent: 3 });
    expect(h.sendSpy).toHaveBeenCalledWith({
      courseId: "course-x",
      courseTitle: "New Course",
      courseUrl: "https://app.test/en/courses/new-course",
      appUrl: "https://app.test",
    });
  });
});
