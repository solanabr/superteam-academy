import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { recordActivity, getRecentActivities } from "@/lib/services/activity-log";
import type { ActivityEntry } from "@/lib/services/activity-log";

// ── localStorage mock ─────────────────────────────────────────────────────────

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
    key: vi.fn((_index: number): string | null => null),
    get length(): number {
      return Object.keys(store).length;
    },
  };
}

describe("activity-log service", () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    storageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, "localStorage", {
      value: storageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── recordActivity ──────────────────────────────────────────────────────────

  describe("recordActivity", () => {
    it("records a lesson_completed activity", () => {
      recordActivity("user1", "lesson_completed", {
        lessonTitle: "Intro",
        courseTitle: "Solana 101",
      });

      const activities = getRecentActivities("user1");
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("lesson_completed");
      expect(activities[0].meta.lessonTitle).toBe("Intro");
      expect(activities[0].meta.courseTitle).toBe("Solana 101");
    });

    it("records all activity types", () => {
      const types = [
        "lesson_completed",
        "course_completed",
        "course_enrolled",
        "achievement_earned",
        "streak_milestone",
      ] as const;

      for (const type of types) {
        recordActivity("user1", type, { test: "true" });
      }

      const activities = getRecentActivities("user1", 10);
      expect(activities).toHaveLength(5);
    });

    it("prepends new activities (newest first)", () => {
      recordActivity("user1", "lesson_completed", { order: "1" });
      recordActivity("user1", "course_enrolled", { order: "2" });
      recordActivity("user1", "achievement_earned", { order: "3" });

      const activities = getRecentActivities("user1");
      expect(activities[0].type).toBe("achievement_earned");
      expect(activities[1].type).toBe("course_enrolled");
      expect(activities[2].type).toBe("lesson_completed");
    });

    it("generates unique IDs for each activity", () => {
      recordActivity("user1", "lesson_completed", {});
      recordActivity("user1", "lesson_completed", {});

      const activities = getRecentActivities("user1");
      expect(activities[0].id).not.toBe(activities[1].id);
    });

    it("includes ISO timestamp on activities", () => {
      recordActivity("user1", "lesson_completed", {});

      const activities = getRecentActivities("user1");
      const ts = new Date(activities[0].timestamp);
      expect(ts.getTime()).not.toBeNaN();
    });

    it("caps activities at 50 entries", () => {
      for (let i = 0; i < 60; i++) {
        recordActivity("user1", "lesson_completed", { i: String(i) });
      }

      const all = getRecentActivities("user1", 100);
      expect(all).toHaveLength(50);
      // Newest should be last recorded
      expect(all[0].meta.i).toBe("59");
    });

    it("isolates activities by user ID", () => {
      recordActivity("user1", "lesson_completed", {});
      recordActivity("user2", "course_enrolled", {});

      expect(getRecentActivities("user1")).toHaveLength(1);
      expect(getRecentActivities("user2")).toHaveLength(1);
      expect(getRecentActivities("user1")[0].type).toBe("lesson_completed");
      expect(getRecentActivities("user2")[0].type).toBe("course_enrolled");
    });
  });

  // ── getRecentActivities ─────────────────────────────────────────────────────

  describe("getRecentActivities", () => {
    it("returns empty array for unknown user", () => {
      expect(getRecentActivities("unknown")).toEqual([]);
    });

    it("returns default limit of 10", () => {
      for (let i = 0; i < 15; i++) {
        recordActivity("user1", "lesson_completed", {});
      }

      const activities = getRecentActivities("user1");
      expect(activities).toHaveLength(10);
    });

    it("respects custom limit", () => {
      for (let i = 0; i < 10; i++) {
        recordActivity("user1", "lesson_completed", {});
      }

      expect(getRecentActivities("user1", 3)).toHaveLength(3);
      expect(getRecentActivities("user1", 1)).toHaveLength(1);
    });

    it("returns fewer than limit when not enough activities", () => {
      recordActivity("user1", "lesson_completed", {});

      expect(getRecentActivities("user1", 10)).toHaveLength(1);
    });

    it("handles corrupted localStorage gracefully", () => {
      storageMock.setItem("sta_activity:user1", "invalid-json{{{");

      const activities = getRecentActivities("user1");
      expect(activities).toEqual([]);
    });
  });

  // ── Persistence ─────────────────────────────────────────────────────────────

  describe("persistence", () => {
    it("persists to localStorage under correct key", () => {
      recordActivity("user1", "lesson_completed", {});

      expect(storageMock.setItem).toHaveBeenCalledWith(
        "sta_activity:user1",
        expect.any(String)
      );
    });

    it("stores valid JSON in localStorage", () => {
      recordActivity("user1", "course_enrolled", { slug: "test-course" });

      const stored = storageMock.getItem("sta_activity:user1");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!) as ActivityEntry[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe("course_enrolled");
      expect(parsed[0].meta.slug).toBe("test-course");
    });
  });
});
