import "server-only";

import { Connection } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import { getAllCoursesAdmin } from "@/lib/content/queries";
import { fetchCourse, type DecodedCourse } from "@/lib/solana/academy-reads";
import { getProgramId } from "@/lib/solana/pda";
import { diffCourse, type OnChainCourse } from "@/lib/admin/sync-diff";
import {
  preflightRecreate,
  RecreateCourseError,
  type RecreatePlan,
} from "@/lib/admin/recreate-course";

/**
 * READ-ONLY preflight DTO for the WS-2 recreate UI. Everything here is a pure
 * read: it calls {@link preflightRecreate} (which performs no on-chain writes),
 * the cached content-bundle query, one `fetchCourse` read and the pure
 * {@link diffCourse} engine — and NEVER `recreateCourse`/`closeCoursePda`. The
 * destructive close+create lives exclusively behind the POST route.
 */

/** One immutable field the recreate will set, old (on-chain) → new (bundle). */
export interface RecreatePreflightDiff {
  field: string;
  /** Current on-chain value (base58 for pubkeys). */
  onChainValue: string;
  /** Value the recreate will write from the content bundle. */
  contentValue: string;
}

/** The recreate is possible — everything the confirm UI needs to show. */
export interface RecreatePreflightData {
  canRecreate: true;
  courseId: string;
  /** The Course PDA (unchanged by a recreate — same seeds). base58. */
  coursePda: string;
  /** Current on-chain `Course.creator` (base58), or null if it could not be read. */
  creatorOnChain: string | null;
  /** Resolved NEW creator wallet the recreate will set (base58, on-curve-validated). */
  creatorResolved: string;
  /**
   * H3 — the live on-chain lesson_count the recreate defaults to. The recreate
   * NEVER widens this (a wider mask would un-complete mid-course learners), so
   * it is reported separately and is not one of {@link immutableDiffs}.
   */
  liveLessonCount: number;
  /**
   * F4 — true iff the resolved creator is "unusual": on the #427 denylist or
   * equal to the platform authority, i.e. the recreate needs
   * `allowUnusualCreator` to proceed. Derived purely from whether
   * `preflightRecreate` accepts the creator without the override (see
   * {@link buildRecreatePreflight}).
   */
  unusualCreator: boolean;
  /** Immutable fields (creator/difficulty/trackId/trackLevel/prerequisite) that differ. */
  immutableDiffs: RecreatePreflightDiff[];
  /** Counters `create_course` resets to 0 — unrecoverable, reported for visibility. */
  lostCounters: { totalCompletions: number; totalEnrollments: number };
}

/**
 * Stable, locale-agnostic discriminator for the two refusals THIS helper adds
 * (the "no immutable field differs" / "could not confirm a mismatch" gate). The
 * client maps these to translated copy; the English {@link
 * RecreatePreflightRefusal.reason} stays as the server-side/telemetry fallback.
 * Absent for pass-through `preflightRecreate` reasons (already free English).
 */
export type RecreatePreflightRefusalCode = "noImmutableDiff" | "unconfirmed";

/** The recreate is refused — a dead-end, but now with a reason. */
export interface RecreatePreflightRefusal {
  canRecreate: false;
  reason: string;
  /** Present only for the no-op / unconfirmed gate so the client can i18n it. */
  reasonCode?: RecreatePreflightRefusalCode;
}

export type RecreatePreflightResponse =
  | RecreatePreflightData
  | RecreatePreflightRefusal;

/**
 * Map the normalised, snake_case `DecodedCourse` to the diff engine's
 * `OnChainCourse`. Display-only — mirrors the same mapping the status route
 * uses so the recreate confirm shows exactly the fields the deploy screen does.
 */
function toOnChainCourse(courseId: string, raw: DecodedCourse): OnChainCourse {
  return {
    courseId,
    creator: raw.creator.toBase58(),
    lessonCount: raw.liveLessonCount,
    difficulty: raw.difficulty,
    xpPerLesson: raw.xp_per_lesson,
    trackId: raw.track_id,
    trackLevel: raw.track_level,
    prerequisite: raw.prerequisite ? raw.prerequisite.toBase58() : null,
    creatorRewardXp: raw.creator_reward_xp,
    totalCompletions: raw.total_completions,
    totalEnrollments: raw.total_enrollments,
    isActive: raw.is_active,
    version: raw.version,
  };
}

/**
 * Build the read-only recreate preflight DTO for a course.
 *
 * F4 flag derivation — the "unusual creator" flag is derived PURELY from
 * `preflightRecreate`'s own accept/refuse behaviour, never by re-running the
 * #427 denylist guard here (that would duplicate the contract). The flag is
 * exactly "would the recreate NEED `allowUnusualCreator` to proceed":
 *   - preflight(allow=false) accepts             → creator is normal.
 *   - preflight(false) refuses, preflight(true)  → the ONLY blocker was the
 *     accepts                                       creator guard → unusual.
 *   - both refuse                                → a genuine dead-end; surface
 *     the allow=true message, i.e. the reason that persists even under the
 *     maximal override (never the creator-guard message, which would hide the
 *     real remaining blocker).
 *
 * The common case for this fix (a normal instructor wallet replacing an
 * on-chain `creator == authority`) accepts on the first call, so preflight runs
 * only once; the second call happens only on the rare unusual-creator path.
 */
