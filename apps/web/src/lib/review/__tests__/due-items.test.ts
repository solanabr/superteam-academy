import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getDueReviewItems, REVIEW_SESSION_CAP } from "../due-items";

/**
 * A fake query builder that records the terminal `.limit()` and `.lte()`/`.eq()`
 * args and resolves like PostgREST. Every chain method returns `this` until the
 * awaited `.limit()` resolves the recorded result.
 */
function fakeClient(rows: unknown[] = []) {
  const calls: Record<string, unknown> = {};
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((col: string, v: unknown) => {
      calls[`eq:${col}`] = v;
      return builder;
    }),
    lte: vi.fn((col: string, v: unknown) => {
      calls[`lte:${col}`] = v;
      return builder;
    }),
    order: vi.fn(() => builder),
    limit: vi.fn((n: number) => {
      calls.limit = n;
      return Promise.resolve({ data: rows, error: null });
    }),
  };
  const client = {
    from: vi.fn(() => builder),
  } as unknown as SupabaseClient<Database>;
  return { client, builder, calls };
}

beforeEach(() => vi.clearAllMocks());

describe("getDueReviewItems cap primitive (LX-B4)", () => {
  it("caps at REVIEW_SESSION_CAP when no limit is given", async () => {
    const { client, calls } = fakeClient();
    await getDueReviewItems(client, "user-1");
    expect(calls.limit).toBe(REVIEW_SESSION_CAP);
  });

  it("CLAMPS a caller that requests more than the cap — cannot ship uncapped", async () => {
    const { client, calls } = fakeClient();
    await getDueReviewItems(client, "user-1", { limit: 100 });
    expect(calls.limit).toBe(REVIEW_SESSION_CAP);
  });

  it("honors a smaller limit (e.g. a 3-item dashboard strip)", async () => {
    const { client, calls } = fakeClient();
    await getDueReviewItems(client, "user-1", { limit: 3 });
    expect(calls.limit).toBe(3);
  });

  it("returns the empty set for a non-positive limit (no negative .limit)", async () => {
    const { client, builder } = fakeClient([{ item_key: "x" }]);
    const out = await getDueReviewItems(client, "user-1", { limit: 0 });
    expect(out).toEqual([]);
    expect(builder.limit).not.toHaveBeenCalled();
  });

  it("scopes to the user and to DUE items (due_at <= now)", async () => {
    const { client, calls } = fakeClient();
    const now = new Date("2026-07-26T12:00:00.000Z");
    await getDueReviewItems(client, "user-9", { now });
    expect(calls["eq:user_id"]).toBe("user-9");
    expect(calls["lte:due_at"]).toBe(now.toISOString());
  });

  it("passes rows through", async () => {
    const rows = [{ item_key: "lesson-1", box: 1, due_at: "d", lapses: 0 }];
    const { client } = fakeClient(rows);
    expect(await getDueReviewItems(client, "user-1")).toEqual(rows);
  });

  it("throws on a query error (own-row read must surface failures)", async () => {
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            lte: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({ data: null, error: { message: "rls" } }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;
    await expect(getDueReviewItems(client, "user-1")).rejects.toThrow("rls");
  });
});
