import { describe, it, expect } from "vitest";
import {
  buildStatusMap,
  filterCatalogCourses,
  matchesStatus,
  type CatalogCourse,
  type CourseStatus,
} from "../catalog-filter";

const courses: CatalogCourse[] = [
  {
    _id: "c-intro",
    title: "Solana Intro",
    description: "Start here",
    difficulty: "beginner",
  },
  {
    _id: "c-anchor",
    title: "Anchor Programs",
    description: "Write a program",
    difficulty: "intermediate",
  },
  {
    _id: "c-defi",
    title: "DeFi Deep Dive",
    description: "Advanced Solana DeFi",
    difficulty: "advanced",
  },
];

const statuses = buildStatusMap(
  [
    { course_id: "c-intro", completed_at: "2026-08-01T00:00:00Z" },
    { course_id: "c-anchor", completed_at: null },
  ],
  []
);

const ids = (rows: CatalogCourse[]) => rows.map((c) => c._id);
const noFilters = {
  searchQuery: "",
  difficulty: null,
  status: null,
} as const;

describe("buildStatusMap", () => {
  it("classifies enrolled, completed and not-enrolled", () => {
    expect(statuses.get("c-intro")).toBe("completed");
    expect(statuses.get("c-anchor")).toBe("enrolled");
    expect(statuses.get("c-defi")).toBeUndefined();
  });

  it("treats a minted certificate as completion even without completed_at", () => {
    const map = buildStatusMap(
      [{ course_id: "c-anchor", completed_at: null }],
      ["c-anchor"]
    );
    expect(map.get("c-anchor")).toBe("completed");
  });

  it("is empty for an anonymous visitor", () => {
    expect(buildStatusMap([], []).size).toBe(0);
  });
});

describe("matchesStatus", () => {
  const cases: [
    CourseStatus | undefined,
    "enrolled" | "not-enrolled" | "completed",
    boolean,
  ][] = [
    ["enrolled", "enrolled", true],
    ["completed", "enrolled", false],
    [undefined, "enrolled", false],
    [undefined, "not-enrolled", true],
    ["enrolled", "not-enrolled", false],
    ["completed", "completed", true],
    ["enrolled", "completed", false],
  ];

  it.each(cases)("status %s under filter %s → %s", (status, filter, want) => {
    expect(matchesStatus(status, filter)).toBe(want);
  });

  it("passes everything when the rail is on All", () => {
    expect(matchesStatus(undefined, null)).toBe(true);
    expect(matchesStatus("completed", null)).toBe(true);
  });
});

describe("filterCatalogCourses", () => {
  it("returns everything with no filter active", () => {
    expect(ids(filterCatalogCourses(courses, noFilters, statuses))).toEqual([
      "c-intro",
      "c-anchor",
      "c-defi",
    ]);
  });

  it("ANDs difficulty with status", () => {
    expect(
      ids(
        filterCatalogCourses(
          courses,
          { ...noFilters, difficulty: "intermediate", status: "enrolled" },
          statuses
        )
      )
    ).toEqual(["c-anchor"]);

    expect(
      filterCatalogCourses(
        courses,
        { ...noFilters, difficulty: "beginner", status: "enrolled" },
        statuses
      )
    ).toHaveLength(0);
  });

  it("ANDs search with both rails", () => {
    expect(
      ids(
        filterCatalogCourses(
          courses,
          {
            searchQuery: "deep dive",
            difficulty: "advanced",
            status: "not-enrolled",
          },
          statuses
        )
      )
    ).toEqual(["c-defi"]);

    expect(
      filterCatalogCourses(
        courses,
        { searchQuery: "anchor", difficulty: "advanced", status: null },
        statuses
      )
    ).toHaveLength(0);
  });

  it("matches search against the description too, case-insensitively", () => {
    expect(
      ids(
        filterCatalogCourses(
          courses,
          { ...noFilters, searchQuery: "  WRITE a Program " },
          statuses
        )
      )
    ).toEqual(["c-anchor"]);
  });

  it("shows every course as not-enrolled when there is no session", () => {
    expect(
      ids(
        filterCatalogCourses(
          courses,
          { ...noFilters, status: "not-enrolled" },
          new Map()
        )
      )
    ).toEqual(["c-intro", "c-anchor", "c-defi"]);
  });
});
