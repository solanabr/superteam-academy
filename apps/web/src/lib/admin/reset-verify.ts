import { BorshCoder } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import type BN from "bn.js";
import { Connection, PublicKey } from "@solana/web3.js";
import IDL from "@/lib/solana/idl/superteam_academy.json";
import { decodeCourse } from "@/lib/solana/academy-reads";
import { getProgramId } from "@/lib/solana/pda";

/**
 * B4 — read-only v-next reset verification harness (#356).
 *
 * SAFE lane: every function here only calls `getProgramAccounts` /
 * `getAccountInfo`-style reads and decodes bytes. Nothing in this module signs
 * or sends a transaction. This is the safety net for the reset wave's most
 * destructive lane (close+recreate, see `recreate-course.ts`) — it exists to
 * catch a bad recreate BEFORE the operator moves on to the next course.
 *
 * Two pieces:
 *   - {@link snapshotOnChainState} — a structural dump of every Course and
 *     Enrollment account live under the program, taken once before the reset
 *     wave (PRE) and once after (POST).
 *   - {@link verifyReset} — a pure diff over a PRE snapshot, a POST snapshot,
 *     and the expected per-course values, asserting the #356 invariants,
 *     including H3 (see the docstring on {@link verifyReset}). NEVER throws on
 *     a data mismatch — every violation is reported as a structured failure so
 *     a caller (the admin route, or the CLI script) can display it, not crash
 *     on it.
 *
 * The Course discriminator is identical across the v1 (224-byte) and v-next
 * (253-byte) on-chain layouts (Anchor discriminators are derived from the
 * struct name alone — see `academy-reads.ts`), so a single
 * `getProgramAccounts` call with one memcmp filter returns BOTH pre-reset and
 * post-reset accounts; each is then decoded with the length-dispatched
 * `decodeCourse`, which normalises both layouts to the same shape (including
 * `liveLessonCount` / `activeLessons`, the popcount and the dense mask this
 * module's H3 check needs). The Enrollment layout is unchanged across
 * versions, so it uses a single raw decode.
 */

// Enrollment/Course account-name discriminators only depend on the struct
// name (`sha256("account:<Name>")[..8]`), not on the fields inside it, so the
// v1 IDL's coder is sufficient to build memcmp filters that match BOTH the
// v1 and v-next Course layouts (verified: both IDLs carry the identical
// discriminator bytes for "Course", and Enrollment is unversioned).
const coder = new BorshCoder(IDL as unknown as Idl);

// -----------------------------------------------------------------------------
// Bit-mask helpers — BigInt only. A `number &` truncates at 32 bits and would
// silently corrupt any comparison over the 256-bit `active_lessons` /
// `lesson_flags` masks (see apps/web/src/lib/solana/bitmap.ts, which this
// mirrors for the same reason).
// -----------------------------------------------------------------------------

/**
 * Encode a 4 x u64 mask (word[0] = bits 0-63 … word[3] = bits 192-255) as a
 * stable 64-character hex string, most-significant word first, so two masks
 * are byte-comparable as plain strings and JSON-serialisable for the CLI's
 * saved-snapshot files.
 */
function maskToHex(mask: readonly bigint[]): string {
  if (mask.length !== 4) {
    throw new Error(
      `maskToHex: expected a 4 x u64 mask, got ${mask.length} word(s)`
    );
  }
  return [mask[3], mask[2], mask[1], mask[0]]
    .map((word) => (word ?? 0n).toString(16).padStart(16, "0"))
    .join("");
}

/** Parse a {@link maskToHex} string back into a single 256-bit BigInt. */
function parseMaskHex(hex: string): bigint {
  return BigInt(`0x${hex}`);
}

function bytesToHex(bytes: readonly number[]): string {
  return Buffer.from(bytes).toString("hex");
}

// -----------------------------------------------------------------------------
// Snapshot
// -----------------------------------------------------------------------------

