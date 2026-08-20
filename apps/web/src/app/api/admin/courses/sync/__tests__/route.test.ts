/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
// #993 regression: a course whose bundle XP values already match the chain
// must NO-OP on sync — the old update arm pushed newXpPerLesson /
// newCreatorRewardXp unconditionally, so every sync issued an update_course
// and a freshly created course could never settle.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const {
  getAccountInfo,
  fetchCourse,
  updateCoursePda,
  deployCoursePda,
  writeCourseOnChainStatus,
  writeCourseMaintenanceFlag,
  getAllCoursesAdmin,
} = vi.hoisted(() => ({
  getAccountInfo: vi.fn(),
  fetchCourse: vi.fn(),
  updateCoursePda: vi.fn(),
  deployCoursePda: vi.fn(),
  writeCourseOnChainStatus: vi.fn(),
  writeCourseMaintenanceFlag: vi.fn(),
  getAllCoursesAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SOLANA_RPC_URL: "http://localhost:8899" },
}));
vi.mock("@/lib/admin/auth", () => ({
  requireAdminAuth: vi.fn(() => ({ userId: "admin-user-1" })),
  adminUnauthorizedResponse: vi.fn(),
  AdminAuthError: class AdminAuthError extends Error {},
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/platform/freeze-http", () => ({
  platformFrozenResponse: vi.fn(),
}));
vi.mock("@/lib/content/queries", () => ({
  getAllCoursesAdmin,
  COURSES_CACHE_TAG: "courses",
}));
vi.mock("@/lib/solana/academy-reads", () => ({ fetchCourse }));
vi.mock("@/lib/solana/admin-signer", () => ({
  deployCoursePda,
  updateCoursePda,
  deployCourseTrackCollection: vi.fn(),
  setCourseCollectionPda: vi.fn(),
  buildCourseCommit: vi.fn(),
}));
vi.mock("@/lib/content/deployment-writes", () => ({
  writeCourseMaintenanceFlag,
  writeCourseOnChainStatus,
  writeCourseTrackCollection: vi.fn(),
}));
vi.mock("@/lib/content/changelog-writes", () => ({
  recordCourseDeployed: vi.fn(),
  recordCourseUpdate: vi.fn(),
}));
vi.mock("@/lib/content/prior-content", () => ({
  contentShaFromTxId: vi.fn(),
  resolvePriorRemovedLessons: vi.fn(),
}));
vi.mock("@/lib/content/store", () => ({ slotsByCourseId: new Map() }));
vi.mock("@/lib/content/meta", () => ({ SYNCED_SHA: "deadbeef" }));
vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: class {
      getAccountInfo = getAccountInfo;
    },
  };
});

import { POST } from "../route";
import { PublicKey } from "@solana/web3.js";

const COURSE_ID = "course-btc-to-sol-evolution";

/** A bundle course that passes getMissingCourseFields (the real one runs). */
function bundleCourse(overrides: Record<string, unknown> = {}) {
  return {
    _id: COURSE_ID,
    title: "BTC to SOL",
    slug: "btc-to-sol",
    difficulty: "beginner",
    lessonCount: 10,
    xpPerLesson: 20,
    creatorRewardXp: 30,
    trackId: 1,
    trackLevel: 1,
    prerequisiteCourse: null,
    creatorWallet: "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ",
    onChainStatus: { status: "synced", coursePda: null },
    ...overrides,
  };
}

/** On-chain decode matching the bundle values above. */
function decodedCourse(overrides: Record<string, unknown> = {}) {
  return {
    course_id: COURSE_ID,
    xp_per_lesson: 20,
    creator_reward_xp: 30,
    collection: PublicKey.default,
    activeLessons: [0n, 0n, 0n, 0n],
    content_tx_id: new Array(32).fill(0),
    version: 1,
    liveLessonCount: 10,
    ...overrides,
  };
}

function syncRequest(): NextRequest {
  return new NextRequest("https://app.test/api/admin/courses/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ courseId: COURSE_ID }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getAllCoursesAdmin.mockResolvedValue([bundleCourse()]);
  getAccountInfo.mockResolvedValue({ data: Buffer.alloc(253) });
  fetchCourse.mockResolvedValue(decodedCourse());
  writeCourseOnChainStatus.mockResolvedValue(undefined);
  writeCourseMaintenanceFlag.mockResolvedValue(undefined);
  updateCoursePda.mockResolvedValue({ success: true, signature: "SIG" });
});

describe("POST /api/admin/courses/sync — #993 no-op regression", () => {
  it("no-ops when bundle XP values match the chain", async () => {
    const res = await POST(syncRequest());
    const body = (await res.json()) as { action?: string };

    expect(body.action).toBe("noop");
    expect(updateCoursePda).not.toHaveBeenCalled();
  });

  it("updates only the field that actually differs", async () => {
    fetchCourse.mockResolvedValue(decodedCourse({ xp_per_lesson: 10 }));

    const res = await POST(syncRequest());
    const body = (await res.json()) as {
      action?: string;
      fieldsUpdated?: string[];
    };

    expect(body.action).toBe("updated");
    expect(body.fieldsUpdated).toEqual(["newXpPerLesson"]);
    expect(updateCoursePda).toHaveBeenCalledWith(
      expect.objectContaining({ newXpPerLesson: 20 })
    );
    expect(updateCoursePda.mock.calls[0]![0]).not.toHaveProperty(
      "newCreatorRewardXp"
    );
  });

  it("409s when the account vanishes between the two reads", async () => {
    fetchCourse.mockResolvedValue(null);

    const res = await POST(syncRequest());

    expect(res.status).toBe(409);
    expect(updateCoursePda).not.toHaveBeenCalled();
  });
});
