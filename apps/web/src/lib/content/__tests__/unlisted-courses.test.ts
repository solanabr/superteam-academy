/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the queries graph so the `server-only` module loads under vitest. */
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { DeploymentStatus } from "../deployments";
import { UNLISTED_COURSE_IDS, isUnlistedCourse } from "@/lib/courses/unlisted";
import {
  getAllCourses,
  getAllCoursesIncludingUnlisted,
  getCourseBySlug,
  getRecommendedCourses,
} from "../queries";
import { resolveHeroHref } from "@/lib/courses/entry-lesson";

/**
 * Unlisted = hidden from listings, reachable by direct link — asserted against
 * the REAL committed bundle (the entry-course-live pattern), mocking only the
 * on-chain sync gate so every course reads as synced+active. A course that is
 * both in UNLISTED_COURSE_IDS and absent from getAllCourses here is proven
 * hidden on every surface that lists through it (catalog, landing count,
 * sitemap); getCourseBySlug still resolving is what keeps the direct link —
 * and the landing hero that uses it — alive.
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

describe("unlisted courses — hidden from listings, live by direct link", () => {
  it("the Pílula course is registered as unlisted", () => {
    expect(isUnlistedCourse(PILULA_ID)).toBe(true);
  });

  it("every unlisted id exists in the bundle — a stale entry is dead config", async () => {
    const all = await getAllCoursesIncludingUnlisted();
    const ids = new Set(all.map((c) => c._id));
    for (const id of UNLISTED_COURSE_IDS) {
      expect(ids.has(id), `unlisted id "${id}" not in the bundle`).toBe(true);
    }
  });

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

  it("the direct link stays live — getCourseBySlug still resolves it", async () => {
    const course = await getCourseBySlug(PILULA_SLUG);
    expect(course?._id).toBe(PILULA_ID);
  });

  it("the landing hero does NOT promote it — it falls back to the flagship deep-link", async () => {
    // The homepage CTA is the biggest discovery surface of all; promoting a
    // course there while hiding it from the catalog would be the two halves
    // of the site contradicting each other. The QR/direct link keeps working
    // (previous test); only the hero PROMOTION falls back.
    const href = await resolveHeroHref("en");
    expect(href).not.toContain(PILULA_SLUG);
    expect(href).toMatch(/^\/en\/courses\/[^/]+\/lessons\/[^/]+$/);
  });
});
