/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the queries graph so the `server-only` module loads under vitest. */
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { DeploymentStatus } from "@/lib/content/deployments";
import {
  entryCourseForSegment,
  type LearnerSegment,
} from "@/lib/courses/learner-segment";
import {
  resolveEntryLessonHref,
  resolveFlagshipLessonHref,
} from "../entry-lesson";

/**
 * Regression guard for the entry-course routing table (companion to
 * entry-lesson.test.ts). That suite mocks `@/lib/content/queries` wholesale and
 * routes a synthetic `course-x`, so it passes no matter what real id
 * SEGMENT_ENTRY_COURSE holds — which is exactly how a table pointing at a
 * deactivated course (`solana-fundamentals` / `anchor-framework`, retired per
 * courses-academy CATALOG §3) shipped while every existing test stayed green.
 *
 * This suite instead runs the REAL resolver against the REAL committed content
 * bundle, mocking ONLY the on-chain sync gate so the courses read as
 * synced+active. If an entry id is absent from the bundle or has no lessons,
 * `resolveEntryLessonHref` yields the `/courses` fallback and these assertions
 * fail — the deep-link-is-dead signal the /start funnel needs.
 */

// Mark every course synced+active (the resolver only ever queries the entry
// courses) and leave the on-chain read inert so getCourseById needs no Supabase.
// A map-like with a `.get()` avoids referencing any hoisted import in the
// factory — isSynced only calls `.get()`.
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

const SEGMENTS: LearnerSegment[] = [1, 2, 3];
const LESSON_HREF = /^\/en\/courses\/[^/]+\/lessons\/[^/]+$/;

/**
 * The post-C1-flip routing table (#673, 2026-07-30). Duplicated here on purpose
 * — asserting the resolver against a literal expectation is what makes an
 * unintended table edit red. Segments 1/3 enter at C1 (the JS/TS on-ramp, live
 * on-chain since the flip wave); segment 2 still skips it and enters at C3.
 */
const EXPECTED_ENTRY: Record<LearnerSegment, string> = {
  1: "course-solana-for-web-devs",
  2: "course-building-first-program",
  3: "course-solana-for-web-devs",
};

// The 5 courses CATALOG §3 retires (deactivated on-chain). No segment may enter
// at one of these — this is the exact class that broke the /start deep-link.
const RETIRED_COURSE_IDS = new Set([
  "course-solana-fundamentals",
  "course-rust-for-solana",
  "course-anchor-framework",
  "course-solana-frontend",
  "course-defi-on-solana",
]);

describe("SEGMENT_ENTRY_COURSE — live-ladder routing", () => {
  it("segments 1 and 3 enter at C1, segment 2 at C3", () => {
    for (const segment of SEGMENTS) {
      expect(
        entryCourseForSegment(segment),
        `segment ${segment} entry course`
      ).toBe(EXPECTED_ENTRY[segment]);
    }
  });

  it("no segment enters at a retired course", () => {
    for (const segment of SEGMENTS) {
      const id = entryCourseForSegment(segment);
      expect(
        RETIRED_COURSE_IDS.has(id),
        `segment ${segment} entry "${id}" is a retired course`
      ).toBe(false);
    }
  });

  it("every segment entry deep-links to a real bundle lesson (not the catalog fallback)", async () => {
    for (const segment of SEGMENTS) {
      const id = entryCourseForSegment(segment);
      const href = await resolveEntryLessonHref("en", id);
      expect(
        href,
        `segment ${segment} → "${id}" fell back to the catalog`
      ).toMatch(LESSON_HREF);
    }
  });

  it("the flagship landing deep-link (segment 1) resolves to a real lesson", async () => {
    const href = await resolveFlagshipLessonHref("en");
    expect(href).not.toBe("/en/courses");
    expect(href).toMatch(LESSON_HREF);
  });
});
