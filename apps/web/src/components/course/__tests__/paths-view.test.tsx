// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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
        onBrowseAll={() => undefined}
        {...props}
      />
    </NextIntlClientProvider>
  );
  return render(ui);
}

describe("PathsView — start-here card", () => {
  it("renders exactly one start-here card, targeting the first course of the first non-empty path", () => {
    renderPaths();

    const badges = screen.getAllByText("Start here");
    expect(badges).toHaveLength(1);

    const card = screen.getByRole("region", { name: "Course Alpha" });
    expect(
      within(card).getByRole("heading", { name: "Course Alpha" })
    ).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: /Start Course/ })
    ).toHaveAttribute("href", "/en/courses/course-a");
  });

  it("switches the CTA to Continue when the learner is mid-course", () => {
    const progress = new Map<string, PathCourseProgress>([
      [
        "course-a",
        {
          courseId: "course-a",
          completedLessons: 1,
          totalLessons: 2,
          isCompleted: false,
          isEnrolled: true,
        },
      ],
    ]);
    renderPaths({ progress });

    const card = screen.getByRole("region", { name: "Course Alpha" });
    expect(
      within(card).getByRole("link", { name: /Continue Learning/ })
    ).toHaveAttribute("href", "/en/courses/course-a");
  });
});

describe("PathsView — browse-all escape", () => {
  it("is always present and hands control back to the catalog", () => {
    const onBrowseAll = vi.fn();
    renderPaths({ onBrowseAll });

    const button = screen.getByRole("button", { name: /Browse all courses/ });
    fireEvent.click(button);
    expect(onBrowseAll).toHaveBeenCalledTimes(1);
  });
});

describe("PathsView — per-segment guidance modality", () => {
  it("defaults to the segment-1 presentation: sequenced steps stay clickable with a visible skip-ahead hint", () => {
    renderPaths();

    expect(
      screen.getByText(/recommended order — skip ahead/)
    ).toBeInTheDocument();
    // Courses B and C follow an incomplete predecessor → skip-ahead hints;
    // course D opens its own path (index 0) → no hint.
    expect(screen.getAllByText("Skip ahead")).toHaveLength(2);
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

    expect(screen.getByText(/Follow the path in order/)).toBeInTheDocument();
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

    expect(screen.getByText(/order is a recommendation/)).toBeInTheDocument();
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