export interface CourseSnapshot {
  courseId: string;
  /** The Course PDA address (base58). Unchanged by a recreate — same seeds. */
  coursePda: string;
  /** Raw account length — 224 (v1) or 253 (v-next); the length IS the version. */
  sizeBytes: number;
  creator: string;
  creatorRewardXp: number;
  /** v1: `lesson_count`. v-next: popcount(`active_lessons`). Always populated. */
  liveLessonCount: number;
  /**
   * The 256-bit live-lesson mask, hex-encoded via {@link maskToHex}. For v1
   * this is the dense mask synthesised from `lesson_count` (see
   * `academy-reads.ts#denseMask`); for v-next it is the raw `active_lessons`.
   * Both are directly comparable — this is what the H3 check operates on.
   */
  activeLessonsOrCount: string;
  contentTxId: string;
}

export interface EnrollmentSnapshot {
  /** The Enrollment PDA address (base58) — the identity key for this record. */
  address: string;
  /** The Course PDA this enrollment belongs to (base58). */
  course: string;
  /** The 4 x u64 `lesson_flags` bitmap, hex-encoded via {@link maskToHex}. */
  lessonFlags: string;
}

/** An account matched by discriminator but which failed to decode. Reported, never dropped silently. */
export interface UndecodedAccount {
  address: string;
  sizeBytes: number;
  error: string;
}

export interface ResetSnapshot {
  courses: CourseSnapshot[];
  enrollments: EnrollmentSnapshot[];
  undecodedCourses: UndecodedAccount[];
  undecodedEnrollments: UndecodedAccount[];
}

interface RawEnrollment {
  course: PublicKey;
  enrolled_at: BN;
  completed_at: BN | null;
  lesson_flags: BN[];
  credential_asset: PublicKey | null;
  _reserved: number[];
  bump: number;
}

function toCourseSnapshot(pubkey: PublicKey, data: Buffer): CourseSnapshot {
  const decoded = decodeCourse(data);
  return {
    courseId: decoded.course_id,
    coursePda: pubkey.toBase58(),
    sizeBytes: data.length,
    creator: decoded.creator.toBase58(),
    creatorRewardXp: decoded.creator_reward_xp,
    liveLessonCount: decoded.liveLessonCount,
    activeLessonsOrCount: maskToHex(decoded.activeLessons),
    contentTxId: bytesToHex(decoded.content_tx_id),
  };
}

function toEnrollmentSnapshot(
  pubkey: PublicKey,
  data: Buffer
): EnrollmentSnapshot {
  const raw = coder.accounts.decode<RawEnrollment>("Enrollment", data);
  const mask = raw.lesson_flags.map((word) => BigInt(word.toString()));
  return {
    address: pubkey.toBase58(),
    course: raw.course.toBase58(),
    lessonFlags: maskToHex(mask),
  };
}

/**
 * READ-ONLY structural snapshot of every Course and Enrollment account live
 * under the program: `getProgramAccounts` + decode. No signing, no writes —
 * safe to run against mainnet or devnet, before or after a reset.
 */
