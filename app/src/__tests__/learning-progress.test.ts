import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LocalStorageProgressService } from "@/lib/services/learning-progress";

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

function createLocalStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
    key: vi.fn((index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    }),
    get length(): number {
      return Object.keys(store).length;
    },
    _store: () => store,
  };
}

let storageMock: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  storageMock = createLocalStorageMock();
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: storageMock,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: fixed date for deterministic streak tests
// ---------------------------------------------------------------------------

function setFakeDate(iso: string): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

function restoreDate(): void {
  vi.useRealTimers();
}

// ---------------------------------------------------------------------------
// enrollInCourse
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — enrollInCourse", () => {
  let svc: LocalStorageProgressService;
  const userId = "user1";
  const courseId = "course-abc";

  beforeEach(() => {
    svc = new LocalStorageProgressService();
  });

  it("creates a new progress record with defaults", async () => {
    await svc.enrollInCourse(userId, courseId);

    const progress = await svc.getProgress(userId, courseId);
    expect(progress).not.toBeNull();
    expect(progress!.courseId).toBe(courseId);
    expect(progress!.completedLessons).toEqual([]);
    expect(progress!.totalLessons).toBe(10);
    expect(progress!.percentage).toBe(0);
    expect(progress!.enrolledAt).toBeTruthy();
    expect(progress!.lastAccessedAt).toBeTruthy();
    expect(progress!.completedAt).toBeUndefined();
  });

  it("does not overwrite existing enrollment", async () => {
    await svc.enrollInCourse(userId, courseId);
    const first = await svc.getProgress(userId, courseId);

    // Complete a lesson so state diverges
    await svc.completeLesson(userId, courseId, 0);

    // Re-enroll should be a no-op
    await svc.enrollInCourse(userId, courseId);
    const after = await svc.getProgress(userId, courseId);

    expect(after!.completedLessons).toEqual([0]);
    expect(after!.enrolledAt).toBe(first!.enrolledAt);
  });

  it("tracks the course in the enrolled list", async () => {
    await svc.enrollInCourse(userId, courseId);
    await svc.enrollInCourse(userId, "course-xyz");

    const enrolledRaw = storageMock.getItem("sta_enrolled:user1");
    expect(enrolledRaw).not.toBeNull();
    const enrolled = JSON.parse(enrolledRaw!);
    expect(enrolled).toContain(courseId);
    expect(enrolled).toContain("course-xyz");
    expect(enrolled).toHaveLength(2);
  });

  it("does not duplicate courseId in enrolled list on repeat enrollment", async () => {
    await svc.enrollInCourse(userId, courseId);
    await svc.enrollInCourse(userId, courseId);

    const enrolledRaw = storageMock.getItem("sta_enrolled:user1");
    const enrolled = JSON.parse(enrolledRaw!);
    expect(enrolled.filter((c: string) => c === courseId)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// completeLesson
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — completeLesson", () => {
  let svc: LocalStorageProgressService;
  const userId = "user1";
  const courseId = "course-abc";

  beforeEach(async () => {
    svc = new LocalStorageProgressService();
    await svc.enrollInCourse(userId, courseId);
  });

  it("adds a lesson index to completedLessons", async () => {
    await svc.completeLesson(userId, courseId, 3);
    const p = await svc.getProgress(userId, courseId);
    expect(p!.completedLessons).toContain(3);
  });

  it("keeps completedLessons sorted", async () => {
    await svc.completeLesson(userId, courseId, 5);
    await svc.completeLesson(userId, courseId, 2);
    await svc.completeLesson(userId, courseId, 8);
    const p = await svc.getProgress(userId, courseId);
    expect(p!.completedLessons).toEqual([2, 5, 8]);
  });

  it("does not duplicate lesson indices", async () => {
    await svc.completeLesson(userId, courseId, 1);
    await svc.completeLesson(userId, courseId, 1);
    const p = await svc.getProgress(userId, courseId);
    expect(p!.completedLessons).toEqual([1]);
  });

  it("updates percentage correctly", async () => {
    // totalLessons defaults to 10
    await svc.completeLesson(userId, courseId, 0);
    await svc.completeLesson(userId, courseId, 1);
    await svc.completeLesson(userId, courseId, 2);
    const p = await svc.getProgress(userId, courseId);
    expect(p!.percentage).toBe(30); // 3/10 * 100
  });

  it("sets completedAt when all lessons are done", async () => {
    for (let i = 0; i < 10; i++) {
      await svc.completeLesson(userId, courseId, i);
    }
    const p = await svc.getProgress(userId, courseId);
    expect(p!.percentage).toBe(100);
    expect(p!.completedAt).toBeTruthy();
  });

  it("does nothing if the course has no progress record (not enrolled)", async () => {
    await svc.completeLesson(userId, "nonexistent-course", 0);
    const p = await svc.getProgress(userId, "nonexistent-course");
    expect(p).toBeNull();
  });

  it("updates lastAccessedAt on each lesson completion", async () => {
    setFakeDate("2026-01-10T10:00:00Z");
    await svc.completeLesson(userId, courseId, 0);
    const p1 = await svc.getProgress(userId, courseId);

    setFakeDate("2026-01-11T12:00:00Z");
    await svc.completeLesson(userId, courseId, 1);
    const p2 = await svc.getProgress(userId, courseId);

    expect(new Date(p2!.lastAccessedAt).getTime()).toBeGreaterThan(
      new Date(p1!.lastAccessedAt).getTime()
    );
    restoreDate();
  });
});

// ---------------------------------------------------------------------------
// getProgress / getAllProgress
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — getProgress & getAllProgress", () => {
  let svc: LocalStorageProgressService;
  const userId = "user1";

  beforeEach(() => {
    svc = new LocalStorageProgressService();
  });

  it("returns null for an unenrolled course", async () => {
    const p = await svc.getProgress(userId, "no-such-course");
    expect(p).toBeNull();
  });

  it("returns all enrolled progress for a user", async () => {
    await svc.enrollInCourse(userId, "c1");
    await svc.enrollInCourse(userId, "c2");
    await svc.enrollInCourse(userId, "c3");

    const all = await svc.getAllProgress(userId);
    expect(all).toHaveLength(3);
    const ids = all.map((p) => p.courseId);
    expect(ids).toContain("c1");
    expect(ids).toContain("c2");
    expect(ids).toContain("c3");
  });

  it("does not return progress belonging to another user", async () => {
    await svc.enrollInCourse("user1", "c1");
    await svc.enrollInCourse("user2", "c2");

    const u1 = await svc.getAllProgress("user1");
    expect(u1).toHaveLength(1);
    expect(u1[0].courseId).toBe("c1");

    const u2 = await svc.getAllProgress("user2");
    expect(u2).toHaveLength(1);
    expect(u2[0].courseId).toBe("c2");
  });
});

