/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the queries graph so the `server-only` module loads under vitest. */
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { DeploymentStatus } from "../deployments";
import { UNLISTED_COURSE_IDS, isUnlistedCourse } from "@/lib/courses/unlisted";
import {
  getAllCourses,
  getAllCourseTags,
  getAllCoursesIncludingUnlisted,
  getAllLearningPaths,
  getCourseBySlug,
  getRecommendedCourses,
} from "../queries";

/**
 * Course visibility is a CONTENT decision, not a code one (#1137).
 *
 * The predicate under test is `isCourseUnlisted` in ../queries.ts:
 * `c.unlisted === true || isUnlistedCourse(c._id)`. The first clause is the
 * new content flag (packages/content-schema/src/course.ts, carried through the
 * projector); the second is the outgoing hardcoded id set, kept only until the
 * content repo sets the flag and `content.lock` bumps (Part 2).
 *
 * Asserted against the REAL committed bundle (the entry-course-live pattern),
 * mocking only the on-chain sync gate so every course reads as synced+active.
 * Today's bundle carries no `unlisted: true` course, so the bundle exercises
 * the fallback half; the flag half is proven on doc shapes.
 */

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

const PILULA_ID = "course-pilula-solana-superteam";
const PILULA_SLUG = "pilula-solana-superteam";

/** Mirrors `isCourseUnlisted` (lib/content/queries.ts), which is not exported. */
const hidden = (c: { _id: string; unlisted?: unknown }) =>
  c.unlisted === true || isUnlistedCourse(c._id);

describe("the unlisted predicate — content flag OR the outgoing fallback", () => {
  it("hides a course the CONTENT flags, with no entry in the id set", () => {
    expect(hidden({ _id: "course-anything", unlisted: true })).toBe(true);
    expect(isUnlistedCourse("course-anything")).toBe(false);
  });

  it("still hides the one course the outgoing constant covers", () => {
    // The flag cannot be set until the content PR lands and content.lock
    // bumps; without this clause the Pílula would pop back into the catalog
    // the moment this PR deployed.
    expect(hidden({ _id: PILULA_ID })).toBe(true);
  });

  it("leaves a listed course alone, flag absent or explicitly false", () => {
    expect(hidden({ _id: "course-x" })).toBe(false);
    expect(hidden({ _id: "course-x", unlisted: false })).toBe(false);
  });

  it("every fallback id exists in the bundle — a stale entry is dead config", async () => {
    const all = await getAllCoursesIncludingUnlisted();
    const ids = new Set(all.map((c) => c._id));
    for (const id of UNLISTED_COURSE_IDS) {
      expect(ids.has(id), `unlisted id "${id}" not in the bundle`).toBe(true);
    }
  });
});

describe("unlisted courses — hidden from every listing surface", () => {
  it("the catalog listing excludes it; the admin listing keeps it", async () => {
    const listed = await getAllCourses();
    expect(listed.some((c) => c._id === PILULA_ID)).toBe(false);
    // And the filter didn't eat anything else.
    const admin = await getAllCoursesIncludingUnlisted();
    expect(admin.length).toBe(listed.length + UNLISTED_COURSE_IDS.size);
  });

  it("recommendations never surface it", async () => {
    const recommended = await getRecommendedCourses([]);
    expect(recommended.some((c) => c._id === PILULA_ID)).toBe(false);
  });

  it("the catalog filter chips never carry its tags", async () => {
    // The #1137 leak: getAllCourseTags had no listing filter, so an unlisted
    // course's skills became catalog filter chips — chips that then matched
    // nothing, because the course behind them is filtered out of the results.
    const tagged = await getAllCourseTags();
    expect(tagged.some((c) => c._id === PILULA_ID)).toBe(false);
  });

  it("no learning path surfaces it as a member", async () => {
    // A path is a listing surface too: hiding that held only on the catalog
    // tab would not be hiding. Green either way today — the Pílula belongs to
    // no path — so this is a guard for the day one joins, not a red-proof.
    const paths = await getAllLearningPaths();
    const members = paths.flatMap((p) => p.courses ?? []);
    expect(members.some((c) => c._id === PILULA_ID)).toBe(false);
  });
});

describe("unlisted is a listing property, not an access gate", () => {
  it("the direct link stays live — getCourseBySlug still resolves it", async () => {
    const course = await getCourseBySlug(PILULA_SLUG);
    expect(course?._id).toBe(PILULA_ID);
  });

  it("admin surfaces see it — an unlisted course must stay repairable", async () => {
    const admin = await getAllCoursesIncludingUnlisted();
    expect(admin.some((c) => c._id === PILULA_ID)).toBe(true);
  });
});
