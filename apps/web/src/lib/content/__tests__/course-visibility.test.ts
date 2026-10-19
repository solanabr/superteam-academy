/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the queries graph so the `server-only` module loads under vitest. */
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { DeploymentStatus } from "../deployments";
import { coursesById } from "../store";
import type { CourseDoc } from "../types";
import {
  getAllCourses,
  getAllCourseTags,
  getAllCoursesIncludingUnlisted,
  getCourseBySlug,
  getRecommendedCourses,
} from "../queries";

/**
 * Course visibility is a CONTENT decision, not a code one (#1137, Part 2).
 *
 * The last hardcoded course-visibility constant (lib/courses/unlisted.ts) is
 * gone. The only thing that hides a course from discovery now is the `unlisted`
 * flag on its content doc, read by `isCourseUnlisted` in ../queries.ts as
 * `c.unlisted === true`.
 *
 * Asserted against the REAL committed bundle, mocking only the on-chain sync
 * gate so every course reads as synced+active, and without naming any course:
 * whatever content.lock pins, every course that does not set the flag is
 * public. The flag itself is proven by INJECTING a synthetic `unlisted: true`
 * clone of a bundle course and watching every listing surface drop it while
 * the admin surface keeps it.
 */

const HIDDEN_ID = "course-synthetic-unlisted";
const HIDDEN_SLUG = "synthetic-unlisted";

vi.mock("@/lib/content/store", async (importActual) => {
  // Literals repeated (not the module consts) — this factory is hoisted above
  // every top-level binding in the file.
  const actual = await importActual<typeof import("@/lib/content/store")>();
  const [first] = actual.coursesById.values();
  if (!first) throw new Error("the committed bundle has no course to clone");

  const hidden: CourseDoc = {
    ...first,
    _id: "course-synthetic-unlisted",
    unlisted: true,
    slug: { _type: "slug", current: "synthetic-unlisted" },
    // Distinct tags so we can prove they never reach the filter chips.
    tags: ["synthetic-unlisted-tag"],
  };

  const coursesById = new Map(actual.coursesById);
  coursesById.set(hidden._id, hidden);
  const coursesBySlug = new Map(actual.coursesBySlug);
  coursesBySlug.set(hidden.slug.current, hidden);

  return { ...actual, coursesById, coursesBySlug };
});

vi.mock("@/lib/content/deployments", async (importActual) => {
  const actual =
    await importActual<typeof import("@/lib/content/deployments")>();
  const synced = (id: string): DeploymentStatus =>
    ({
      content_id: id,
      kind: "course",
      status: "synced",
      is_active: true,
      achievement_pda: null,
    }) as DeploymentStatus;
  return {
    ...actual,
    getActiveDeployments: vi.fn(
      async () =>
        ({ get: (id: string) => synced(id) }) as unknown as ReadonlyMap<
          string,
          DeploymentStatus
        >
    ),
    getDeploymentById: vi.fn(async () => null),
    getDeploymentByIdSafe: vi.fn(async () => null),
  };
});

/** Every bundle course that does not set the flag (the synthetic one does). */
const publicIds = (also: (c: CourseDoc) => boolean = () => true) =>
  [...coursesById.values()]
    .filter((c) => c.unlisted !== true && also(c))
    .map((c) => c._id)
    .sort();
const ids = (cs: { _id: string }[]) => cs.map((c) => c._id).sort();

describe("every course without the flag is public", () => {
  it("appears in the catalog listing", async () => {
    expect(ids(await getAllCourses())).toEqual(publicIds());
  });

  it("appears in recommendations", async () => {
    expect(ids(await getRecommendedCourses([]))).toEqual(publicIds());
  });

  it("contributes its tags to the catalog filter chips", async () => {
    expect(ids(await getAllCourseTags())).toEqual(
      publicIds((c) => Array.isArray(c.tags))
    );
  });

  it("resolves by direct link", async () => {
    for (const course of coursesById.values()) {
      const resolved = await getCourseBySlug(course.slug.current);
      expect(resolved?._id, course._id).toBe(course._id);
    }
  });
});

describe("the content flag still hides — a synthetic unlisted course", () => {
  it("is dropped from the catalog listing but kept for admin", async () => {
    const listed = await getAllCourses();
    expect(listed.some((c) => c._id === HIDDEN_ID)).toBe(false);

    const admin = await getAllCoursesIncludingUnlisted();
    expect(admin.some((c) => c._id === HIDDEN_ID)).toBe(true);
  });

  it("never surfaces in recommendations", async () => {
    const recommended = await getRecommendedCourses([]);
    expect(recommended.some((c) => c._id === HIDDEN_ID)).toBe(false);
  });

  it("keeps its tags out of the catalog filter chips", async () => {
    const tagged = await getAllCourseTags();
    expect(tagged.some((c) => c._id === HIDDEN_ID)).toBe(false);
    expect(tagged.some((c) => c.tags.includes("synthetic-unlisted-tag"))).toBe(
      false
    );
  });

  it("still resolves by direct link — unlisted is not an access gate", async () => {
    const course = await getCourseBySlug(HIDDEN_SLUG);
    expect(course?._id).toBe(HIDDEN_ID);
  });
});
