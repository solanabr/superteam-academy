import { describe, it, expect } from "vitest";
import {
  deriveContinueTarget,
  findNextIncompleteLesson,
  type ContinueCourseInput,
  type ProgressEntry,
} from "../continue-learning";

function lesson(id: string) {
  return { _id: id, title: `Lesson ${id}`, slug: `slug-${id}` };
}

function course(
  courseId: string,
  lessonIds: string[],
  overrides: Partial<ContinueCourseInput> = {}
): ContinueCourseInput {
  return {
    courseId,
    title: `Course ${courseId}`,
    slug: `course-${courseId}`,
    enrolledAt: null,
    lessons: lessonIds.map(lesson),
    ...overrides,
  };
}

function done(
  courseId: string,
  lessonId: string,
  completedAt: string | null = null
): ProgressEntry {
  return { courseId, lessonId, completedAt };
}

describe("findNextIncompleteLesson", () => {
  const lessons = [lesson("l1"), lesson("l2"), lesson("l3")];

  it("returns the first lesson when nothing is complete", () => {
    expect(findNextIncompleteLesson(lessons, new Set())?._id).toBe("l1");
  });

  it("returns the first incomplete lesson in order, skipping completed holes", () => {
    // l1 and l3 done out of order — the next gap in display order is l2.
    expect(findNextIncompleteLesson(lessons, new Set(["l1", "l3"]))?._id).toBe(
      "l2"
    );
  });

  it("returns null when every lesson is complete", () => {
    expect(
      findNextIncompleteLesson(lessons, new Set(["l1", "l2", "l3"]))
    ).toBeNull();
  });

  it("returns null for an empty lesson list", () => {
    expect(findNextIncompleteLesson([], new Set())).toBeNull();
  });
});

describe("deriveContinueTarget", () => {
  it("returns null when there are no enrollments", () => {
    expect(deriveContinueTarget([], [])).toBeNull();
  });

  it("mid-course: targets the next incomplete lesson with correct counts", () => {
    const target = deriveContinueTarget(
      [course("a", ["l1", "l2", "l3"])],
      [done("a", "l1", "2026-07-01T10:00:00Z")]
    );
    expect(target).toEqual({
      kind: "lesson",
      courseId: "a",
      courseTitle: "Course a",
      courseSlug: "course-a",
      lesson: lesson("l2"),
      completedLessons: 1,
      totalLessons: 3,
    });
  });

  it("freshly enrolled course with zero progress targets its first lesson", () => {
    const target = deriveContinueTarget(
      [course("a", ["l1", "l2"], { enrolledAt: "2026-07-01T00:00:00Z" })],
      []
    );
    expect(target).toMatchObject({ kind: "lesson", lesson: lesson("l1") });
  });

  it("all enrolled courses complete → allComplete", () => {
    const target = deriveContinueTarget(
      [course("a", ["l1", "l2"])],
      [done("a", "l1"), done("a", "l2")]
    );
    expect(target).toEqual({ kind: "allComplete" });
  });

  it("multiple courses: picks the most recently active by last completion", () => {
    const target = deriveContinueTarget(
      [course("old", ["o1", "o2"]), course("new", ["n1", "n2"])],
      [
        done("old", "o1", "2026-07-01T10:00:00Z"),
        done("new", "n1", "2026-07-20T10:00:00Z"),
      ]
    );
    expect(target).toMatchObject({ kind: "lesson", courseId: "new" });
    expect(target).toMatchObject({ lesson: lesson("n2") });
  });

  it("a fresh enrollment outranks older progress (enrolledAt counts as activity)", () => {
    const target = deriveContinueTarget(
      [
        course("progressed", ["p1", "p2"]),
        course("fresh", ["f1"], { enrolledAt: "2026-07-24T09:00:00Z" }),
      ],
      [done("progressed", "p1", "2026-07-10T10:00:00Z")]
    );
    expect(target).toMatchObject({ kind: "lesson", courseId: "fresh" });
  });

  it("skips a fully-complete most-recent course in favor of an unfinished one", () => {
    const target = deriveContinueTarget(
      [course("doneCourse", ["d1"]), course("open", ["x1", "x2"])],
      [
        done("doneCourse", "d1", "2026-07-22T10:00:00Z"),
        done("open", "x1", "2026-07-02T10:00:00Z"),
      ]
    );
    expect(target).toMatchObject({ kind: "lesson", courseId: "open" });
  });

  it("certified (minted) courses are never a continue target but count for allComplete", () => {
    // Certified course has stale/no progress rows — still must not surface.
    expect(
      deriveContinueTarget([course("minted", ["m1"], { certified: true })], [])
    ).toEqual({ kind: "allComplete" });

    const target = deriveContinueTarget(
      [
        course("minted", ["m1"], {
          certified: true,
          enrolledAt: "2026-07-24T00:00:00Z",
        }),
        course("open", ["x1"]),
      ],
      []
    );
    expect(target).toMatchObject({ kind: "lesson", courseId: "open" });
  });

  it("ignores zero-lesson courses", () => {
    const target = deriveContinueTarget(
      [course("empty", [], { enrolledAt: "2026-07-24T00:00:00Z" })],
      []
    );
    expect(target).toEqual({ kind: "allComplete" });
  });

  it("counts completion against bundle lessons, not raw progress rows", () => {
    // A stale row for a removed lesson must not inflate the completed count.
    const target = deriveContinueTarget(
      [course("a", ["l1", "l2"])],
      [done("a", "l1"), done("a", "removed-lesson")]
    );
    expect(target).toMatchObject({
      kind: "lesson",
      completedLessons: 1,
      totalLessons: 2,
      lesson: lesson("l2"),
    });
  });

  it("tolerates malformed timestamps (treated as epoch 0)", () => {
    const target = deriveContinueTarget(
      [
        course("a", ["a1"], { enrolledAt: "not-a-date" }),
        course("b", ["b1"], { enrolledAt: "2026-07-01T00:00:00Z" }),
      ],
      []
    );
    expect(target).toMatchObject({ kind: "lesson", courseId: "b" });
  });
});
