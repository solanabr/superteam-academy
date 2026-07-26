/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

// LX-E2 — the capstone credential gate must (a) withhold + queue the capstone
// credential when there is no verified deploy, on BOTH the webhook path here
// and the login drainer, and (b) leave the XP path completely untouched.

const {
  isPlatformFrozen,
  fetchEnrollment,
  fetchCourse,
  getCourseById,
  uploadCertificateMetadata,
  issueCredential,
  checkCapstoneCredentialGate,
  queueUpsert,
  certUpsert,
  awardXpRpc,
  resolveUserId,
  resolveCourseId,
} = vi.hoisted(() => ({
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
  getCourseById: vi.fn(),
  uploadCertificateMetadata: vi.fn(),
  issueCredential: vi.fn(),
  checkCapstoneCredentialGate: vi.fn(),
  queueUpsert: vi.fn<(row: { action_type: string }) => Promise<unknown>>(
    async () => ({ error: null })
  ),
  certUpsert: vi.fn(async () => ({ error: null })),
  awardXpRpc: vi.fn<
    (fn: string, params: Record<string, unknown>) => Promise<unknown>
  >(async () => ({ data: 1, error: null })),
  resolveUserId: vi.fn(),
  resolveCourseId: vi.fn(),
}));

vi.mock("@/lib/platform/freeze", () => ({ isPlatformFrozen }));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: vi.fn(async () => false),
}));
vi.mock("@/lib/solana/academy-reads", () => ({ fetchEnrollment, fetchCourse }));
vi.mock("@/lib/solana/bitmap", () => ({ isCourseComplete: () => false }));
vi.mock("@/lib/solana/pda", () => ({ getProgramId: () => "program-id" }));
vi.mock("@/lib/solana/academy-program", () => ({
  finalizeCourse: vi.fn(),
  issueCredential,
  awardAchievement: vi.fn(),
  getConnection: () => ({}),
}));
vi.mock("@/lib/solana/arweave", () => ({ uploadCertificateMetadata }));
vi.mock("@/lib/content/queries", () => ({
  getCourseById,
  getDeployedAchievements: vi.fn(async () => []),
}));
vi.mock("@/lib/gamification/achievements", () => ({
  checkNewAchievements: vi.fn(() => []),
  buildUserState: vi.fn(),
}));
vi.mock("@/lib/gamification/surprise-bonus", () => ({
  maybeAwardSurpriseBonus: vi.fn(),
}));
vi.mock("@/lib/helius/resolvers", () => ({
  resolveUserId,
  resolveCourseId,
  resolveLessonId: vi.fn(async () => "lesson-1"),
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/credentials/capstone-gate", () => ({
  checkCapstoneCredentialGate,
  CAPSTONE_CREDENTIAL: {
    courseId: "course-building-first-program",
    deployLessonId: "lesson-bfsp-m4-capstone",
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "pending_onchain_actions") return { upsert: queueUpsert };
      if (table === "certificates") return { upsert: certUpsert };
      if (table === "nft_metadata")
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: "meta-1" }, error: null }),
            }),
          }),
          delete: () => ({ eq: async () => ({ error: null }) }),
        };
      if (table === "profiles")
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { username: "alice" } }),
            }),
          }),
        };
      if (table === "enrollments")
        return {
          update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
        };
      throw new Error(`unexpected table ${table}`);
    },
    rpc: awardXpRpc,
  }),
}));

import { tryIssueCredential, handleCourseFinalized } from "../event-handlers";
import { CAPSTONE_CREDENTIAL } from "@/lib/credentials/capstone-gate";
import type { CourseFinalizedEvent } from "@/lib/helius/types";

const CAPSTONE = CAPSTONE_CREDENTIAL.courseId;
const WALLET = Keypair.generate().publicKey.toBase58();
const CONNECTION = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  isPlatformFrozen.mockResolvedValue(false);
  // Enrollment exists, not yet credentialed.
  fetchEnrollment.mockResolvedValue({ credential_asset: null });
  // A fully-synced on-chain course so the allowed path can reach issueCredential.
  fetchCourse.mockResolvedValue({
    collection: Keypair.generate().publicKey.toBase58(),
    xp_per_lesson: 10,
    liveLessonCount: 4,
    version: 1,
  });
  getCourseById.mockResolvedValue({ title: "Building Your First Program" });
  uploadCertificateMetadata.mockResolvedValue(null);
  issueCredential.mockResolvedValue({
    signature: "sig",
    mintAddress: Keypair.generate().publicKey,
  });
});

describe("tryIssueCredential — capstone gate (webhook path)", () => {
  it("withholds + queues the capstone credential when deploy is required", async () => {
    checkCapstoneCredentialGate.mockResolvedValue({
      status: "deploy_required",
    });

    await tryIssueCredential("user-1", CAPSTONE, WALLET, CONNECTION);

    expect(issueCredential).not.toHaveBeenCalled();
    // Deferred onto the certificate queue (fail-closed, retried on next drain).
    expect(queueUpsert).toHaveBeenCalledTimes(1);
    const queued = queueUpsert.mock.calls[0]?.[0];
    expect(queued?.action_type).toBe("certificate");
  });

  it("fails closed (queues, never issues) when deploy state is indeterminate", async () => {
    checkCapstoneCredentialGate.mockResolvedValue({ status: "indeterminate" });

    await tryIssueCredential("user-1", CAPSTONE, WALLET, CONNECTION);

    expect(issueCredential).not.toHaveBeenCalled();
    expect(queueUpsert).toHaveBeenCalledTimes(1);
  });

  it("issues the capstone credential once the deploy is verified", async () => {
    checkCapstoneCredentialGate.mockResolvedValue({ status: "allowed" });

    await tryIssueCredential("user-1", CAPSTONE, WALLET, CONNECTION);

    expect(issueCredential).toHaveBeenCalledTimes(1);
    expect(queueUpsert).not.toHaveBeenCalled();
  });

  it("issues a non-capstone credential without any deploy requirement", async () => {
    checkCapstoneCredentialGate.mockResolvedValue({ status: "not_capstone" });

    await tryIssueCredential(
      "user-1",
      "course-solana-fundamentals",
      WALLET,
      CONNECTION
    );

    expect(issueCredential).toHaveBeenCalledTimes(1);
    expect(queueUpsert).not.toHaveBeenCalled();
  });
});

describe("handleCourseFinalized — XP path is untouched by the gate", () => {
  function finalizedEvent(): CourseFinalizedEvent {
    return {
      learner: WALLET,
      course: "course-onchain",
      totalXp: 40,
      bonusXp: 250,
      creator: WALLET,
      creatorXp: 0,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  it("awards completion-bonus XP even when the capstone credential is withheld", async () => {
    resolveUserId.mockResolvedValue("user-1");
    resolveCourseId.mockResolvedValue(CAPSTONE);
    checkCapstoneCredentialGate.mockResolvedValue({
      status: "deploy_required",
    });

    await handleCourseFinalized(finalizedEvent(), "tx-123");

    // Bonus XP still awarded — the gate only guards issue_credential.
    const bonusCall = awardXpRpc.mock.calls.find(
      (c) => c[0] === "award_xp" && /bonus/i.test(String(c[1].p_reason ?? ""))
    );
    expect(bonusCall, "completion-bonus XP must be awarded").toBeTruthy();
    // ...but the credential is deferred, not minted.
    expect(issueCredential).not.toHaveBeenCalled();
    expect(queueUpsert).toHaveBeenCalledTimes(1);
  });
});
