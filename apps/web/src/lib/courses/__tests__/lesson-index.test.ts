import { describe, it, expect } from "vitest";
import { findLessonIndex } from "../lesson-index";

const course = {
  modules: [
    { lessons: [{ _id: "l1" }, { _id: "l2" }] },
    { lessons: [{ _id: "l3" }] },
  ],
};

describe("findLessonIndex", () => {
  it("returns the flattened, cross-module ordered index", () => {
    expect(findLessonIndex(course, "l1")).toBe(0);
    expect(findLessonIndex(course, "l2")).toBe(1);
    expect(findLessonIndex(course, "l3")).toBe(2); // continues across modules
  });

  it("returns -1 when the lesson is absent", () => {
    expect(findLessonIndex(course, "missing")).toBe(-1);
  });

  it("tolerates missing modules / lessons arrays", () => {
    expect(findLessonIndex({}, "l1")).toBe(-1);
    expect(findLessonIndex({ modules: [{}] }, "l1")).toBe(-1);
    expect(findLessonIndex({ modules: null }, "l1")).toBe(-1);
  });
});
