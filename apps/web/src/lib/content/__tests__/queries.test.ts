import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DeploymentStatus, OnchainDeploymentRow } from "../deployments";

vi.mock("server-only", () => ({}));

const WALLET_A = "WalletAAA111";
const WALLET_B = "WalletBBB222";

/**
 * A hand-written RAW-shaped fixture store (weak refs, `{ _type:"slug" }` slugs)
 * exercising the flip's branches: two synced+active courses, one synced+inactive
 * (deactivated), one not-synced. Built inside `vi.hoisted` so the (hoisted)
 * `vi.mock` factories below can close over it. `../store` and the Supabase seam
 * in `../deployments` are mocked; the mock's `isSynced` mirrors the production
 * one-liner (unit-tested for real in deployments.test.ts) so the gate semantics
 * under test are the production ones, with zero live Supabase / committed bundle.
 */
const h = vi.hoisted(() => {
  const WALLET_A = "WalletAAA111";
  const WALLET_B = "WalletBBB222";
  const slug = (current: string) => ({ _type: "slug" as const, current });
  const ref = (id: string) => ({ _ref: id, _type: "reference", _weak: true });

  const lessons = [
    {
      _id: "lesson-live-1",
      _type: "lesson",
      slug: slug("live-1"),
      title: "Live One",
      blocks: [{ _key: "b1", _type: "code", solution: "ok", tests: [] }],
    },
    {
      _id: "lesson-live-2",
      _type: "lesson",
      slug: slug("live-2"),
      title: "Live Two",
      blocks: [{ _key: "b2", _type: "prose" }],
    },
    {
      _id: "lesson-off-1",
      _type: "lesson",
      slug: slug("off-1"),
      title: "Off One",
      blocks: [{ _key: "b3", _type: "quiz", questions: [] }],
    },
  ];

  // Deliberately out of title order (Zeta before Alpha) to prove `order(title asc)`.
  const courses = [
    {
      _id: "course-zeta",
      _type: "course",
      slug: slug("zeta"),
      title: "Zeta",
      difficulty: "beginner",
      tags: ["z"],
      xpPerLesson: 20,
      creator: WALLET_A,
      modules: [{ key: "m1", title: "M1", lessons: [ref("lesson-live-1")] }],
    },
    {
      _id: "course-alpha",
      _type: "course",
      slug: slug("alpha"),
      title: "Alpha",
      difficulty: "beginner",
      tags: ["a"],
      xpPerLesson: 10,
      creator: WALLET_A,
      modules: [{ key: "m1", title: "M1", lessons: [ref("lesson-live-2")] }],
    },
    {
      // synced but DEACTIVATED — hidden from public gate, visible to grading + creator.
      _id: "course-off",
      _type: "course",
      slug: slug("off"),
      title: "Off",
      difficulty: "beginner",
      tags: ["o"],
      xpPerLesson: 30,
      creator: WALLET_B,
      modules: [{ key: "m1", title: "M1", lessons: [ref("lesson-off-1")] }],
    },
    {
      // never synced — hidden everywhere public + creator.
      _id: "course-pending",
      _type: "course",
      slug: slug("pending"),
      title: "Pending",
      difficulty: "beginner",
      tags: ["p"],
      xpPerLesson: 5,
      creator: WALLET_B,
      modules: [],
    },
  ];

  const achievements = [
    {
      _id: "achievement-deployed",
      _type: "achievement",
      name: "Deployed",
      description: "d",
      icon: "i",
      glyph: "D",
      solTier: false,
      category: "progress",
      xpReward: 10,
    },
    {
      _id: "achievement-undeployed",
      _type: "achievement",
      name: "Undeployed",
      description: "u",
      icon: "i",
      glyph: "U",
      solTier: false,
      category: "progress",
      xpReward: 0,
    },
  ];

  const quests = [
    {
      _id: "quest-active",
      _type: "quest",
      active: true,
      name: "Active",
      type: "lesson",
      xpReward: 10,
      targetValue: 1,
      resetType: "daily",
    },
    {
      _id: "quest-inactive",
      _type: "quest",
      active: false,
      name: "Inactive",
      type: "lesson",
      xpReward: 10,
      targetValue: 1,
      resetType: "daily",
    },
  ];

  const paths = [
    {
      _id: "path-main",
      _type: "learningPath",
      title: "Main",
      order: 1,
      courses: [ref("course-zeta"), ref("course-off")],
    },
  ];

  // zeta + alpha synced+active; off synced+inactive; pending absent; one achievement w/ PDA.
  const deploymentRows = [
    {
      content_id: "course-zeta",
      kind: "course",
      status: "synced",
      is_active: true,
      achievement_pda: null,
    },
    {
      content_id: "course-alpha",
      kind: "course",
      status: "synced",
      is_active: true,
      achievement_pda: null,
    },
    {
      content_id: "course-off",
      kind: "course",
      status: "synced",
      is_active: false,
      achievement_pda: null,
    },
    {
      content_id: "achievement-deployed",
      kind: "achievement",
      status: "synced",
      is_active: true,
      achievement_pda: "AchPda111",
    },
  ];

  const fullRows: Record<string, unknown> = {
    "course-off": {
      content_id: "course-off",
      kind: "course",
      status: "synced",
      course_pda: "CoursePda1",
      tx_signature: "Sig1",
      collection_address: null,
      track_collection_address: "TrackColl999",
      achievement_pda: null,
      is_active: false,
      last_synced: "2026-07-11T00:00:00Z",
      updated_at: null,
    },
  };

  return {
    lessons,
    courses,
    achievements,
    quests,
    paths,
    deploymentRows,
    fullRows,
  };
});

