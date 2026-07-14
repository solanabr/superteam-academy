/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { maybeSingle, logError } = vi.hoisted(() => ({
  maybeSingle: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  logError: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle,
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/logging", () => ({ logError }));

import { isAccountDeleted, DELETED_ACCOUNT_REASON } from "../account-status";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isAccountDeleted (#461 — refuse login for deleted accounts)", () => {
  it("is false for a normal (never-deleted) profile", async () => {
    maybeSingle.mockResolvedValue({ data: { deleted_at: null }, error: null });
    await expect(isAccountDeleted("user-1")).resolves.toBe(false);
  });

  it("is true for a tombstoned profile", async () => {
    maybeSingle.mockResolvedValue({
      data: { deleted_at: "2026-07-10T00:00:00.000Z" },
      error: null,
    });
    await expect(isAccountDeleted("user-2")).resolves.toBe(true);
  });

  it("fails OPEN (false) and logs when the row is missing", async () => {
    // maybeSingle() returns { data: null, error: null } for zero rows — must
    // not be treated as deleted.
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(isAccountDeleted("user-3")).resolves.toBe(false);
    expect(logError).not.toHaveBeenCalled();
  });

  it("fails OPEN (false) and logs when the query errors", async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    await expect(isAccountDeleted("user-4")).resolves.toBe(false);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("fails OPEN (false) and logs when the client throws", async () => {
    maybeSingle.mockRejectedValue(new Error("network down"));
    await expect(isAccountDeleted("user-5")).resolves.toBe(false);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("exposes a stable reason string for the redirect query param", () => {
    expect(DELETED_ACCOUNT_REASON).toBe("account_deleted");
  });
});
