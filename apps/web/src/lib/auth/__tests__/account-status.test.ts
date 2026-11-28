/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { maybeSingle, logError, adminAvailable } = vi.hoisted(() => ({
  maybeSingle: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  logError: vi.fn(),
  adminAvailable: { value: true },
}));

vi.mock("@/lib/supabase/admin", async () => {
  const { AdminClientUnavailableError } =
    await import("@/lib/supabase/admin-unavailable");
  return {
    createAdminClient: () => {
      if (!adminAvailable.value) throw new AdminClientUnavailableError();
      return {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle,
            }),
          }),
        }),
      };
    },
  };
});

vi.mock("@/lib/logging", () => ({ logError }));

import { isAccountDeleted, DELETED_ACCOUNT_REASON } from "../account-status";
import { AdminClientUnavailableError } from "@/lib/supabase/admin-unavailable";

beforeEach(() => {
  vi.clearAllMocks();
  adminAvailable.value = true;
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

  it("throws, not false, when the admin client is unavailable", async () => {
    // "Could not check" must not read as "not deleted": the sign-in refuses.
    adminAvailable.value = false;
    await expect(isAccountDeleted("user-6")).rejects.toBeInstanceOf(
      AdminClientUnavailableError
    );
  });

  it("exposes a stable reason string for the redirect query param", () => {
    expect(DELETED_ACCOUNT_REASON).toBe("account_deleted");
  });
});
