/* eslint-disable import/order -- vi.mock must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({ getAllLearningPaths: vi.fn() }));
vi.mock("@/lib/content/queries", () => ({
  getAllLearningPaths: h.getAllLearningPaths,
}));

import { nextCourseAfter, isCourseTestOutEligible } from "../path-order";

// getAllLearningPaths already filters members through the synced+active gate, so
// a course appearing here is, by construction, live AND a path member.
function paths() {
  return [
    {
      _id: "path-flagship",
      courses: [
        { _id: "course-fundamentals" },
        { _id: "course-rust" },
        { _id: "course-anchor" },
      ],
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getAllLearningPaths.mockResolvedValue(paths());
});

describe("nextCourseAfter", () => {
  it("returns the next course in the path", async () => {
    expect(await nextCourseAfter("course-fundamentals")).toBe("course-rust");
    expect(await nextCourseAfter("course-rust")).toBe("course-anchor");
  });

  it("returns null for the last course and for a non-member", async () => {
    expect(await nextCourseAfter("course-anchor")).toBeNull();
    expect(await nextCourseAfter("course-defi")).toBeNull();
  });
});

describe("isCourseTestOutEligible", () => {
  it("is true for a live path member", async () => {
    expect(await isCourseTestOutEligible("course-fundamentals")).toBe(true);
    expect(await isCourseTestOutEligible("course-anchor")).toBe(true);
  });

  it("is false for a course in no path (standalone/held, e.g. defi #711)", async () => {
    expect(await isCourseTestOutEligible("course-defi")).toBe(false);
  });

  it("is false when a course drops out of the synced membership set", async () => {
    // An unsynced/deactivated course is not returned as a member.
    h.getAllLearningPaths.mockResolvedValue([
      { _id: "path-flagship", courses: [{ _id: "course-rust" }] },
    ]);
    expect(await isCourseTestOutEligible("course-fundamentals")).toBe(false);
  });
});
