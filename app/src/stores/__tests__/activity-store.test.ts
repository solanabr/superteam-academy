import { describe, it, expect, beforeEach } from "vitest";
import { useActivityStore } from "../activity-store";

function getStore() {
  return useActivityStore.getState();
}

function resetStore() {
  useActivityStore.setState({ activities: [] });
}

describe("activity-store", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("addActivity", () => {
    it("creates an activity with a generated id", () => {
      const added = getStore().addActivity({ type: "lesson_completed" });
      expect(typeof added.id).toBe("string");
      expect(added.id.length).toBeGreaterThan(0);
    });

    it("creates an activity with a timestamp", () => {
      const before = Date.now();
      const added = getStore().addActivity({ type: "lesson_completed" });
      const after = Date.now();
      expect(added.timestamp).toBeGreaterThanOrEqual(before);
      expect(added.timestamp).toBeLessThanOrEqual(after);
    });

    it("persists the activity in the store", () => {
      getStore().addActivity({ type: "course_enrolled", courseId: "course-1" });
      expect(getStore().activities).toHaveLength(1);
      expect(getStore().activities[0].courseId).toBe("course-1");
    });

    it("prepends new activities (newest first)", () => {
      getStore().addActivity({ type: "lesson_completed", courseId: "course-1" });
      getStore().addActivity({ type: "course_enrolled", courseId: "course-2" });
      expect(getStore().activities[0].courseId).toBe("course-2");
      expect(getStore().activities[1].courseId).toBe("course-1");
    });

    it("returns the newly created activity object", () => {
      const activity = getStore().addActivity({
        type: "achievement_earned",
        xpEarned: 50,
      });
      expect(activity.type).toBe("achievement_earned");
      expect(activity.xpEarned).toBe(50);
    });

    it("returns the same activity that is stored", () => {
      const returned = getStore().addActivity({ type: "lesson_completed" });
      const stored = getStore().activities[0];
      expect(stored.id).toBe(returned.id);
      expect(stored.timestamp).toBe(returned.timestamp);
    });

    it("gives each activity a unique id", () => {
      getStore().addActivity({ type: "lesson_completed" });
      getStore().addActivity({ type: "lesson_completed" });
      const [a, b] = getStore().activities;
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("addActivity caps at 50 entries", () => {
    it("does not exceed 50 activities", () => {
      for (let i = 0; i < 55; i++) {
        getStore().addActivity({ type: "lesson_completed", courseId: `course-${i}` });
      }
      expect(getStore().activities).toHaveLength(50);
    });

    it("keeps the 50 most recent entries (drops oldest)", () => {
      for (let i = 0; i < 55; i++) {
        getStore().addActivity({ type: "lesson_completed", courseId: `course-${i}` });
      }
      // Most recent is course-54, oldest retained is course-5, course-0..4 dropped
      expect(getStore().activities[0].courseId).toBe("course-54");
      expect(getStore().activities[49].courseId).toBe("course-5");
    });
  });

  describe("removeActivityById", () => {
    it("removes the activity with the matching id", () => {
      const a = getStore().addActivity({ type: "lesson_completed" });
      const b = getStore().addActivity({ type: "course_enrolled" });
      getStore().removeActivityById(a.id);
      const ids = getStore().activities.map((x) => x.id);
      expect(ids).not.toContain(a.id);
      expect(ids).toContain(b.id);
    });

    it("is a no-op for a nonexistent id", () => {
      getStore().addActivity({ type: "lesson_completed" });
      getStore().removeActivityById("nonexistent-id");
      expect(getStore().activities).toHaveLength(1);
    });

    it("results in an empty list when the only activity is removed", () => {
      const a = getStore().addActivity({ type: "lesson_completed" });
      getStore().removeActivityById(a.id);
      expect(getStore().activities).toHaveLength(0);
    });

    it("does not mutate other activities when removing one", () => {
      getStore().addActivity({ type: "lesson_completed", courseId: "c1" });
      const b = getStore().addActivity({ type: "course_enrolled", courseId: "c2" });
      const c = getStore().addActivity({ type: "course_completed", courseId: "c3" });
      getStore().removeActivityById(b.id);
      expect(getStore().activities).toHaveLength(2);
      expect(getStore().activities[0].id).toBe(c.id);
      expect(getStore().activities[1].courseId).toBe("c1");
    });
  });
});