vi.mock("../store", () => {
  const byId = (arr: { _id: string }[]) => new Map(arr.map((d) => [d._id, d]));
  return {
    coursesById: new Map(h.courses.map((c) => [c._id, c])),
    coursesBySlug: new Map(h.courses.map((c) => [c.slug.current, c])),
    lessonsById: new Map(h.lessons.map((l) => [l._id, l])),
    lessonsBySlug: new Map(h.lessons.map((l) => [l.slug.current, l])),
    achievementsById: byId(h.achievements),
    questsById: byId(h.quests),
    pathsById: byId(h.paths),
    slotsByCourseId: new Map(),
  };
});

vi.mock("../deployments", () => {
  const deployMap = new Map(h.deploymentRows.map((r) => [r.content_id, r]));
  const getDeploymentById = vi.fn(
    async (id: string) =>
      (h.fullRows[id] as OnchainDeploymentRow | undefined) ?? null
  );
  return {
    isSynced: (dep: DeploymentStatus | undefined): boolean =>
      dep?.status === "synced" && (dep?.is_active ?? true),
    toDeploymentMap: (rows: readonly DeploymentStatus[]) =>
      new Map(rows.map((r) => [r.content_id, r])),
    getActiveDeployments: vi.fn(async () => deployMap),
    getDeploymentById,
    // Mirrors the real getDeploymentByIdSafe (#436): catches whatever
    // getDeploymentById does (including a test-injected rejection) and
    // degrades to `{ row: null, failed: true }` instead of throwing.
    getDeploymentByIdSafe: vi.fn(async (id: string) => {
      try {
        return { row: await getDeploymentById(id), failed: false };
      } catch {
        return { row: null, failed: true };
      }
    }),
  };
});

// Import AFTER the mocks are registered.
import * as q from "../queries";

beforeEach(() => vi.clearAllMocks());

