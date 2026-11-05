/**
 * Learner segments from the Design A /start intake (launch-experience master
 * spec §3 — LX-A2/LX-A3):
 *
 *   1 — CORE web2 ("I build web apps (JS/TS)")
 *   2 — web3 dev  ("I already ship web3 / smart contracts")
 *   3 — beginner  ("I'm new to programming")
 *
 * This module is the SEAM for #566 (LX-A3 segment state). #566 extends it with
 * the launch routing table (`SEGMENT_ENTRY_COURSE`) and the learner-goal
 * framing (`GoalId` / `GOAL_FRAMING_KEY`); the localStorage/profiles storage
 * lives next door in `lib/onboarding`. This file stays the single source of
 * truth for the segment/goal TYPES and the app-side routing constant.
 */

import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

export type LearnerSegment = 1 | 2 | 3;

/**
 * How the path page frames the same sequenced content (S9 expertise-reversal
 * asymmetry — guidance copy/prominence varies, content never does):
 *
 * - `fixed`       — fixed-path emphasis: later courses render locked until the
 *                   previous one completes (segment 3, high guidance).
 * - `guided-skip` — same sequence, but every course stays reachable with a
 *                   visible "skip ahead" hint (segment 1).
 * - `open`        — open access: the order is presented as a recommendation
 *                   only, no locks or skip hints (segment 2).
 */
export type PathGuidanceModality = "fixed" | "guided-skip" | "open";

/**
 * Default when no segment is stored (anonymous visitor, pre-#566): segment 1.
 * Guidance is present (sequenced list + one start-here card) but skip-ahead is
 * visible — S9 says default to guidance when uncertain without punishing
 * experts.
 */
export const DEFAULT_SEGMENT: LearnerSegment = 1;

export const SEGMENT_PATH_MODALITY: Record<
  LearnerSegment,
  PathGuidanceModality
> = {
  1: "guided-skip",
  2: "open",
  3: "fixed",
};

/**
 * Launch routing table (LX-A3): each locale and segment → the content course id
 * it enters after /start. This is an APP-SIDE constant on purpose — the spec rules out
 * path-schema metadata to avoid the two-repo content-staging cycle, so routing
 * changes ship with a code deploy, not a content.lock bump.
 *
 * Routing to a course that is absent from the bundle or deactivated on-chain
 * sends the /start funnel + landing deep-link to the catalog fallback: the
 * `resolveEntryLessonHref` sync gate keeps that from 404-ing, but the deep-link
 * into lesson 1 goes dead — the regression this table exists to prevent.
 * `entry-course-live.test.ts` runs the real resolver against the real bundle,
 * so an entry that stops resolving or stops being readable in its locale is
 * red, not silent.
 *
 * Keyed by locale because a course only reads well in the languages it ships:
 * an untranslated course still renders, in its source language, so a table
 * without the locale drops /en and /es visitors into Portuguese. A `null` entry
 * means no course fits that visitor, and they go to the catalog instead.
 *
 * - Segment 1 (ships JS/TS): `course-rust-ts-fundamentals`, which expects a
 *   working programmer who is new to Rust and web3. Translated into all three.
 * - Segment 2 (ships on-chain): `course-digital-assets`, which opens by assuming
 *   Solana fundamentals without assuming Anchor. Translated into all three.
 * - Segment 3 (new to code): the no-code course each locale can read. pt-BR gets
 *   `course-intro-web3-blockchain`, first in the beginner path; en gets the
 *   English translation of `course-visao-geral-solana`; nothing in Spanish
 *   fits, so es gets the catalog.
 */
export const SEGMENT_ENTRY_COURSE: Record<
  Locale,
  Record<LearnerSegment, string | null>
> = {
  "pt-BR": {
    1: "course-rust-ts-fundamentals",
    2: "course-digital-assets",
    3: "course-intro-web3-blockchain",
  },
  en: {
    1: "course-rust-ts-fundamentals",
    2: "course-digital-assets",
    3: "course-visao-geral-solana",
  },
  es: {
    1: "course-rust-ts-fundamentals",
    2: "course-digital-assets",
    3: null,
  },
};

/**
 * The landing hero's entry course. It is its own table because a landing visitor
 * has told us nothing yet: reusing a segment's cell would pick a course for
 * someone we know about. Only pt-BR has a course that suits an unknown visitor,
 * the first one in the beginner path. en and es get the catalog (`null`).
 */
export const HERO_ENTRY_COURSE: Record<Locale, string | null> = {
  "pt-BR": "course-intro-web3-blockchain",
  en: null,
  es: null,
};

function knownLocale(locale: string): Locale {
  return (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : defaultLocale;
}

/** The course `segment` enters at in `locale`; `null` routes to the catalog. */
export function entryCourseFor(
  segment: LearnerSegment,
  locale: string
): string | null {
  return SEGMENT_ENTRY_COURSE[knownLocale(locale)][segment];
}

/** The course the landing hero enters at in `locale`; `null` routes to the catalog. */
export function heroEntryCourseFor(locale: string): string | null {
  return HERO_ENTRY_COURSE[knownLocale(locale)];
}

/**
 * Learner goal from /start screen 2. Consumed as path-page framing copy
 * (GOAL_FRAMING_KEY) — never as routing or as anything reward-bearing.
 *
 *   job     — land a Solana developer role
 *   build   — ship my own project / startup
 *   explore — understand how Solana works
 */
export type GoalId = "job" | "build" | "explore";

export const GOAL_IDS: readonly GoalId[] = ["job", "build", "explore"] as const;

export function isGoalId(value: unknown): value is GoalId {
  return (
    typeof value === "string" && (GOAL_IDS as readonly string[]).includes(value)
  );
}

/**
 * Path-page framing line per goal (LX-A2: goal→path-page framing copy). Values
 * are i18n keys under the `courses` namespace, resolved by PathsView.
 */
export const GOAL_FRAMING_KEY: Record<GoalId, string> = {
  job: "pathGoalJob",
  build: "pathGoalBuild",
  explore: "pathGoalExplore",
};
