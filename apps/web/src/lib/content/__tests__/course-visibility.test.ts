/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the queries graph so the `server-only` module loads under vitest. */
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { DeploymentStatus } from "../deployments";
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
 * `c.unlisted === true`. No course in today's bundle sets it, so the Pílula —
 * a real, synced, single-lesson course that used to be hidden by the constant —
 * is now public everywhere the catalog reaches.
 *
 * Asserted against the REAL committed bundle (the entry-course-live pattern),
 * mocking only the on-chain sync gate so every course reads as synced+active.
 * The content-flag mechanism is proven by INJECTING a synthetic `unlisted: true`
 * course into the store maps and watching every listing surface drop it while
 * the admin surface keeps it.
 */

const PILULA_ID = "course-pilula-solana-superteam";
const PILULA_SLUG = "pilula-solana-superteam";

// A synthetic clone of the Pílula doc, flagged unlisted with a distinct id/slug,
// injected into the store so the flag path runs end-to-end through the real
// surfaces. Built from the actual bundle doc inside the store mock below.
const HIDDEN_ID = "course-synthetic-unlisted";
const HIDDEN_SLUG = "synthetic-unlisted";

vi.mock("@/lib/content/store", async (importActual) => {
  // Literals repeated (not the module consts) — this factory is hoisted above
  // every top-level binding in the file.
  const actual = await importActual<typeof import("@/lib/content/store")>();
  const pilula = actual.coursesById.get("course-pilula-solana-superteam");
  if (!pilula) throw new Error("test fixture missing the Pílula course");

  const hidden: CourseDoc = {
    ...pilula,
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

describe("the Pílula is public — no flag, no hiding", () => {
  it("appears in the catalog listing", async () => {
    const listed = await getAllCourses();
    expect(listed.some((c) => c._id === PILULA_ID)).toBe(true);
  });

  it("appears in recommendations", async () => {
    const recommended = await getRecommendedCourses([]);
    expect(recommended.some((c) => c._id === PILULA_ID)).toBe(true);
  });

  it("its tags rejoin the catalog filter chips", async () => {
    const tagged = await getAllCourseTags();
    expect(tagged.some((c) => c._id === PILULA_ID)).toBe(true);
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
});

describe("unlisted is a listing property, not an access gate", () => {
  it("the Pílula direct link resolves", async () => {
    const course = await getCourseBySlug(PILULA_SLUG);
    expect(course?._id).toBe(PILULA_ID);
  });

  it("an unlisted course's direct link still resolves", async () => {
    const course = await getCourseBySlug(HIDDEN_SLUG);
    expect(course?._id).toBe(HIDDEN_ID);
  });
});
