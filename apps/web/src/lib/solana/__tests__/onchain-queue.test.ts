/* eslint-disable import/order -- vi.mock calls must be hoisted above the
   module-under-test import, which forces that import to sit after non-import
   code (same pattern as the other solana/__tests__ suites). */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Regression suite for #372 — credit-loss in the on-chain retry queue.
//
// Before the fix, the `course_finalize` and `xp` retry handlers checked only
// the RPC *error* and then unconditionally stamped resolved_at. When award_xp
// credited 0 because the 5000/day cap was already eaten, the owed XP was marked
// delivered and lost forever. These tests drive retryPendingOnchainActions with
// a stubbed admin client whose award_xp return value we control, and assert on
// exactly which columns the queue row is patched with.
// ---------------------------------------------------------------------------

interface UpdateCapture {
  id: unknown;
  patch: Record<string, unknown>;
}

interface PendingRow {
  id: string;
  action_type: string;
  reference_id: string;
  retry_count: number | null;
  payload: Record<string, unknown>;
}

// Hoisted shared state so the module mocks (evaluated before the test body) can
// read/mutate it. Each test rewrites `rows` / configures `awardXp` in beforeEach.
const h = vi.hoisted(() => ({
  rows: [] as PendingRow[],
  walletAddress: "WALLET_ADDR" as string | null,
  updates: [] as UpdateCapture[],
  awardXp: vi.fn<
    (params: Record<string, unknown>) => {
      data: number | null;
      error: { message: string } | null;
    }
  >(),
  fetchEnrollment: vi.fn(),
  finalizeCourse: vi.fn(),
  isCourseInMaintenance: vi.fn<(courseId: string) => Promise<boolean>>(),
  getCourseById: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@solana/web3.js", () => ({
  PublicKey: class {
    constructor(public value: string) {}
    toBase58() {
      return this.value;
    }
  },
}));

vi.mock("../pda", () => ({
  getProgramId: () => ({ toBase58: () => "PROGRAM_ID" }),
}));

vi.mock("../academy-program", () => ({
  getConnection: () => ({}),
  awardAchievement: vi.fn(),
  finalizeCourse: (...args: unknown[]) => h.finalizeCourse(...args),
  issueCredential: vi.fn(),
}));

vi.mock("../academy-reads", () => ({
  fetchAchievementReceipt: vi.fn(),
  fetchEnrollment: (...args: unknown[]) => h.fetchEnrollment(...args),
  fetchCourse: vi.fn(),
}));

vi.mock("@/lib/content/queries", () => ({
  getCourseById: (...args: unknown[]) => h.getCourseById(...args),
}));

vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: (...args: [string]) =>
    h.isCourseInMaintenance(...args),
}));

vi.mock("@/lib/supabase/admin", () => {
  // Minimal chainable stub of the Supabase query builder. Terminal reads
  // (`.lt()`, `.single()`) return real promises; an `.update(...).eq("id", …)`
  // chain records the patch when awaited (via the thenable `then`).
  class Chain {
    private isUpdate = false;
    private patch: Record<string, unknown> | null = null;
    private updateId: unknown = undefined;

    select(): this {
      return this;
    }
    is(): this {
      return this;
    }
    update(patch: Record<string, unknown>): this {
      this.isUpdate = true;
      this.patch = patch;
      return this;
    }
    eq(column: string, value: unknown): this {
      if (this.isUpdate && column === "id") this.updateId = value;
      return this;
    }
    lt(): Promise<{ data: PendingRow[]; error: null }> {
      return Promise.resolve({ data: h.rows, error: null });
    }
    single(): Promise<{
      data: { wallet_address: string } | null;
      error: null;
    }> {
      return Promise.resolve({
        data: h.walletAddress ? { wallet_address: h.walletAddress } : null,
        error: null,
      });
    }
    then(
      onFulfilled?: (value: { data: null; error: null }) => unknown
    ): Promise<unknown> {
      if (this.isUpdate && this.patch) {
        h.updates.push({ id: this.updateId, patch: this.patch });
      }
      return Promise.resolve({ data: null, error: null }).then(onFulfilled);
    }
  }

  return {
    createAdminClient: () => ({
      from: (_table: string) => new Chain(),
      rpc: (_fn: string, params: Record<string, unknown>) =>
        Promise.resolve(h.awardXp(params)),
    }),
  };
});

import { retryPendingOnchainActions } from "../onchain-queue";

const USER_ID = "user-1";

/** The single update the queue applied to `rowId`, or undefined if untouched. */
function patchFor(rowId: string): Record<string, unknown> | undefined {
  return h.updates.find((u) => u.id === rowId)?.patch;
}