export async function snapshotOnChainState(
  connection: Connection,
  programId: PublicKey = getProgramId()
): Promise<ResetSnapshot> {
  const [courseAccounts, enrollmentAccounts] = await Promise.all([
    connection.getProgramAccounts(programId, {
      filters: [{ memcmp: coder.accounts.memcmp("Course") }],
    }),
    connection.getProgramAccounts(programId, {
      filters: [{ memcmp: coder.accounts.memcmp("Enrollment") }],
    }),
  ]);

  const courses: CourseSnapshot[] = [];
  const undecodedCourses: UndecodedAccount[] = [];
  for (const { pubkey, account } of courseAccounts) {
    try {
      courses.push(toCourseSnapshot(pubkey, account.data));
    } catch (err) {
      undecodedCourses.push({
        address: pubkey.toBase58(),
        sizeBytes: account.data.length,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const enrollments: EnrollmentSnapshot[] = [];
  const undecodedEnrollments: UndecodedAccount[] = [];
  for (const { pubkey, account } of enrollmentAccounts) {
    try {
      enrollments.push(toEnrollmentSnapshot(pubkey, account.data));
    } catch (err) {
      undecodedEnrollments.push({
        address: pubkey.toBase58(),
        sizeBytes: account.data.length,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { courses, enrollments, undecodedCourses, undecodedEnrollments };
}

// -----------------------------------------------------------------------------
// Invariant diff / assert
// -----------------------------------------------------------------------------

/** Expected post-recreate values for one course (the #356 targets). */
export interface ExpectedCourseValues {
  /** Expected v-next account size. Always 253 for a landed recreate. */
  expectedSize: number;
  /** Expected new `creator` (base58) — the instructor wallet, not the platform authority. */
  expectedCreator: string;
  /** Expected `creator_reward_xp` — 30 post-#356 (down from 750). */
  expectedRewardXp: number;
}

export type ExpectedByCourseId = Record<string, ExpectedCourseValues>;

export interface CourseCheckResult {
  courseId: string;
  ok: boolean;
  failures: string[];
}

export interface EnrollmentCheckResult {
  address: string;
  ok: boolean;
  failures: string[];
}

export interface ResetVerifyResult {
  ok: boolean;
  perCourse: CourseCheckResult[];
  perEnrollment: EnrollmentCheckResult[];
  failures: string[];
}

/**
 * Verify the #356 reset invariants for a set of recreated courses. Pure
 * function, never throws on a data mismatch — every violation is collected as
 * a structured failure rather than an exception, so a caller can always
 * inspect the full picture instead of stopping at the first problem.
 *
 * Checked per course in `expected` (keyed by `courseId`):
 *   - the POST account is exactly `expectedSize` bytes (253 for a landed
 *     v-next recreate),
 *   - `creator == expectedCreator`,
 *   - `creatorRewardXp == expectedRewardXp`,
 *   - **H3 (safety-critical)**: `popcount(post.active_lessons) ==
 *     pre.liveLessonCount` **AND** the POST dense mask is a SUPERSET of every
 *     PRE enrollment's `lesson_flags` for that course — i.e. the recreate
 *     never demands a bit a mid-course learner wasn't asked to set. Any
 *     course where the post mask does not fully cover a pre enrollment's
 *     `lesson_flags` is flagged, naming the specific enrollment.
 *
 * Checked per PRE enrollment (independent of `expected` — every enrollment
 * that existed before the reset is checked, whether or not its course was
 * recreated):
 *   - it still exists in POST at the exact same address (a missing address is
 *     flagged as "missing" — the Enrollment PDA is seeded from
 *     `(course_id, learner)` and is never touched by a recreate, so there is
 *     no legitimate reason for it to disappear or "move"),
 *   - its `course` field and `lessonFlags` bytes are byte-identical to PRE.
 *
 * A PRE course or enrollment absent from the PRE snapshot itself, or a POST
 * course absent from the POST snapshot, is ALSO a failure (fail-closed —
 * "couldn't verify" is never treated as "assume it's fine").
 *
 * Deliberately NOT checked: POST-only enrollments with no PRE counterpart
 * (new enrollments during/after the reset window are ordinary usage, not a
 * corruption signal) and courses outside `expected` (out of scope for this run).
 */
export function verifyReset(
  pre: ResetSnapshot,
  post: ResetSnapshot,
  expected: ExpectedByCourseId
): ResetVerifyResult {
  const preCoursesById = new Map(pre.courses.map((c) => [c.courseId, c]));
  const postCoursesById = new Map(post.courses.map((c) => [c.courseId, c]));

  const preEnrollmentsByCourse = new Map<string, EnrollmentSnapshot[]>();
  for (const enrollment of pre.enrollments) {
    const list = preEnrollmentsByCourse.get(enrollment.course) ?? [];
    list.push(enrollment);
    preEnrollmentsByCourse.set(enrollment.course, list);
  }
  const postEnrollmentsByAddress = new Map(
    post.enrollments.map((e) => [e.address, e])
  );

  const perCourse: CourseCheckResult[] = [];
  const failures: string[] = [];

  for (const [courseId, exp] of Object.entries(expected)) {
    const courseFailures: string[] = [];
    const preCourse = preCoursesById.get(courseId);
    const postCourse = postCoursesById.get(courseId);

    if (!postCourse) {
      courseFailures.push(
        `course "${courseId}": missing from POST snapshot — the recreate did not land`
      );
    } else {
      if (postCourse.sizeBytes !== exp.expectedSize) {
        courseFailures.push(
          `course "${courseId}": sizeBytes=${postCourse.sizeBytes}, expected ${exp.expectedSize}`
        );
      }
      if (postCourse.creator !== exp.expectedCreator) {
        courseFailures.push(
          `course "${courseId}": creator=${postCourse.creator}, expected ${exp.expectedCreator}`
        );
      }
      if (postCourse.creatorRewardXp !== exp.expectedRewardXp) {
        courseFailures.push(
          `course "${courseId}": creatorRewardXp=${postCourse.creatorRewardXp}, expected ${exp.expectedRewardXp}`
        );
      }
    }

    if (!preCourse) {
      courseFailures.push(
        `course "${courseId}": missing from PRE snapshot — cannot verify H3 against a baseline; refusing to assume it's fine`
      );
    } else if (postCourse) {
      // H3a — popcount(post.active_lessons) === pre.liveLessonCount, exactly.
      if (postCourse.liveLessonCount !== preCourse.liveLessonCount) {
        const direction =
          postCourse.liveLessonCount > preCourse.liveLessonCount
            ? "widened"
            : "narrowed";
        courseFailures.push(
          `course "${courseId}" [H3]: post liveLessonCount=${postCourse.liveLessonCount} != ` +
            `pre liveLessonCount=${preCourse.liveLessonCount} (${direction} — a recreate must ` +
            `preserve the on-chain lesson count exactly)`
        );
      }

      // H3b — post dense mask ⊇ every PRE enrollment's lesson_flags for this course.
      const postMask = parseMaskHex(postCourse.activeLessonsOrCount);
      const learners = preEnrollmentsByCourse.get(preCourse.coursePda) ?? [];
      for (const enrollment of learners) {
        const learnerFlags = parseMaskHex(enrollment.lessonFlags);
        const isSubset = (learnerFlags & postMask) === learnerFlags;
        if (!isSubset) {
          courseFailures.push(
            `course "${courseId}" [H3]: post active_lessons (0x${postMask.toString(16)}) does not ` +
              `cover enrollment ${enrollment.address}'s lesson_flags (0x${learnerFlags.toString(16)}) — ` +
              `the recreate would demand a bit this mid-course learner was never asked to set`
          );
        }
      }
    }

    perCourse.push({
      courseId,
      ok: courseFailures.length === 0,
      failures: courseFailures,
    });
    failures.push(...courseFailures);
  }

  const perEnrollment: EnrollmentCheckResult[] = [];
  for (const preEnrollment of pre.enrollments) {
    const enrollmentFailures: string[] = [];
    const postEnrollment = postEnrollmentsByAddress.get(preEnrollment.address);

    if (!postEnrollment) {
      enrollmentFailures.push(
        `enrollment ${preEnrollment.address}: missing from POST snapshot (dropped or moved) — ` +
          `Enrollment PDAs are never touched by a recreate, so this should be impossible`
      );
    } else {
      if (postEnrollment.course !== preEnrollment.course) {
        enrollmentFailures.push(
          `enrollment ${preEnrollment.address}: course changed ${preEnrollment.course} -> ${postEnrollment.course}`
        );
      }
      if (postEnrollment.lessonFlags !== preEnrollment.lessonFlags) {
        enrollmentFailures.push(
          `enrollment ${preEnrollment.address}: lessonFlags changed ${preEnrollment.lessonFlags} -> ${postEnrollment.lessonFlags}`
        );
      }
    }

    perEnrollment.push({
      address: preEnrollment.address,
      ok: enrollmentFailures.length === 0,
      failures: enrollmentFailures,
    });
    failures.push(...enrollmentFailures);
  }

  return { ok: failures.length === 0, perCourse, perEnrollment, failures };
}
