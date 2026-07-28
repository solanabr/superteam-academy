import { describe, it, expect } from "vitest";
import { changedCourseDirs, changedCourseIds } from "../pr-files";

const COURSES = [
  { _id: "course-a", slug: "alpha" },
  { _id: "course-b", slug: "beta" },
];

describe("changedCourseDirs", () => {
  it("extracts and dedupes course dirs from changed paths", () => {
    const dirs = changedCourseDirs([
      "courses/alpha/course.yaml",
      "courses/alpha/lessons/one/intro.md",
      "courses/beta/slots.lock.json",
    ]);
    expect([...dirs].sort()).toEqual(["alpha", "beta"]);
  });

  it("ignores repo-root files, courses-root files, and _template", () => {
    const dirs = changedCourseDirs([
      "skills.yaml",
      "courses/README.md",
      "courses/CATALOG.md",
      "courses/_template/course.yaml",
      "paths/foo.yaml",
    ]);
    expect(dirs.size).toBe(0);
  });
});

describe("changedCourseIds", () => {
  it("maps every touched dir to its course id", () => {
    expect(changedCourseIds(COURSES, new Set(["alpha"]))).toEqual(["course-a"]);
  });

  it("returns [] (no filter) when the PR touches no course", () => {
    expect(changedCourseIds(COURSES, new Set())).toEqual([]);
  });

  // The fail-open contract: a dir we cannot match (rename, deletion, broken
  // dir==slug convention) must disable filtering, never hide courses.
  it("returns [] when ANY touched dir has no matching course", () => {
    expect(changedCourseIds(COURSES, new Set(["alpha", "deleted"]))).toEqual(
      []
    );
  });
});
