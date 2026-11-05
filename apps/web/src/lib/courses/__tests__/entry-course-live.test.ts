/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the queries graph so the `server-only` module loads under vitest. */
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { DeploymentStatus } from "@/lib/content/deployments";
import { availableLocales, docSourceLocale } from "@/lib/content/localize";
import { getCourseLessons } from "@/lib/content/queries";
import { coursesById, l10nByCourseId } from "@/lib/content/store";
import {
  DEFAULT_SEGMENT,
  entryCourseFor,
  type LearnerSegment,
} from "@/lib/courses/learner-segment";
import { locales, type Locale } from "@/lib/i18n/config";
import {
  resolveEntryLessonHref,
  resolveFlagshipLessonHref,
} from "../entry-lesson";

/**
 * Regression guard for the entry-course routing table (companion to
 * entry-lesson.test.ts). That suite mocks `@/lib/content/queries` wholesale and
 * routes a synthetic `course-x`, so it passes no matter what real id the table
 * holds — which is exactly how a table pointing at a deactivated course
 * (`solana-fundamentals` / `anchor-framework`, retired per academy-courses
 * CATALOG §3) shipped while every existing test stayed green.
 *
 * This suite instead runs the REAL resolver against the REAL committed content
 * bundle, mocking ONLY the on-chain sync gate so the courses read as
 * synced+active. If an entry id is absent from the bundle or has no lessons,
 * `resolveEntryLessonHref` yields the `/courses` fallback and these assertions
 * fail — the deep-link-is-dead signal the /start funnel needs. A content
 * release that drops a translation an entry relies on goes red here too.
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

/**
 * The routing table. Duplicated here on purpose — asserting the resolver
 * against a literal expectation is what makes an unintended table edit red.
 * The reasoning per cell lives next to the table in learner-segment.ts.
 */
const EXPECTED_ENTRY: Record<Locale, Record<LearnerSegment, string | null>> = {
  "pt-BR": {
    1: "course-intro-web3-blockchain",
    2: "course-digital-assets",
    3: "course-intro-web3-blockchain",
  },
  en: {
    1: "course-btc-to-sol-evolution",
    2: "course-digital-assets",
    3: "course-visao-geral-solana",
  },
  es: {
    1: "course-rust-ts-fundamentals",
    2: "course-digital-assets",
    3: null,
  },
};

/** Every locale/segment pair that routes to a course rather than the catalog. */
const ROUTED = locales.flatMap((locale) =>
  SEGMENTS.flatMap((segment) => {
    const courseId = entryCourseFor(segment, locale);
    return courseId ? [{ locale, segment, courseId }] : [];
  })
);

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

describe("entry routing — live bundle", () => {
  it("matches the agreed table for every locale and segment", () => {
    for (const locale of locales) {
      for (const segment of SEGMENTS) {
        expect(
          entryCourseFor(segment, locale),
          `${locale} segment ${segment} entry course`
        ).toBe(EXPECTED_ENTRY[locale][segment]);
      }
    }
  });

  it("no longer sends anyone to the 13-08-2026 event course", () => {
    for (const { locale, segment, courseId } of ROUTED) {
      expect(courseId, `${locale} segment ${segment}`).not.toBe(
        "course-solana-speedrun"
      );
    }
  });

  it("no segment enters at a retired course", () => {
    for (const { locale, segment, courseId } of ROUTED) {
      expect(
        RETIRED_COURSE_IDS.has(courseId),
        `${locale} segment ${segment} entry "${courseId}" is a retired course`
      ).toBe(false);
    }
  });

  it("every entry deep-links to a real bundle lesson (not the catalog fallback)", async () => {
    for (const { locale, segment, courseId } of ROUTED) {
      const href = await resolveEntryLessonHref(locale, courseId);
      expect(
        href,
        `${locale} segment ${segment} → "${courseId}" fell back to the catalog`
      ).toMatch(new RegExp(`^/${locale}/courses/[^/]+/lessons/[^/]+$`));
    }
  });

  it("an entry is a course the visitor's locale can actually read", () => {
    for (const { locale, segment, courseId } of ROUTED) {
      const doc = coursesById.get(courseId);
      expect(doc, `${courseId} is not in the bundle`).toBeDefined();
      expect(
        availableLocales(docSourceLocale(doc!), l10nByCourseId.get(courseId)),
        `${locale} segment ${segment} → "${courseId}" renders in another language`
      ).toContain(locale);
    }
  });

  it("a translated entry has every lesson translated, not just the course card", async () => {
    for (const { locale, courseId } of ROUTED) {
      const doc = coursesById.get(courseId)!;
      if (docSourceLocale(doc) === locale) continue;
      const slug = (doc.slug as { current: string }).current;
      const lessons = await getCourseLessons(slug);
      const overlay = l10nByCourseId.get(courseId)?.[locale]?.lessons ?? {};
      expect(lessons.length).toBeGreaterThan(0);
      for (const lesson of lessons) {
        expect(
          overlay[lesson._id],
          `${courseId} lesson ${lesson._id} has no ${locale} translation`
        ).toBeDefined();
      }
    }
  });

  it("the locale with no fitting course sends that segment to its catalog", async () => {
    expect(entryCourseFor(3, "es")).toBeNull();
    await expect(
      resolveEntryLessonHref("es", entryCourseFor(3, "es"))
    ).resolves.toBe("/es/courses");
  });

  it("the landing deep-link follows the default segment's entry per locale", async () => {
    const heroSlug: Record<Locale, string> = {
      "pt-BR": "intro-web3-blockchain",
      en: "btc-to-sol-evolution",
      es: "rust-ts-fundamentals",
    };
    for (const locale of locales) {
      expect(EXPECTED_ENTRY[locale][DEFAULT_SEGMENT]).not.toBeNull();
      expect(await resolveFlagshipLessonHref(locale)).toMatch(
        new RegExp(`^/${locale}/courses/${heroSlug[locale]}/lessons/[^/]+$`)
      );
    }
  });
});
