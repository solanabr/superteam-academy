import { describe, it, expect } from "vitest";
import { gate5aCheck } from "../checks/gate5a-xp";
import { emptyModel } from "../model";

function courseModel(xpPerLesson: number, lessonCount: number) {
  const model = emptyModel("/tmp");
  const lessons = Array.from({ length: lessonCount }, (_, i) => `lesson-l${i}`);
  model.courses.push({
    id: "course-x",
    dir: "courses/x",
    file: "courses/x/course.yaml",
    slotsPath: null,
    slotsLock: null,
    course: {
      xpPerLesson,
      modules: [{ key: "m", title: "M", lessons }],
    } as never,
  });
  return model;
}

describe("gate 5a — finalize XP invariant", () => {
  it("passes at the boundary (product exactly 10000)", () => {
    expect(gate5aCheck(courseModel(100, 100))).toEqual([]);
  });

  it("errors when xpPerLesson × lessonCount exceeds 10000", () => {
    const d = gate5aCheck(courseModel(100, 101));
    expect(d).toHaveLength(1);
    expect(d[0]!.gate).toBe("gate-5a");
  });
});
