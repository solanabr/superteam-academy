// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Course, LearningPath } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import type { PathCourseProgress } from "../learning-path-section";
import { PathsView } from "../paths-view";

function makeCourse(id: string, title: string): Course {
  return {
    _id: id,
    title,
    slug: id,
    description: `${title} description`,
    difficulty: "beginner",
    duration: 4,
    thumbnail: "/cover.png",
    tags: [],
    xpReward: 500,
    modules: [
      {
        key: "m1",
        title: "Module 1",
        lessons: [
          { _id: `${id}-l1`, title: "Lesson 1", slug: "l1", blocks: [] },
          { _id: `${id}-l2`, title: "Lesson 2", slug: "l2", blocks: [] },
        ],
      },
    ],
  };
}

const courseA = makeCourse("course-a", "Course Alpha");
const courseB = makeCourse("course-b", "Course Beta");
const courseC = makeCourse("course-c", "Course Gamma");
const courseD = makeCourse("course-d", "Course Delta");

function makePath(
  id: string,
  title: string,
  order: number,
  courses: Course[]
): LearningPath {
  return {
    _id: id,
    title,
    description: `${title} path`,
    slug: id,
    order,
    courses,
    difficulty: "beginner",
  };
}

// An empty path listed FIRST proves the start card skips course-less paths
// and targets the first course of the first path that has content.
const emptyPath = makePath("path-empty", "Empty Path", 0, []);
const mainPath = makePath("path-main", "Zero to Deployed", 1, [
  courseA,
  courseB,
  courseC,
]);
const secondPath = makePath("path-second", "Second Path", 2, [courseD]);

const ALL_PATHS = [emptyPath, mainPath, secondPath];

function renderPaths(
  props: Partial<Parameters<typeof PathsView>[0]> = {}
): ReturnType<typeof render> {
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <PathsView
        learningPaths={ALL_PATHS}
        progress={new Map<string, PathCourseProgress>()}
        {...props}
      />
    </NextIntlClientProvider>
  );
  return render(ui);
}

// The "start-here card" and "browse-all escape" suites lived here. Both
// features were removed in live UI sessions (31-07 and 02-08); the All Courses
// tab itself is the catalog escape now.

describe("PathsView — per-segment guidance modality", () => {
  it("defaults to the segment-1 presentation: sequenced steps stay clickable with a visible skip-ahead hint", () => {
    renderPaths();

    // Courses B and C both follow an incomplete predecessor, but the hint is
    // deduped to the FIRST ahead course per path (owner 2026-08-02); course D
    // opens its own path (index 0) → no hint.
    expect(screen.getAllByText("Skip ahead")).toHaveLength(1);
    // Still links — nothing is hard-locked for segment 1.
    expect(
      screen.getByRole("link", { name: /Course Beta/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Course Gamma/ })
    ).toBeInTheDocument();
  });

  it("segment 3 (beginner) renders the fixed-path modality: later courses lock until the previous completes", () => {
    renderPaths({ segment: 3 });

    expect(screen.queryByText("Skip ahead")).not.toBeInTheDocument();
    // Locked steps are not links.
    expect(
      screen.queryByRole("link", { name: /Course Beta/ })
    ).not.toBeInTheDocument();
    // The first course of each path stays reachable.
    expect(
      screen.getByRole("link", { name: /Course Delta/ })
    ).toBeInTheDocument();
  });

  it("segment 3 unlocks the next course once the previous one completes", () => {
    const progress = new Map<string, PathCourseProgress>([
      [
        "course-a",
        {
          courseId: "course-a",
          completedLessons: 2,
          totalLessons: 2,
          isCompleted: true,
          isEnrolled: true,
        },
      ],
    ]);
    renderPaths({ segment: 3, progress });

    expect(
      screen.getByRole("link", { name: /Course Beta/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Course Gamma/ })
    ).not.toBeInTheDocument();
  });

  it("segment 2 (web3 dev) renders open access: every course is a link, no locks, no skip hints", () => {
    renderPaths({ segment: 2 });

    expect(screen.queryByText("Skip ahead")).not.toBeInTheDocument();
    for (const name of [
      /Course Alpha/,
      /Course Beta/,
      /Course Gamma/,
      /Course Delta/,
    ]) {
      expect(screen.getAllByRole("link", { name }).length).toBeGreaterThan(0);
    }
  });
});

describe("PathsView — content-agnostic rendering", () => {
  it("renders an empty state when the bundle provides no populated paths", () => {
    renderPaths({ learningPaths: [emptyPath] });

    expect(screen.getByText("No courses available")).toBeInTheDocument();
    expect(screen.queryByText("Start here")).not.toBeInTheDocument();
  });

  it("renders every populated path as a sequenced section", () => {
    renderPaths();

    expect(screen.getByText("Zero to Deployed")).toBeInTheDocument();
    expect(screen.getByText("Second Path")).toBeInTheDocument();
    expect(screen.queryByText("Empty Path")).not.toBeInTheDocument();
  });

  // #627 — `draft` and `retired` are authoring/lint lifecycle flags, not runtime
  // switches. The compiler spreads a path doc verbatim into the bundle, so both
  // fields ride along, but LearningPath declares neither and no consumer reads
  // them: visibility is decided by `courses.length` alone. This pins that a
  // `retired` path is hidden for exactly the same reason a `draft` one is —
  // it is empty — and that a flagged-but-populated path still renders.
  it("ignores the draft/retired lifecycle flags — visibility is courses-only", () => {
    const withFlags = (p: LearningPath, flags: Record<string, boolean>) =>
      ({ ...p, ...flags }) as LearningPath;

    renderPaths({
      learningPaths: [
        withFlags(emptyPath, { retired: true }),
        withFlags(mainPath, { draft: true, retired: true }),
      ],
    });

    expect(screen.getByText("Zero to Deployed")).toBeInTheDocument();
    expect(screen.queryByText("Empty Path")).not.toBeInTheDocument();
  });
});
