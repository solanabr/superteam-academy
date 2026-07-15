/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// WS-2 #453 rail 3 — `tryFinalizeCourse` must never silently drop a finalize
// when the Course PDA is absent (a close+recreate window) or when the
// maintenance gate is set; it must queue for retry instead. These tests cover
// `tryFinalizeCourse` directly (exported for this purpose).
// ---------------------------------------------------------------------------

const {
  isCourseInMaintenance,
  isPlatformFrozen,
  fetchEnrollment,
  fetchCourse,
  isCourseComplete,
  onChainFinalizeCourse,
  upsert,
} = vi.hoisted(() => ({
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
  isCourseComplete: vi.fn<() => boolean>(),
  onChainFinalizeCourse: vi.fn(),
  upsert: vi.fn(
    async (
      _table: string,
      _row: Record<string, unknown>,
      _options: unknown
    ) => ({ error: null })
  ),
}));

vi.mock("@/lib/content/deployments", () => ({ isCourseInMaintenance }));
vi.mock("@/lib/platform/freeze", () => ({ isPlatformFrozen }));
vi.mock("@/lib/solana/academy-reads", () => ({ fetchEnrollment, fetchCourse }));
vi.mock("@/lib/solana/bitmap", () => ({ isCourseComplete }));
vi.mock("@/lib/solana/pda", () => ({ getProgramId: () => "program-id" }));
vi.mock("@/lib/solana/academy-program", () => ({
  finalizeCourse: onChainFinalizeCourse,
  issueCredential: vi.fn(),
  awardAchievement: vi.fn(),
  getConnection: () => ({}),
}));
vi.mock("@/lib/solana/arweave", () => ({ uploadCertificateMetadata: vi.fn() }));
vi.mock("@/lib/gamification/achievements", () => ({
  checkNewAchievements: vi.fn(() => []),
  buildUserState: vi.fn(),
}));
vi.mock("@/lib/content/queries", () => ({
  getCourseById: vi.fn(),
  getDeployedAchievements: vi.fn(),
}));
vi.mock("@/lib/helius/resolvers", () => ({
  resolveUserId: vi.fn(),
  resolveCourseId: vi.fn(),
  resolveLessonId: vi.fn(),
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      upsert: (row: Record<string, unknown>, options: unknown) =>
        upsert(table, row, options),
    }),
  }),
}));

import { tryFinalizeCourse } from "../event-handlers";

const USER_ID = "user-1";
const COURSE_ID = "course-solana-101";
const WALLET = Keypair.generate().publicKey.toBase58();
const CONNECTION = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  isCourseInMaintenance.mockResolvedValue(false);
  isPlatformFrozen.mockResolvedValue(false);
  fetchEnrollment.mockResolvedValue({
    lesson_flags: [0n, 0n, 0n, 0n],
    completed_at: null,
  });
  fetchCourse.mockResolvedValue({ activeLessons: [0n, 0n, 0n, 0n] });
  isCourseComplete.mockReturnValue(false);
  onChainFinalizeCourse.mockResolvedValue("finalize-sig");
  upsert.mockResolvedValue({ error: null });
});

describe("tryFinalizeCourse — the per-course maintenance gate (rail 3)", () => {
  it("queues (does not read the chain at all) when the course is gated", async () => {
    isCourseInMaintenance.mockResolvedValue(true);

    await tryFinalizeCourse(USER_ID, COURSE_ID, WALLET, CONNECTION);

    expect(fetchEnrollment).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      "pending_onchain_actions",
      expect.objectContaining({
        user_id: USER_ID,
        action_type: "course_finalize",
        reference_id: COURSE_ID,
        last_error: expect.stringMatching(/under maintenance/i),
      }),
      { onConflict: "user_id,action_type,reference_id" }
    );
  });

  it("returns silently when there is no enrollment", async () => {
    fetchEnrollment.mockResolvedValue(null);
    await tryFinalizeCourse(USER_ID, COURSE_ID, WALLET, CONNECTION);
    expect(upsert).not.toHaveBeenCalled();
    expect(onChainFinalizeCourse).not.toHaveBeenCalled();
  });

  it("returns silently when already finalized on-chain", async () => {
    fetchEnrollment.mockResolvedValue({
      lesson_flags: [0n, 0n, 0n, 0n],
      completed_at: "2026-01-01T00:00:00Z",
    });
    await tryFinalizeCourse(USER_ID, COURSE_ID, WALLET, CONNECTION);
    expect(upsert).not.toHaveBeenCalled();
    expect(onChainFinalizeCourse).not.toHaveBeenCalled();
  });

  // THE bug this rail fixes: previously a plain `return` here silently dropped
  // the finalize with no retry path at all — a learner who finished their last
  // lesson during a close+recreate window permanently lost auto-finalize.
  it("QUEUES (never silently drops) when the Course PDA is absent", async () => {
    fetchCourse.mockResolvedValue(null);

    await tryFinalizeCourse(USER_ID, COURSE_ID, WALLET, CONNECTION);

    expect(onChainFinalizeCourse).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      "pending_onchain_actions",
      expect.objectContaining({
        user_id: USER_ID,
        action_type: "course_finalize",
        reference_id: COURSE_ID,
        last_error: expect.stringMatching(/no on-chain account/i),
      }),
      { onConflict: "user_id,action_type,reference_id" }
    );
  });

  it("returns silently when the course is not yet complete", async () => {
    isCourseComplete.mockReturnValue(false);
    await tryFinalizeCourse(USER_ID, COURSE_ID, WALLET, CONNECTION);
    expect(onChainFinalizeCourse).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("finalizes on-chain when the course is complete and not gated", async () => {
    isCourseComplete.mockReturnValue(true);
    await tryFinalizeCourse(USER_ID, COURSE_ID, WALLET, CONNECTION);
    expect(onChainFinalizeCourse).toHaveBeenCalledWith(
      COURSE_ID,
      expect.any(PublicKey)
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("queues when the on-chain finalize call itself throws", async () => {
    isCourseComplete.mockReturnValue(true);
    onChainFinalizeCourse.mockRejectedValue(new Error("tx failed"));
    await tryFinalizeCourse(USER_ID, COURSE_ID, WALLET, CONNECTION);
    expect(upsert).toHaveBeenCalledWith(
      "pending_onchain_actions",
      expect.objectContaining({
        action_type: "course_finalize",
        last_error: "tx failed",
      }),
      { onConflict: "user_id,action_type,reference_id" }
    );
  });
});

// Reset wave B2 — the GLOBAL freeze must defer the webhook's on-chain finalize
// cascade the same way the per-course maintenance gate does: queue for retry,
// never send a tx, never read the chain.
describe("tryFinalizeCourse — global freeze gate (reset wave B2)", () => {
  it("queues (no chain read, no finalize tx) when the platform is frozen", async () => {
    isCourseInMaintenance.mockResolvedValue(false);
    isPlatformFrozen.mockResolvedValue(true);
    isCourseComplete.mockReturnValue(true);

    await tryFinalizeCourse(USER_ID, COURSE_ID, WALLET, CONNECTION);

    expect(fetchEnrollment).not.toHaveBeenCalled();
    expect(onChainFinalizeCourse).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      "pending_onchain_actions",
      expect.objectContaining({
        user_id: USER_ID,
        action_type: "course_finalize",
        reference_id: COURSE_ID,
        last_error: expect.stringMatching(/frozen/i),
      }),
      { onConflict: "user_id,action_type,reference_id" }
    );
  });
});