beforeEach(() => {
  h.rows = [];
  h.walletAddress = "WALLET_ADDR";
  h.updates.length = 0;
  h.awardXp.mockReset();
  h.fetchEnrollment.mockReset();
  h.finalizeCourse.mockReset();
  h.isCourseInMaintenance.mockReset();
  h.getCourseById.mockReset();
  // Default: course already finalized on-chain, so finalizeCourse is skipped
  // and each test exercises the XP-settlement path in isolation.
  h.fetchEnrollment.mockResolvedValue({ completed_at: 1_700_000_000 });
  // Default: no course is under maintenance — existing tests exercise the
  // ordinary on-chain path unless a test explicitly gates a course.
  h.isCourseInMaintenance.mockResolvedValue(false);
});

describe("retryPendingOnchainActions — xp credit-loss (#372)", () => {
  it("leaves an xp row UNRESOLVED with retry_count untouched when the cap ate the credit", async () => {
    h.rows = [
      {
        id: "r-xp",
        action_type: "xp",
        reference_id: "lesson-1",
        retry_count: 0,
        payload: { lessonId: "lesson-1", xpAmount: 50 },
      },
    ];
    h.awardXp.mockReturnValue({ data: 0, error: null }); // cap consumed it

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-xp");
    expect(patch).toBeDefined();
    // The bug: this used to be a resolved_at stamp.
    expect(patch?.resolved_at).toBeUndefined();
    expect(patch?.retry_count).toBeUndefined();
    expect(patch?.last_error).toBe("daily-cap-deferred");
  });

  it("resolves an xp row once award_xp reports a positive credit", async () => {
    h.rows = [
      {
        id: "r-xp-ok",
        action_type: "xp",
        reference_id: "lesson-2",
        retry_count: 0,
        payload: { lessonId: "lesson-2", xpAmount: 50 },
      },
    ];
    h.awardXp.mockReturnValue({ data: 50, error: null });

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-xp-ok");
    expect(typeof patch?.resolved_at).toBe("string");
    expect(patch?.retry_count).toBeUndefined();
  });

  it("bumps retry_count on a transient award_xp RPC error", async () => {
    h.rows = [
      {
        id: "r-xp-err",
        action_type: "xp",
        reference_id: "lesson-3",
        retry_count: 2,
        payload: { lessonId: "lesson-3", xpAmount: 50 },
      },
    ];
    h.awardXp.mockReturnValue({ data: null, error: { message: "rpc down" } });

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-xp-err");
    expect(patch?.resolved_at).toBeUndefined();
    expect(patch?.retry_count).toBe(3);
    expect(patch?.last_error).toBe("rpc down");
  });

  it("passes reference_id as the award_xp idempotency key (safe re-sweep)", async () => {
    h.rows = [
      {
        id: "r-xp-idem",
        action_type: "xp",
        reference_id: "lesson-4",
        retry_count: 0,
        payload: { lessonId: "lesson-4", xpAmount: 40 },
      },
    ];
    h.awardXp.mockReturnValue({ data: 40, error: null });

    await retryPendingOnchainActions(USER_ID);

    expect(h.awardXp).toHaveBeenCalledWith(
      expect.objectContaining({ p_idempotency_key: "lesson-4", p_amount: 40 })
    );
  });
});

describe("retryPendingOnchainActions — course_finalize credit-loss (#372)", () => {
  it("leaves a course_finalize row UNRESOLVED when a genuinely-owed bonus is cap-eaten", async () => {
    h.rows = [
      {
        id: "r-cf",
        action_type: "course_finalize",
        reference_id: "course-1",
        retry_count: 0,
        payload: { courseId: "course-1", walletAddress: "W", xpAmount: 2000 },
      },
    ];
    h.awardXp.mockReturnValue({ data: 0, error: null }); // cap consumed it

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-cf");
    expect(patch).toBeDefined();
    expect(patch?.resolved_at).toBeUndefined();
    expect(patch?.retry_count).toBeUndefined();
    expect(patch?.last_error).toBe("daily-cap-deferred");
  });

  it("bumps retry_count on a course_finalize row whose xpAmount is present but not a number (malformed, not silent-resolve)", async () => {
    h.rows = [
      {
        id: "r-cf-bad",
        action_type: "course_finalize",
        reference_id: "course-bad",
        retry_count: 1,
        payload: {
          courseId: "course-bad",
          walletAddress: "W",
          xpAmount: "2000",
        },
      },
    ];

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-cf-bad");
    expect(patch).toBeDefined();
    // A malformed amount must NOT silently resolve — it retries, symmetric with
    // the "xp" case (which throws on an invalid xpAmount).
    expect(patch?.resolved_at).toBeUndefined();
    expect(patch?.retry_count).toBe(2);
    expect(String(patch?.last_error)).toContain(
      "Invalid course_finalize payload"
    );
    expect(h.awardXp).not.toHaveBeenCalled();
  });

  it("resolves a course_finalize row that owes no XP (real producer payload) without calling award_xp", async () => {
    h.rows = [
      {
        id: "r-cf-noxp",
        action_type: "course_finalize",
        reference_id: "course-2",
        retry_count: 0,
        payload: { courseId: "course-2", walletAddress: "W" }, // no xpAmount
      },
    ];

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-cf-noxp");
    expect(typeof patch?.resolved_at).toBe("string");
    expect(h.awardXp).not.toHaveBeenCalled();
  });

  it("resolves a course_finalize row when the owed bonus is actually credited", async () => {
    h.rows = [
      {
        id: "r-cf-ok",
        action_type: "course_finalize",
        reference_id: "course-3",
        retry_count: 0,
        payload: { courseId: "course-3", walletAddress: "W", xpAmount: 1500 },
      },
    ];
    h.awardXp.mockReturnValue({ data: 1500, error: null });

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-cf-ok");
    expect(typeof patch?.resolved_at).toBe("string");
    expect(h.awardXp).toHaveBeenCalledWith(
      expect.objectContaining({ p_idempotency_key: "course-3", p_amount: 1500 })
    );
  });
});

