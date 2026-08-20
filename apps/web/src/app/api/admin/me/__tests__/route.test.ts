/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: h.requireAdmin,
}));

const get = async (): Promise<Response> => {
  const { GET } = await import("../route");
  return GET();
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/me — cosmetic admin probe", () => {
  it("reports admin: true for an allowlisted session", async () => {
    h.requireAdmin.mockResolvedValue({ userId: "user-1" });

    const res = await get();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ admin: true });
  });

  it("reports admin: false for a non-admin session", async () => {
    h.requireAdmin.mockResolvedValue(null);

    const res = await get();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ admin: false });
  });

  it("never 500s: an unexpected throw still yields admin: false", async () => {
    h.requireAdmin.mockRejectedValue(new Error("boom"));

    const res = await get();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ admin: false });
  });

  it("returns nothing beyond the boolean (no user id leak)", async () => {
    h.requireAdmin.mockResolvedValue({ userId: "user-1" });

    const body = (await (await get()).json()) as Record<string, unknown>;

    expect(Object.keys(body)).toEqual(["admin"]);
  });
});
