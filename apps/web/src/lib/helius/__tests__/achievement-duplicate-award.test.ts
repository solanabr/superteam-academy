/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Where every stuck achievement row in prod came from (2026-08-24).
//
// `checkNewAchievements` decides what is un-earned from `user_achievements`,
// and that table is written by the AchievementAwarded webhook — which lands
// seconds AFTER the award transaction. Two lesson completions inside that
// window both see the achievement as un-earned, so the second one re-awards it.
// The AchievementReceipt PDA already exists by then, the CPI's Allocate fails
// with `custom program error: 0x0`, and we queue a "failure" for an achievement
// that is fully delivered — 17 of the 20 stuck rows carried exactly that error,
// and all 20 were on-chain and in the DB the whole time.
// ---------------------------------------------------------------------------

const {
  isPlatformFrozen,
  fetchAchievementReceipt,
  onChainAwardAchievement,
  checkNewAchievements,
  queueUpsert,
  rpc,
} = vi.hoisted(() => ({
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  fetchAchievementReceipt: vi.fn<() => Promise<boolean>>(),
  onChainAwardAchievement: vi.fn(),
  checkNewAchievements: vi.fn(),
  queueUpsert:
    vi.fn<
      (table: string, row: Record<string, unknown>) => Promise<{ error: null }>
    >(),
  rpc: vi.fn<
    (
      fn: string,
      params: Record<string, unknown>
    ) => Promise<{ data: null; error: null }>
  >(),
}));

vi.mock("@/lib/platform/freeze", () => ({ isPlatformFrozen }));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchAchievementReceipt,
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
}));
vi.mock("@/lib/solana/bitmap", () => ({ isCourseComplete: vi.fn() }));
vi.mock("@/lib/solana/pda", () => ({ getProgramId: () => "program-id" }));
vi.mock("@/lib/solana/academy-program", () => ({
  finalizeCourse: vi.fn(),
  issueCredential: vi.fn(),
  awardAchievement: onChainAwardAchievement,
  getConnection: () => ({}),
}));
vi.mock("@/lib/solana/arweave", () => ({ uploadCertificateMetadata: vi.fn() }));
vi.mock("@/lib/gamification/achievements", () => ({
  checkNewAchievements,
  buildUserState: vi.fn(async () => ({})),
}));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: vi.fn(async () => false),
}));
vi.mock("@/lib/content/queries", () => ({
  getCourseById: vi.fn(),
  getDeployedAchievements: vi.fn(async () => []),
}));
vi.mock("@/lib/credentials/capstone-gate", () => ({
  checkCapstoneCredentialGate: vi.fn(),
}));
vi.mock("@/lib/gamification/surprise-bonus", () => ({
  maybeAwardSurpriseBonus: vi.fn(),
}));
vi.mock("@/lib/referrals/server", () => ({
  recordReferralCoursePoint: vi.fn(),
}));
vi.mock("@/lib/gamification/quest-evaluation", () => ({
  scheduleQuestEvaluation: vi.fn(),
}));
vi.mock("@/lib/helius/resolvers", () => ({
  resolveUserId: vi.fn(),
  resolveCourseId: vi.fn(),
  resolveLessonId: vi.fn(),
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

const supabase = {
  from: (table: string) => ({
    select: () => ({ eq: async () => ({ data: [], error: null }) }),
    upsert: (row: Record<string, unknown>) => queueUpsert(table, row),
  }),
  rpc: (fn: string, params: Record<string, unknown>) => rpc(fn, params),
};

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => supabase }));

import { checkAndAwardAchievements } from "../event-handlers";

const WALLET = "6JFH1dxqiw6Dc81CbWdx4TUT8CvAfgwZg33wQrSytZsU";
const USER_ID = "user-1";

beforeEach(() => {
  vi.clearAllMocks();
  isPlatformFrozen.mockResolvedValue(false);
  checkNewAchievements.mockReturnValue([{ id: "achievement-first-steps" }]);
  queueUpsert.mockResolvedValue({ error: null });
  rpc.mockResolvedValue({ data: null, error: null });
});

describe("checkAndAwardAchievements — duplicate award", () => {
  it("does not re-award (or queue) an achievement whose receipt is already on-chain", async () => {
    fetchAchievementReceipt.mockResolvedValue(true);

    await checkAndAwardAchievements(
      USER_ID,
      WALLET,
      supabase as unknown as Parameters<typeof checkAndAwardAchievements>[2]
    );

    expect(onChainAwardAchievement).not.toHaveBeenCalled();
    // No queue row: nothing failed. This is the whole fix — before it, the
    // re-award threw 0x0 and left a row that outlived the incident by weeks.
    expect(queueUpsert).not.toHaveBeenCalled();
    // The DB is still reconciled from the chain, so a missed AchievementAwarded
    // webhook does not leave the badge invisible.
    expect(rpc).toHaveBeenCalledWith("unlock_achievement", {
      p_user_id: USER_ID,
      p_achievement_id: "achievement-first-steps",
    });
  });

  it("awards normally when the receipt does not exist yet", async () => {
    fetchAchievementReceipt.mockResolvedValue(false);

    await checkAndAwardAchievements(
      USER_ID,
      WALLET,
      supabase as unknown as Parameters<typeof checkAndAwardAchievements>[2]
    );

    expect(onChainAwardAchievement).toHaveBeenCalledTimes(1);
    expect(queueUpsert).not.toHaveBeenCalled();
  });

  it("still queues a genuine award failure for retry", async () => {
    fetchAchievementReceipt.mockResolvedValue(false);
    onChainAwardAchievement.mockRejectedValue(new Error("rpc down"));

    await checkAndAwardAchievements(
      USER_ID,
      WALLET,
      supabase as unknown as Parameters<typeof checkAndAwardAchievements>[2]
    );

    expect(queueUpsert).toHaveBeenCalledWith(
      "pending_onchain_actions",
      expect.objectContaining({
        action_type: "achievement",
        reference_id: "achievement-first-steps",
        last_error: "rpc down",
      })
    );
  });

  it("records something usable when Anchor destroys the error message", async () => {
    fetchAchievementReceipt.mockResolvedValue(false);
    onChainAwardAchievement.mockRejectedValue(
      new Error("Unknown action 'undefined'")
    );

    await checkAndAwardAchievements(
      USER_ID,
      WALLET,
      supabase as unknown as Parameters<typeof checkAndAwardAchievements>[2]
    );

    const row = queueUpsert.mock.calls[0]?.[1];
    expect(row?.last_error).not.toBe("Unknown action 'undefined'");
    expect(row?.last_error).toContain("after broadcast");
  });
});