// ---------------------------------------------------------------------------
// Regression suite for the adversarial-review Fix 1 — the maintenance gate was
// not wired into this login-triggered drain. During a close+recreate's
// absent-PDA window (lib/admin/recreate-course.ts), a login could drain a
// gated course's queued finalize/certificate, hit the on-chain revert, and
// bump retry_count. Repeated drains across an extended outage could push
// retry_count to 5, at which point the `.lt("retry_count", 5)` fetch filter
// EXCLUDES the row forever — abandoning it even after the operator redeploys.
// The fix: check the gate FIRST and DEFER (skip, leave the row, do not touch
// retry_count) exactly like the daily-cap deferral already does for XP.
// ---------------------------------------------------------------------------
describe("retryPendingOnchainActions — maintenance-gate deferral (adversarial-review fix 1)", () => {
  it("defers a course_finalize row for a course under maintenance, WITHOUT bumping retry_count or resolving it", async () => {
    h.rows = [
      {
        id: "r-cf-gated",
        action_type: "course_finalize",
        reference_id: "course-gated",
        retry_count: 1,
        payload: { courseId: "course-gated", walletAddress: "W" },
      },
    ];
    h.isCourseInMaintenance.mockImplementation(
      async (courseId: string) => courseId === "course-gated"
    );

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-cf-gated");
    expect(patch).toBeDefined();
    expect(patch?.resolved_at).toBeUndefined();
    expect(patch?.retry_count).toBeUndefined();
    expect(String(patch?.last_error)).toContain("course-in-maintenance");
    // The on-chain finalize must never even be attempted while gated.
    expect(h.finalizeCourse).not.toHaveBeenCalled();
    expect(h.fetchEnrollment).not.toHaveBeenCalled();
  });

  it("proceeds as before with a course_finalize row for an UNGATED course", async () => {
    h.rows = [
      {
        id: "r-cf-ungated",
        action_type: "course_finalize",
        reference_id: "course-ungated",
        retry_count: 0,
        payload: { courseId: "course-ungated", walletAddress: "W" },
      },
    ];
    h.isCourseInMaintenance.mockResolvedValue(false);
    // Already finalized on-chain (beforeEach default) — no xpAmount owed, so
    // this resolves purely on the finalize check.

    await retryPendingOnchainActions(USER_ID);

    expect(h.isCourseInMaintenance).toHaveBeenCalledWith("course-ungated");
    const patch = patchFor("r-cf-ungated");
    expect(typeof patch?.resolved_at).toBe("string");
  });

  it("defers a certificate row for a course under maintenance, WITHOUT bumping retry_count", async () => {
    h.rows = [
      {
        id: "r-cert-gated",
        action_type: "certificate",
        reference_id: "course-gated",
        retry_count: 2,
        payload: { courseId: "course-gated" },
      },
    ];
    h.isCourseInMaintenance.mockImplementation(
      async (courseId: string) => courseId === "course-gated"
    );

    await retryPendingOnchainActions(USER_ID);

    const patch = patchFor("r-cert-gated");
    expect(patch).toBeDefined();
    expect(patch?.resolved_at).toBeUndefined();
    expect(patch?.retry_count).toBeUndefined();
    expect(String(patch?.last_error)).toContain("course-in-maintenance");
    // Deferred before any of the certificate-mint machinery runs.
    expect(h.getCourseById).not.toHaveBeenCalled();
    expect(h.fetchEnrollment).not.toHaveBeenCalled();
  });
});
