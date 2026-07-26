/* eslint-disable import/order -- vi.mock must hoist above the imports it stubs */
import { describe, it, expect, vi, beforeEach } from "vitest";

// The route's own logic is just the status mapping: 200 when the schema is
// complete, 503 when an object is missing. The probing itself is covered by
// schema-expectations.test.ts.
const { checkSchemaExpectations } = vi.hoisted(() => ({
  checkSchemaExpectations: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/supabase/schema-expectations", () => ({
  checkSchemaExpectations,
}));

import { GET } from "../route";

describe("GET /api/health/schema (#731)", () => {
  beforeEach(() => checkSchemaExpectations.mockReset());

  it("returns 200 when every expected object exists", async () => {
    checkSchemaExpectations.mockResolvedValue({
      ok: true,
      checked: 3,
      missing: [],
    });
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });
  });

  it("returns 503 and names the missing object when the merge→apply gap is open", async () => {
    checkSchemaExpectations.mockResolvedValue({
      ok: false,
      checked: 3,
      missing: [
        {
          object: "column user_xp.streak_freezes",
          migration: "20260726190000_streak_forgiveness.sql",
          description: "streak-freeze inventory",
          detail: "column does not exist",
        },
      ],
    });
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.missing[0].migration).toBe(
      "20260726190000_streak_forgiveness.sql"
    );
  });
});