export async function buildRecreatePreflight(
  courseId: string
): Promise<RecreatePreflightResponse> {
  const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");

  let plan: RecreatePlan;
  let unusualCreator = false;
  try {
    plan = await preflightRecreate(courseId, connection, false);
  } catch (first) {
    if (!(first instanceof RecreateCourseError)) throw first;
    // preflight(false) refused. Was the creator guard the SOLE reason?
    try {
      plan = await preflightRecreate(courseId, connection, true);
      unusualCreator = true;
    } catch (second) {
      if (!(second instanceof RecreateCourseError)) throw second;
      return { canRecreate: false, reason: second.message };
    }
  }

  // The gate passed — assemble the display DTO. The immutable diffs + the old
  // creator come from the same pure diff engine the deploy screen uses, so the
  // confirm modal shows exactly the create-only fields `update_course` cannot
  // fix. Best-effort: the gate is already authoritative, so a read hiccup here
  // degrades to "no diffs shown" rather than a refusal (the client also carries
  // its own row-level diffs for the at-a-glance card).
  const [courses, onChain] = await Promise.all([
    getAllCoursesAdmin(),
    fetchCourse(courseId, connection, getProgramId()),
  ]);
  const course = courses.find((c) => c._id === courseId);
  let creatorOnChain: string | null = null;
  let immutableDiffs: RecreatePreflightDiff[] = [];
  if (onChain && course) {
    creatorOnChain = onChain.creator.toBase58();
    const diff = diffCourse(
      course,
      toOnChainCourse(courseId, onChain),
      plan.createParams.prerequisitePda ?? null
    );
    immutableDiffs = diff.differences
      // lesson_count is PRESERVED by the recreate (H3) and reported separately
      // as liveLessonCount — never shown here as an applied old→new change.
      .filter((d) => !d.updateable && d.field !== "lessonCount")
      .map((d) => ({
        field: d.field,
        onChainValue: String(d.onChainValue),
        contentValue: String(d.contentValue),
      }));
  }

  // `createParams.creatorWallet` is typed optional, but `preflightRecreate`
  // validates it (required, parseable, on-curve) and refuses otherwise before
  // ever returning a plan — so by here it is a resolved base58 string.
  const creatorResolved =
    plan.createParams.creatorWallet ?? creatorOnChain ?? "";

  // ---- POSITIVE requirement: a recreate must actually fix an immutable field.
  // `preflightRecreate` only proves the create PARAMS are valid — it never
  // asserts the on-chain account is genuinely wrong. Without this gate a stale
  // tab or a second sequential recreate would close+recreate an already-correct
  // course, irreversibly zeroing completion/enrollment counters and causing
  // downtime while fixing nothing. So allow ONLY on positive evidence of a real
  // immutable mismatch:
  //   - `immutableDiffs` is non-empty (the pure diff engine — which already
  //     excludes updateable fields and the H3-preserved lessonCount — found a
  //     create-only field that differs, creator included), OR
  //   - the creator provably differs from chain (both sides read and unequal).
  // A confirmed creator difference ALSO shows up in `immutableDiffs`, but the
  // creator check is kept independent so a diff-engine hiccup can't mask it.
  const creatorDiffers =
    creatorOnChain !== null &&
    creatorResolved !== "" &&
    creatorOnChain !== creatorResolved;
  const hasRealImmutableDiff = immutableDiffs.length > 0 || creatorDiffers;

  if (!hasRealImmutableDiff) {
    // Distinguish "confirmed no-op" from "couldn't confirm". When the on-chain
    // account could not be read/decoded (`creatorOnChain` is null → the diff
    // engine also had no data, so `immutableDiffs` is empty for LACK OF DATA,
    // not lack of difference), refuse on unconfirmed state rather than assert a
    // no-op. Otherwise chain and bundle agree on every immutable field.
    if (creatorOnChain === null) {
      return {
        canRecreate: false,
        reasonCode: "unconfirmed",
        reason:
          "Could not read the on-chain account to confirm an immutable mismatch — " +
          "refresh the status screen and retry; refusing to recreate on unconfirmed state.",
      };
    }
    return {
      canRecreate: false,
      reasonCode: "noImmutableDiff",
      reason:
        "No immutable field differs between the content bundle and the on-chain account — " +
        "a recreate would fix nothing and would irreversibly reset completion/enrollment " +
        "counters and cause downtime.",
    };
  }

  return {
    canRecreate: true,
    courseId: plan.courseId,
    coursePda: plan.coursePda.toBase58(),
    creatorOnChain,
    creatorResolved,
    liveLessonCount: plan.createParams.lessonCount,
    unusualCreator,
    immutableDiffs,
    lostCounters: {
      totalCompletions: plan.snapshot.totalCompletions,
      totalEnrollments: plan.snapshot.totalEnrollments,
    },
  };
}