// ---------------------------------------------------------------------------
// XP
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — XP", () => {
  let svc: LocalStorageProgressService;
  const userId = "user1";

  beforeEach(() => {
    svc = new LocalStorageProgressService();
  });

  it("returns 0 XP for a new user", async () => {
    expect(await svc.getXP(userId)).toBe(0);
  });

  it("adds XP and returns the new total", async () => {
    const result = await svc.addXP(userId, 100);
    expect(result).toBe(100);
    expect(await svc.getXP(userId)).toBe(100);
  });

  it("accumulates XP across multiple calls", async () => {
    await svc.addXP(userId, 50);
    await svc.addXP(userId, 75);
    await svc.addXP(userId, 25);
    expect(await svc.getXP(userId)).toBe(150);
  });

  it("keeps XP separate per user", async () => {
    await svc.addXP("alice", 200);
    await svc.addXP("bob", 300);
    expect(await svc.getXP("alice")).toBe(200);
    expect(await svc.getXP("bob")).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — Streaks", () => {
  let svc: LocalStorageProgressService;
  const userId = "user1";

  beforeEach(() => {
    svc = new LocalStorageProgressService();
  });

  afterEach(() => {
    restoreDate();
  });

  it("returns default streak data for a new user", async () => {
    const streak = await svc.getStreak(userId);
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);
    expect(streak.lastActivityDate).toBe("");
    expect(streak.streakFreezes).toBe(0);
    expect(streak.activityCalendar).toEqual({});
  });

  it("records first activity with streak of 1", async () => {
    setFakeDate("2026-02-10T14:00:00Z");
    const streak = await svc.recordActivity(userId);
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
    expect(streak.lastActivityDate).toBe("2026-02-10");
    expect(streak.activityCalendar["2026-02-10"]).toBe(true);
  });

  it("does not double-count activity on the same day", async () => {
    setFakeDate("2026-02-10T10:00:00Z");
    await svc.recordActivity(userId);
    setFakeDate("2026-02-10T18:00:00Z");
    const streak = await svc.recordActivity(userId);
    expect(streak.currentStreak).toBe(1);
  });

  it("increments streak on consecutive days", async () => {
    setFakeDate("2026-02-10T12:00:00Z");
    await svc.recordActivity(userId);

    setFakeDate("2026-02-11T12:00:00Z");
    const streak = await svc.recordActivity(userId);
    expect(streak.currentStreak).toBe(2);
    expect(streak.longestStreak).toBe(2);
  });

  it("resets streak after missing more than one day", async () => {
    setFakeDate("2026-02-10T12:00:00Z");
    await svc.recordActivity(userId);

    setFakeDate("2026-02-11T12:00:00Z");
    await svc.recordActivity(userId);

    // Skip Feb 12 and 13 (2 missed days)
    setFakeDate("2026-02-14T12:00:00Z");
    const streak = await svc.recordActivity(userId);
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(2); // preserved from before
  });

  it("uses streak freeze when exactly one day is missed", async () => {
    setFakeDate("2026-02-10T12:00:00Z");
    await svc.recordActivity(userId);

    // Manually give the user a streak freeze
    const streakKey = "sta_streak:user1";
    const raw = storageMock.getItem(streakKey);
    const data = JSON.parse(raw!);
    data.streakFreezes = 1;
    storageMock.setItem(streakKey, JSON.stringify(data));

    // Skip Feb 11, record on Feb 12
    setFakeDate("2026-02-12T12:00:00Z");
    const streak = await svc.recordActivity(userId);
    expect(streak.currentStreak).toBe(2); // freeze saved the streak
    expect(streak.streakFreezes).toBe(0); // freeze consumed
    expect(streak.activityCalendar["2026-02-11"]).toBe(true); // missed day marked
  });

  it("does not use streak freeze when more than one day is missed", async () => {
    setFakeDate("2026-02-10T12:00:00Z");
    await svc.recordActivity(userId);

    const streakKey = "sta_streak:user1";
    const raw = storageMock.getItem(streakKey);
    const data = JSON.parse(raw!);
    data.streakFreezes = 1;
    storageMock.setItem(streakKey, JSON.stringify(data));

    // Skip Feb 11 and 12, record on Feb 13 (2 missed days)
    setFakeDate("2026-02-13T12:00:00Z");
    const streak = await svc.recordActivity(userId);
    expect(streak.currentStreak).toBe(1); // reset
    expect(streak.streakFreezes).toBe(1); // freeze NOT consumed
  });

  it("updates longestStreak when current exceeds it", async () => {
    setFakeDate("2026-02-01T12:00:00Z");
    await svc.recordActivity(userId);
    setFakeDate("2026-02-02T12:00:00Z");
    await svc.recordActivity(userId);
    setFakeDate("2026-02-03T12:00:00Z");
    const s1 = await svc.recordActivity(userId);
    expect(s1.longestStreak).toBe(3);

    // Break the streak
    setFakeDate("2026-02-10T12:00:00Z");
    const s2 = await svc.recordActivity(userId);
    expect(s2.currentStreak).toBe(1);
    expect(s2.longestStreak).toBe(3); // still 3
  });
});

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — Leaderboard", () => {
  let svc: LocalStorageProgressService;

  beforeEach(() => {
    svc = new LocalStorageProgressService();
  });

  it("returns a sorted list of leaderboard entries", async () => {
    const board = await svc.getLeaderboard("alltime");
    expect(board.length).toBeGreaterThan(0);

    // Verify sorted descending by XP
    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].xp).toBeGreaterThanOrEqual(board[i].xp);
    }
  });

  it("assigns sequential ranks starting from 1", async () => {
    const board = await svc.getLeaderboard("alltime");
    board.forEach((entry, index) => {
      expect(entry.rank).toBe(index + 1);
    });
  });

  it("returns lower XP values for weekly vs alltime", async () => {
    const alltime = await svc.getLeaderboard("alltime");
    const weekly = await svc.getLeaderboard("weekly");

    // Same number of entries
    expect(weekly.length).toBe(alltime.length);

    // Weekly XP should be strictly less for the top entry (multiplied by 0.15)
    const topAlltime = alltime.find((e) => e.rank === 1)!;
    const topWeekly = weekly.find((e) => e.rank === 1)!;
    expect(topWeekly.xp).toBeLessThan(topAlltime.xp);
  });

  it("returns lower XP values for monthly vs alltime", async () => {
    const alltime = await svc.getLeaderboard("alltime");
    const monthly = await svc.getLeaderboard("monthly");

    const topAlltime = alltime.find((e) => e.rank === 1)!;
    const topMonthly = monthly.find((e) => e.rank === 1)!;
    expect(topMonthly.xp).toBeLessThan(topAlltime.xp);
  });

  it("splices in local user with stored XP", async () => {
    await svc.addXP("localwallet123", 99999);

    const board = await svc.getLeaderboard("alltime");
    const localEntry = board.find((e) => e.wallet === "localwallet123");
    expect(localEntry).toBeDefined();
    expect(localEntry!.xp).toBe(99999);
    // With 99999 XP they should be ranked #1
    expect(localEntry!.rank).toBe(1);
  });

  it("includes level for each entry", async () => {
    const board = await svc.getLeaderboard("alltime");
    for (const entry of board) {
      expect(typeof entry.level).toBe("number");
      expect(entry.level).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — Achievements", () => {
  let svc: LocalStorageProgressService;
  const userId = "user1";

  beforeEach(() => {
    svc = new LocalStorageProgressService();
  });

  it("returns 20 default achievements, all unclaimed", async () => {
    const achievements = await svc.getAchievements(userId);
    expect(achievements).toHaveLength(20);
    achievements.forEach((a) => {
      expect(a.claimed).toBe(false);
      expect(a.claimedAt).toBeUndefined();
    });
  });

  it("returns achievements across all 5 categories", async () => {
    const achievements = await svc.getAchievements(userId);
    const categories = new Set(achievements.map((a) => a.category));
    expect(categories).toEqual(
      new Set(["progress", "streaks", "skills", "community", "special"])
    );
  });

  it("each achievement has required fields", async () => {
    const achievements = await svc.getAchievements(userId);
    for (const a of achievements) {
      expect(a.id).toBeGreaterThan(0);
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.icon).toBeTruthy();
      expect(a.xpReward).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// claimAchievement
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — claimAchievement", () => {
  let svc: LocalStorageProgressService;
  const userId = "user1";

  beforeEach(() => {
    svc = new LocalStorageProgressService();
  });

  it("marks an achievement as claimed", async () => {
    await svc.claimAchievement(userId, 1);
    const achievements = await svc.getAchievements(userId);
    const first = achievements.find((a) => a.id === 1)!;
    expect(first.claimed).toBe(true);
    expect(first.claimedAt).toBeTruthy();
  });

  it("awards XP when claiming an achievement", async () => {
    // Achievement #1 "First Steps" has xpReward of 50
    const xpBefore = await svc.getXP(userId);
    await svc.claimAchievement(userId, 1);
    const xpAfter = await svc.getXP(userId);
    expect(xpAfter - xpBefore).toBe(50);
  });

  it("does not double-award XP on repeat claim", async () => {
    await svc.claimAchievement(userId, 1);
    const xpAfterFirst = await svc.getXP(userId);

    await svc.claimAchievement(userId, 1);
    const xpAfterSecond = await svc.getXP(userId);
    expect(xpAfterSecond).toBe(xpAfterFirst);
  });

  it("does nothing for a non-existent achievement id", async () => {
    await svc.claimAchievement(userId, 9999);
    const xp = await svc.getXP(userId);
    expect(xp).toBe(0);
  });

  it("can claim multiple different achievements", async () => {
    await svc.claimAchievement(userId, 1);  // 50 XP
    await svc.claimAchievement(userId, 5);  // 75 XP
    await svc.claimAchievement(userId, 13); // 25 XP

    const achievements = await svc.getAchievements(userId);
    const claimed = achievements.filter((a) => a.claimed);
    expect(claimed).toHaveLength(3);

    const xp = await svc.getXP(userId);
    expect(xp).toBe(50 + 75 + 25);
  });

  it("leaves other achievements unclaimed", async () => {
    await svc.claimAchievement(userId, 1);
    const achievements = await svc.getAchievements(userId);
    const unclaimed = achievements.filter((a) => !a.claimed);
    expect(unclaimed).toHaveLength(19);
  });
});

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

describe("LocalStorageProgressService — Credentials", () => {
  let svc: LocalStorageProgressService;

  beforeEach(() => {
    svc = new LocalStorageProgressService();
  });

  it("returns empty array for a wallet with no credentials", async () => {
    const creds = await svc.getCredentials("somewallet");
    expect(creds).toEqual([]);
  });

  it("returns stored credentials when present", async () => {
    const cred = {
      trackId: 1,
      trackName: "Anchor Framework",
      currentLevel: 2,
      coursesCompleted: 3,
      totalXpEarned: 1500,
      firstEarned: "2026-01-01",
      lastUpdated: "2026-02-01",
    };
    storageMock.setItem(
      "sta_credentials:mywallet",
      JSON.stringify([cred])
    );

    const creds = await svc.getCredentials("mywallet");
    expect(creds).toHaveLength(1);
    expect(creds[0].trackName).toBe("Anchor Framework");
  });
});
