/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the queries graph so the `server-only` module loads under vitest. */
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { DeploymentStatus } from "@/lib/content/deployments";
import {
  SEGMENT_ENTRY_COURSE,
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
 * academy-courses CATALOG §3) shipped while every existing test stayed green.
 *
 * This suite instead runs the REAL resolver against the REAL committed content
 * bundle, mocking ONLY the on-chain sync gate so the courses read as
 * synced+active. If an entry id is absent from the bundle or has no lessons,
 * `resolveEntryLessonHref` yields the `/courses` fallback and these assertions
 * fail — the deep-link-is-dead signal the /start funnel needs. It did exactly
 * that mid-way through the alpha bump (bundle swapped, table still on C1),
 * which is what the retarget below resolves.
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
    getDeploymentByIdSafe: vi.fn(async () => ({ row: null, failed: false })),
  };
});

const SEGMENTS: LearnerSegment[] = [1, 2, 3];
const LESSON_HREF = /^\/en\/courses\/[^/]+\/lessons\/[^/]+$/;

/**
 * The event routing table (2026-08-13). Duplicated here on purpose —
 * asserting the resolver against a literal expectation is what makes an
 * unintended table edit red. Every segment enters at the Solana Speedrun for
 * the Superteam Brasil in-person event (see the EVENT note in
 * learner-segment.ts); revert alongside that constant when the event ends.
 */
const EXPECTED_ENTRY: Record<LearnerSegment, string> = {
  1: "course-solana-speedrun",
  2: "course-solana-speedrun",
  3: "course-solana-speedrun",
};

// Courses no longer in the bundle: the 5 CATALOG §3 retires (deactivated
// on-chain) plus the track-1 ladder + EVM elective parked under `_draft/` in
// the alpha wave. No segment may enter at one of these — this is the exact
// class that broke the /start deep-link.
const RETIRED_COURSE_IDS = new Set([
  "course-solana-fundamentals",
  "course-rust-for-solana",
  "course-anchor-framework",
  "course-solana-frontend",
  "course-defi-on-solana",
  "course-solana-for-web-devs",
  "course-rust-for-program-devs",
  "course-building-first-program",
  "course-dapp-sdk-kit",
  "course-stablecoin-payments",
  "course-solana-for-evm-devs",
]);

describe("SEGMENT_ENTRY_COURSE — live-ladder routing", () => {
  it("every segment enters at the event speedrun course", () => {
    for (const segment of SEGMENTS) {
      expect(
        SEGMENT_ENTRY_COURSE[segment],
        `segment ${segment} entry course`
      ).toBe(EXPECTED_ENTRY[segment]);
    }
  });

  it("no segment enters at a retired course", () => {
    for (const segment of SEGMENTS) {
      const id = SEGMENT_ENTRY_COURSE[segment];
      expect(
        RETIRED_COURSE_IDS.has(id),
        `segment ${segment} entry "${id}" is a retired course`
      ).toBe(false);
    }
  });

  it("every segment entry deep-links to a real bundle lesson (not the catalog fallback)", async () => {
    for (const segment of SEGMENTS) {
      const id = SEGMENT_ENTRY_COURSE[segment];
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