describe("gated catalog fns — synced+active only, order(title asc)", () => {
  it("getAllCourses hides deactivated + not-synced, sorts by title", async () => {
    const res = await q.getAllCourses();
    expect(res.map((c) => c._id)).toEqual(["course-alpha", "course-zeta"]);
  });

  it("getCourseBySlug admits synced+active, rejects deactivated", async () => {
    expect(await q.getCourseBySlug("alpha")).not.toBeNull();
    expect(await q.getCourseBySlug("off")).toBeNull();
    expect(await q.getCourseBySlug("pending")).toBeNull();
    expect(await q.getCourseBySlug("nope")).toBeNull();
  });

  it("getCourseBySlug returns full blocks[] lessons", async () => {
    const c = await q.getCourseBySlug("zeta");
    expect(c?.modules[0]?.lessons[0]).toMatchObject({
      _id: "lesson-live-1",
      blocks: [expect.objectContaining({ _type: "code", solution: "ok" })],
    });
  });

  it("getCourseIdBySlug returns id + xpPerLesson when synced, else null", async () => {
    expect(await q.getCourseIdBySlug("zeta")).toEqual({
      _id: "course-zeta",
      xpPerLesson: 20,
    });
    expect(await q.getCourseIdBySlug("off")).toBeNull();
  });

  it("getCourseLessons lists lessons for a synced course, [] for deactivated", async () => {
    expect((await q.getCourseLessons("zeta")).map((l) => l._id)).toEqual([
      "lesson-live-1",
    ]);
    expect(await q.getCourseLessons("off")).toEqual([]);
  });

  it("getCoursesByIds gates + resolves learningPath title", async () => {
    const res = await q.getCoursesByIds(["course-zeta", "course-off"]);
    expect(res.map((c) => c._id)).toEqual(["course-zeta"]);
    expect(res[0]?.learningPath).toBe("Main");
  });

  it("getRecommendedCourses excludes ids + gates + sorts", async () => {
    const res = await q.getRecommendedCourses(["course-zeta"]);
    expect(res.map((c) => c._id)).toEqual(["course-alpha"]);
  });

  it("getAllCourseTags / getAllCourseLessonCounts only synced+active", async () => {
    const tags = await q.getAllCourseTags();
    expect(new Set(tags.map((t) => t._id))).toEqual(
      new Set(["course-zeta", "course-alpha"])
    );
    const counts = await q.getAllCourseLessonCounts();
    expect(new Set(counts.map((c) => c._id))).toEqual(
      new Set(["course-zeta", "course-alpha"])
    );
    expect(counts.find((c) => c._id === "course-zeta")?.totalLessons).toBe(1);
  });
});

describe("getLessonBySlug — gated lesson resolution", () => {
  it("resolves a lesson within a synced course", async () => {
    const l = await q.getLessonBySlug("zeta", "live-1");
    expect(l?._id).toBe("lesson-live-1");
  });

  it("returns null for a deactivated course's lesson", async () => {
    expect(await q.getLessonBySlug("off", "off-1")).toBeNull();
  });
});

describe("getLessonByIdForGrading — UNGATED (deactivated course still grades)", () => {
  it("resolves a lesson in a DEACTIVATED course", async () => {
    const l = await q.getLessonByIdForGrading("course-off", "lesson-off-1");
    expect(l?._id).toBe("lesson-off-1");
  });

  it("rejects a lesson not belonging to the course", async () => {
    expect(
      await q.getLessonByIdForGrading("course-zeta", "lesson-off-1")
    ).toBeNull();
  });
});

describe("getCourseById — UNGATED, trackCollectionAddress from the full row", () => {
  it("returns a deactivated course with trackCollectionAddress from the stub", async () => {
    const c = await q.getCourseById("course-off");
    expect(c?._id).toBe("course-off");
    expect(c?.trackCollectionAddress).toBe("TrackColl999");
  });

  it("supplies null trackCollectionAddress when no row exists", async () => {
    const c = await q.getCourseById("course-zeta");
    expect(c).not.toBeNull();
    expect(c?.trackCollectionAddress).toBeNull();
  });
});

describe("getAllLearningPaths — path with gated members", () => {
  it("includes only synced+active member courses", async () => {
    const [path] = await q.getAllLearningPaths();
    expect(path?.courses.map((c) => c._id)).toEqual(["course-zeta"]);
  });
});

describe("achievements", () => {
  it("getDeployedAchievements only includes rows with an achievement_pda", async () => {
    const res = await q.getDeployedAchievements();
    expect(res.map((a) => a.id)).toEqual(["achievement-deployed"]);
  });

  it("getAllAchievements includes all, sorted by name", async () => {
    const res = await q.getAllAchievements();
    expect(res.map((a) => a.id)).toEqual([
      "achievement-deployed",
      "achievement-undeployed",
    ]);
  });
});

describe("getAllQuests — active only", () => {
  it("returns only active quests + challenge lessons + module map", async () => {
    const data = await q.getAllQuests();
    expect(data.quests.map((qq) => qq.id)).toEqual(["quest-active"]);
    // lesson-live-1 carries a code block.
    expect(data.challengeLessonIds).toContain("lesson-live-1");
    expect(data.moduleLessonMap.length).toBeGreaterThan(0);
  });
});

