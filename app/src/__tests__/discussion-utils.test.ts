import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  generateId,
  getUserName,
  formatCommentDate,
  loadComments,
  saveComments,
  countComments,
  SEED_COMMENTS,
} from "@/components/course/discussion-utils";
import type { Comment } from "@/components/course/discussion-utils";

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

describe("discussion-utils", () => {
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

  // ── generateId ──────────────────────────────────────────────────────────────

  describe("generateId", () => {
    it("generates a string ID", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("generates unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it("contains timestamp component", () => {
      const id = generateId();
      const timestamp = parseInt(id.split("-")[0], 10);
      expect(timestamp).toBeGreaterThan(Date.now() - 1000);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  // ── getUserName ─────────────────────────────────────────────────────────────

  describe("getUserName", () => {
    it("returns 'Anonymous Learner' when no profile exists", () => {
      expect(getUserName()).toBe("Anonymous Learner");
    });

    it("returns display name from stored profile", () => {
      storageMock.setItem(
        "sta-profile",
        JSON.stringify({ displayName: "Alice" })
      );
      expect(getUserName()).toBe("Alice");
    });

    it("returns 'Anonymous Learner' when profile has no displayName", () => {
      storageMock.setItem("sta-profile", JSON.stringify({ bio: "test" }));
      expect(getUserName()).toBe("Anonymous Learner");
    });

    it("returns 'Anonymous Learner' on corrupted profile data", () => {
      storageMock.setItem("sta-profile", "not-json");
      expect(getUserName()).toBe("Anonymous Learner");
    });
  });

  // ── formatCommentDate ───────────────────────────────────────────────────────

  describe("formatCommentDate", () => {
    it("returns 'Just now' for very recent dates", () => {
      const now = new Date().toISOString();
      expect(formatCommentDate(now)).toBe("Just now");
    });

    it("returns minutes ago for times under an hour", () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      expect(formatCommentDate(fiveMinAgo)).toBe("5m ago");
    });

    it("returns hours ago for times under a day", () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
      expect(formatCommentDate(threeHoursAgo)).toBe("3h ago");
    });

    it("returns 'Yesterday' for times 1 day ago", () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60_000).toISOString();
      expect(formatCommentDate(yesterday)).toBe("Yesterday");
    });

    it("returns days ago for times under a week", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
      expect(formatCommentDate(threeDaysAgo)).toBe("3d ago");
    });

    it("returns weeks ago for times under a month", () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString();
      expect(formatCommentDate(twoWeeksAgo)).toBe("2w ago");
    });

    it("returns months ago for times over a month", () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60_000).toISOString();
      expect(formatCommentDate(twoMonthsAgo)).toBe("2mo ago");
    });

    it("returns formatted date for times over a year ago", () => {
      const twoYearsAgo = new Date(Date.now() - 400 * 24 * 60 * 60_000).toISOString();
      const result = formatCommentDate(twoYearsAgo);
      // Should be a locale date string like "12/25/2024"
      expect(result).toMatch(/\d/);
      expect(result).not.toContain("ago");
    });
  });

  // ── loadComments / saveComments ─────────────────────────────────────────────

  describe("loadComments", () => {
    it("returns seed comments when localStorage is empty", () => {
      const comments = loadComments("test-course");
      expect(comments).toBe(SEED_COMMENTS);
    });

    it("returns saved comments from localStorage", () => {
      const custom: Comment[] = [
        {
          id: "c1",
          author: "Test User",
          content: "Hello",
          createdAt: new Date().toISOString(),
          replies: [],
        },
      ];
      saveComments("test-course", custom);

      const loaded = loadComments("test-course");
      expect(loaded).toHaveLength(1);
      expect(loaded[0].author).toBe("Test User");
    });

    it("returns seed comments on corrupted localStorage", () => {
      storageMock.setItem("sta_discussions:test-course", "bad-json");

      const comments = loadComments("test-course");
      expect(comments).toBe(SEED_COMMENTS);
    });

    it("returns seed comments when stored array is empty", () => {
      storageMock.setItem("sta_discussions:test-course", "[]");

      const comments = loadComments("test-course");
      expect(comments).toBe(SEED_COMMENTS);
    });

    it("isolates comments by course slug", () => {
      const course1: Comment[] = [
        { id: "1", author: "A", content: "Course 1", createdAt: "", replies: [] },
      ];
      const course2: Comment[] = [
        { id: "2", author: "B", content: "Course 2", createdAt: "", replies: [] },
      ];
      saveComments("course-1", course1);
      saveComments("course-2", course2);

      expect(loadComments("course-1")[0].content).toBe("Course 1");
      expect(loadComments("course-2")[0].content).toBe("Course 2");
    });
  });

  describe("saveComments", () => {
    it("persists comments to correct localStorage key", () => {
      const comments: Comment[] = [
        { id: "1", author: "A", content: "Hi", createdAt: "", replies: [] },
      ];
      saveComments("my-course", comments);

      expect(storageMock.setItem).toHaveBeenCalledWith(
        "sta_discussions:my-course",
        expect.any(String)
      );
    });
  });

  // ── countComments ───────────────────────────────────────────────────────────

  describe("countComments", () => {
    it("returns 0 for empty array", () => {
      expect(countComments([])).toBe(0);
    });

    it("counts top-level comments", () => {
      const comments: Comment[] = [
        { id: "1", author: "A", content: "1", createdAt: "", replies: [] },
        { id: "2", author: "B", content: "2", createdAt: "", replies: [] },
        { id: "3", author: "C", content: "3", createdAt: "", replies: [] },
      ];
      expect(countComments(comments)).toBe(3);
    });

    it("counts nested replies", () => {
      const comments: Comment[] = [
        {
          id: "1",
          author: "A",
          content: "Parent",
          createdAt: "",
          replies: [
            {
              id: "1r1",
              author: "B",
              content: "Reply 1",
              createdAt: "",
              replies: [],
            },
            {
              id: "1r2",
              author: "C",
              content: "Reply 2",
              createdAt: "",
              replies: [],
            },
          ],
        },
      ];
      expect(countComments(comments)).toBe(3);
    });

    it("counts deeply nested replies", () => {
      const comments: Comment[] = [
        {
          id: "1",
          author: "A",
          content: "L1",
          createdAt: "",
          replies: [
            {
              id: "2",
              author: "B",
              content: "L2",
              createdAt: "",
              replies: [
                {
                  id: "3",
                  author: "C",
                  content: "L3",
                  createdAt: "",
                  replies: [],
                },
              ],
            },
          ],
        },
      ];
      expect(countComments(comments)).toBe(3);
    });

    it("correctly counts seed comments", () => {
      // SEED_COMMENTS has 3 top-level + 2 replies on first + 1 reply on second = 6
      expect(countComments(SEED_COMMENTS)).toBe(6);
    });
  });
});