describe("admin fns — full deployment row join", () => {
  it("getAllCoursesAdmin sorts by title + maps the onChainStatus row", async () => {
    const res = await q.getAllCoursesAdmin();
    expect(res.map((c) => c._id)).toEqual([
      "course-alpha",
      "course-off",
      "course-pending",
      "course-zeta",
    ]);
    const off = res.find((c) => c._id === "course-off");
    expect(off?.onChainStatus).toEqual({
      status: "synced",
      coursePda: "CoursePda1",
      lastSynced: "2026-07-11T00:00:00Z",
      txSignature: "Sig1",
    });
    expect(off?.trackCollectionAddress).toBe("TrackColl999");
    expect(off?.creatorWallet).toBe(WALLET_B);
    // no deployment row → onChainStatus null
    expect(res.find((c) => c._id === "course-zeta")?.onChainStatus).toBeNull();
  });

  it("getLearningPathsForAdmin returns courseIds from refs", async () => {
    const res = await q.getLearningPathsForAdmin();
    expect(res).toEqual([
      {
        _id: "path-main",
        title: "Main",
        courseIds: ["course-zeta", "course-off"],
      },
    ]);
  });

  it("getAllAchievementsAdmin maps the deployment row shape", async () => {
    const res = await q.getAllAchievementsAdmin();
    expect(res.map((a) => a._id)).toEqual([
      "achievement-deployed",
      "achievement-undeployed",
    ]);
    // no full row stubbed for achievements → onChainStatus null
    expect(res[0]?.onChainStatus).toBeNull();
  });
});

describe("#436 — Safe variants degrade a Supabase read failure instead of throwing", () => {
  it("getAllCoursesAdminSafe flags the failing course, leaves the rest intact", async () => {
    const deployments = await import("../deployments");
    vi.mocked(deployments.getDeploymentById).mockRejectedValueOnce(
      new Error("connection refused")
    );
    const res = await q.getAllCoursesAdminSafe();
    expect(res).toHaveLength(4);
    const failed = res.filter((c) => c.deploymentReadFailed);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.onChainStatus).toBeNull();
    // Every other course reads exactly as the healthy-path test above.
    const untouched = res.filter((c) => !c.deploymentReadFailed);
    expect(untouched).toHaveLength(3);
  });

  it("getAllCoursesAdmin (mutating-route variant) still throws — fail-closed unchanged", async () => {
    const deployments = await import("../deployments");
    vi.mocked(deployments.getDeploymentById).mockRejectedValueOnce(
      new Error("connection refused")
    );
    await expect(q.getAllCoursesAdmin()).rejects.toThrow("connection refused");
  });

  it("getAllAchievementsAdminSafe flags the failing achievement, leaves the rest intact", async () => {
    const deployments = await import("../deployments");
    vi.mocked(deployments.getDeploymentById).mockRejectedValueOnce(
      new Error("connection refused")
    );
    const res = await q.getAllAchievementsAdminSafe();
    expect(res).toHaveLength(2);
    const failed = res.filter((a) => a.deploymentReadFailed);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.onChainStatus).toBeNull();
  });

  it("getAllAchievementsAdmin (mutating-route variant) still throws — fail-closed unchanged", async () => {
    const deployments = await import("../deployments");
    vi.mocked(deployments.getDeploymentById).mockRejectedValueOnce(
      new Error("connection refused")
    );
    await expect(q.getAllAchievementsAdmin()).rejects.toThrow(
      "connection refused"
    );
  });
});

describe("creator-wallet fns (issue #478) — /teach viewer", () => {
  it("getInstructorCourses filters by wallet + synced (incl. deactivated)", async () => {
    // Wallet B owns course-off (synced+inactive) and course-pending (not synced).
    // Only the synced one shows — deactivation does NOT hide it from its owner.
    const res = await q.getInstructorCourses(WALLET_B);
    expect(res.map((c) => c._id)).toEqual(["course-off"]);
  });

  it("getInstructorCourses returns synced courses for wallet A", async () => {
    const res = await q.getInstructorCourses(WALLET_A);
    expect(new Set(res.map((c) => c._id))).toEqual(
      new Set(["course-zeta", "course-alpha"])
    );
  });

  it("isInstructorWallet is true for a known wallet, false otherwise", async () => {
    expect(await q.isInstructorWallet(WALLET_A)).toBe(true);
    expect(await q.isInstructorWallet("nobody")).toBe(false);
  });
});
