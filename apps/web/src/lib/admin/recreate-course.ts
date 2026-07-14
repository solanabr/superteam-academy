import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";
import {
  difficultyToNumber,
  getMissingCourseFields,
  isDraftId,
} from "./sync-diff";
import { serverEnv } from "@/lib/env.server";
import { getAllCoursesAdmin } from "@/lib/content/queries";
import {
  writeCourseOnChainStatus,
  writeCourseMaintenanceFlag,
} from "@/lib/content/deployment-writes";
import { fetchCourse } from "@/lib/solana/academy-reads";
import { findCoursePDA, getProgramId } from "@/lib/solana/pda";
import {
  assertCreatorAllowed,
  closeCoursePda,
  deployCoursePda,
  getAuthorityPublicKey,
  setCourseCollectionPda,
  updateCoursePda,
  type CreateCourseAdminParams,
} from "@/lib/solana/admin-signer";

/**
 * Close + recreate a Course PDA (issue #440).
 *
 * WHY THIS EXISTS. `Course.creator`, `difficulty`, `track_id`, `track_level` and
 * `prerequisite` are written once by `create_course` and `UpdateCourseParams`
 * has no field for any of them — they are CREATE-ONLY. When the content bundle
 * disagrees with the chain on one of these, deploying would write the mutable
 * fields and leave the immutable divergence in place forever, so the deploy
 * screen blocks. Closing and recreating the PDA is the only real fix. Concretely:
 * every live devnet course was deployed pre-#399 with `creator == platform
 * authority`, so creator rewards route to a wallet no instructor controls.
 *
 * THE LOAD-BEARING CONSTRAINT. close + create CANNOT be atomic. A 0-lamport
 * closed account is not garbage-collected until the transaction ends, so an
 * `init` in the same tx fails — `create_course` must run in a LATER tx. There is
 * therefore a WINDOW in which the Course PDA does not exist, and during it
 * `enroll` / `complete_lesson` have no course account to read and revert. Every
 * design choice below exists to bound that window:
 *
 *   1. PRE-FLIGHT EVERYTHING (`preflightRecreate`). The full create params are
 *      resolved AND validated — including the #427 `assertCreatorAllowed`
 *      denylist guard, the on-curve/parse checks, and the H3 lesson-count check
 *      (below) — BEFORE the close is sent. It must be impossible to close a
 *      course and only then discover the create params were bad. This ordering
 *      IS the safety property; it is asserted directly in the unit tests.
 *   2. THE MAINTENANCE GATE (`writeCourseMaintenanceFlag`). Set BEFORE the
 *      close, cleared after the create lands. The on-chain write paths that can
 *      race the absent-PDA window (`/api/lessons/complete`,
 *      `/api/certificates/mint`, the webhook finalize path in
 *      `lib/helius/event-handlers.ts`) check it and refuse/queue instead of
 *      reading a course that may not exist yet.
 *   3. RETRY THE CREATE HARD. {@link CREATE_ATTEMPTS} attempts, each a fresh
 *      `.rpc()` (Anchor fetches a new blockhash per call, so a retry is never a
 *      resend of an expired tx).
 *   4. FAIL LOUD, LEAVE IT RECOVERABLE. If the create still fails we do NOT
 *      swallow it: the deployment row is written honestly as `not_deployed`
 *      (never left as a stale `synced` claiming the course is fine) and the
 *      thrown error names the exact recovery. Natural recovery already exists —
 *      both the admin status route and the drift route derive `not_deployed`
 *      from the ABSENCE of the on-chain account, so a course whose PDA is gone
 *      shows a "Deploy" button that runs the ordinary create path.
 *
 * WHAT SURVIVES A RECREATE. Enrollment PDAs are seeded
 * `["enrollment", course_id, learner]`, are never passed to `close_course`, and
 * are physically untouched. Their stored `enrollment.course` is the Course PDA,
 * derived from `course_id` alone — so recreating under the SAME course_id
 * reproduces the IDENTICAL address and the `enrollment.course == course.key()`
 * constraint in `complete_lesson` / `finalize_course` still holds. Learner
 * lesson_flags, completed_at and already-minted XP all survive — PROVIDED the
 * recreate's `lesson_count` does not exceed what is currently live on-chain
 * (see the H3 note on {@link preflightRecreate}).
 *
 * WHAT DOES NOT. `create_course` hard-resets `total_completions` and
 * `total_enrollments` to 0, and no instruction can write them back. The
 * pre-flight reads both counters off the live account and returns them in
 * {@link RecreateCourseResult.lostCounters} for operator visibility.
 * `is_active` and `collection` are also reset, but those we CAN restore, and
 * do — see {@link restoreAfterCreate}.
 *
 * MAINNET. This is the platform's single most destructive on-chain operation,
 * and #305 (Squads custody) has not landed — there is still one hot key that
 * can close any course. Until #305 ships, recreate is hard-refused on any
 * network other than devnet; see the very first check in
 * {@link preflightRecreate}.
 */

/** Create attempts after the close has landed. */
const CREATE_ATTEMPTS = 4;

/** Backoff between create attempts (ms). */
const CREATE_RETRY_DELAY_MS = 1_000;

/** The phase a failure happened in — decides whether the course is still intact. */
export type RecreatePhase = "preflight" | "close" | "create";

/**
 * A recreate failure.
 *
 * `courseIntact` is the field callers must branch on:
 *   - `true`  → nothing was destroyed. Either the pre-flight refused (no on-chain
 *     call was made at all) or the close itself failed, in which case the old
 *     Course PDA is still there, unchanged. Safe to retry, safe to ignore.
 *   - `false` → THE COURSE IS DOWN. The close landed and the create did not, so
 *     the Course PDA does not exist. Enrollments and learner XP are intact, but
 *     `enroll` / `complete_lesson` revert until the PDA is recreated.
 *     {@link Error.message} carries the recovery instruction.
 */
export class RecreateCourseError extends Error {
  constructor(
    message: string,
    readonly phase: RecreatePhase,
    readonly courseIntact: boolean
  ) {
    super(message);
    this.name = "RecreateCourseError";
  }
}

/** On-chain course state captured BEFORE the close, so we can restore/report it. */
interface PreCloseSnapshot {
  /** Reset to 0 by create_course; unrecoverable. */
  totalCompletions: number;
  /** Reset to 0 by create_course; unrecoverable. Never recovers (enroll uses `init`). */
  totalEnrollments: number;
  /** Reset to `true` by create_course; we restore it. */
  isActive: boolean;
  /** Reset to default by create_course; we re-BIND the existing one (never mint a new one). */
  collection: string | null;
}

export interface RecreateCourseResult {
  action: "recreated";
  coursePda: string;
  closeSignature: string;
  createSignature: string;
  /** How many create attempts it took (1 = landed first try). */
  createAttempts: number;
  /**
   * On-chain counters destroyed by the recreate. NOT restorable — reported so
   * the operator has visibility into the reset.
   */
  lostCounters: { totalCompletions: number; totalEnrollments: number };
  /** Non-fatal post-create problems (collection re-bind, is_active restore). */
  warnings: string[];
}

/** Everything the create needs, fully resolved and validated. */
export interface RecreatePlan {
  courseId: string;
  coursePda: PublicKey;
  createParams: CreateCourseAdminParams;
  snapshot: PreCloseSnapshot;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Normalize the raw-IDL BorshCoder's `collection` (snake_case fields; the pubkey
 * comes back as base58 or raw bytes) to a base58 string, or `null` when it is
 * unset (`Pubkey::default()` — the all-zero key).
 */
function normalizeCollection(raw: unknown): string | null {
  if (raw == null) return null;
  let base58: string;
  try {
    base58 =
      typeof raw === "string"
        ? raw
        : new PublicKey(raw as Uint8Array).toBase58();
  } catch {
    return null;
  }
  return base58 === PublicKey.default.toBase58() ? null : base58;
}

/**
 * PHASE 1 — resolve and validate EVERY create param against the content bundle
 * and the live chain. Purely read-only: this function performs NO on-chain
 * writes and MUST be called (and must succeed) before the close is sent.
 *
 * H3 — lesson_count is a set-once value for anyone mid-course, exactly like
 * `creator`. `create_course` builds a DENSE mask from `lessonCount`, and
 * `finalize_course` gates on the subset test (`flags & active == active`). A
 * recreate with a LARGER `lessonCount` than what is currently live demands bits
 * a mid-course learner was never asked to set, silently flipping them from
 * complete back to incomplete. So this reads the course's CURRENT on-chain
 * `liveLessonCount` and defaults the recreate to EXACTLY that value — the
 * content bundle's `lessonCount` is used only as an upper-bound check, and a
 * bundle that wants MORE lessons than are live is refused outright (never
 * silently recreated with a superset mask). Lessons are added afterwards via
 * the ordinary, increase-only `update_course.new_lesson_count` sync path.
 *
 * Throws {@link RecreateCourseError} with `phase: "preflight"`, `courseIntact:
 * true` on any problem — a refusal here means the course was never touched.
 */
export async function preflightRecreate(
  courseId: string,
  connection: Connection,
  allowUnusualCreator = false
): Promise<RecreatePlan> {
  const refuse = (message: string): never => {
    throw new RecreateCourseError(message, "preflight", true);
  };

  // Mainnet hard-assert (rail 4). #305 (Squads custody) has not landed, so a
  // single hot key can currently sign this — the platform's most destructive
  // on-chain operation. Un-bypassable: this is the FIRST statement in the
  // function, reads the network fresh (not a module-level cache) every call,
  // and default-DENIES anything that is not literally "devnet" — including
  // "mainnet", "mainnet-beta", an unset/misconfigured value, or a typo. Remove
  // only once #305 ships a Squads-vault assertion to replace it.
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  if (network !== "devnet") {
    refuse(
      `Recreate is unavailable on network "${network}" until Squads custody (#305) lands — ` +
        `close+recreate is hard-restricted to devnet in the meantime.`
    );
  }

  if (isDraftId(courseId)) {
    refuse("Cannot recreate a draft document");
  }

  // The signer must be loaded BEFORE we close anything — otherwise the create
  // could not possibly succeed. Also gives us the authority for the #427 guard.
  const authority = getAuthorityPublicKey();
  if (!authority) {
    refuse("Admin signer not configured (PROGRAM_AUTHORITY_SECRET missing)");
  }

  const courses = await getAllCoursesAdmin();
  const course = courses.find((c) => c._id === courseId);
  if (!course) {
    refuse(`Course "${courseId}" not found in the content bundle`);
  }

  const missingFields = getMissingCourseFields(course!);
  if (missingFields.length > 0) {
    refuse(
      `Course "${courseId}" is missing required fields: ${missingFields.join(", ")}`
    );
  }

  // Creator: the entire reason this operation exists. Required, parseable and
  // on-curve (Course.creator must own the reward ATA, so a PDA is invalid), and
  // then run the #427 denylist guard — which also rejects creator == authority,
  // i.e. exactly the bug (#440) we are here to fix. Doing this in PRE-FLIGHT is
  // the point: deployCoursePda runs the same guard, but by the time it would
  // fire the old PDA is already gone.
  const creatorWallet = course!.creatorWallet ?? undefined;
  if (!creatorWallet) {
    refuse(
      `Course "${courseId}" has no creator wallet — set course.instructor to an instructor with a wallet`
    );
  }
  let creator: PublicKey;
  try {
    creator = new PublicKey(creatorWallet!);
  } catch {
    refuse(
      `Instructor wallet "${creatorWallet}" is not a valid Solana address`
    );
  }
  if (!PublicKey.isOnCurve(creator!.toBytes())) {
    refuse(`Instructor wallet "${creatorWallet}" is off-curve`);
  }
  try {
    assertCreatorAllowed(creator!, authority!, courseId, allowUnusualCreator);
  } catch (e) {
    refuse(e instanceof Error ? e.message : String(e));
  }

  // Prerequisite must already be on-chain, or the recreated course would carry a
  // dangling prerequisite pubkey that `enroll` can never satisfy.
  let prerequisitePda: string | undefined;
  if (course!.prerequisiteCourse) {
    const [prereqPda] = findCoursePDA(
      course!.prerequisiteCourse._id,
      getProgramId()
    );
    const prereqInfo = await connection.getAccountInfo(prereqPda);
    if (!prereqInfo) {
      refuse(
        `Prerequisite course "${course!.prerequisiteCourse.title}" is not deployed on-chain`
      );
    }
    prerequisitePda = prereqPda.toBase58();
  }

  // The course must currently EXIST on-chain — there is nothing to recreate
  // otherwise, and closing a non-existent account is not a no-op we want to
  // paper over. If it is already gone, the ordinary Deploy path is the right tool.
  const [coursePda] = findCoursePDA(courseId, getProgramId());
  const accountInfo = await connection.getAccountInfo(coursePda);
  if (!accountInfo) {
    refuse(
      `Course "${courseId}" is not deployed on-chain — there is nothing to recreate. Use Deploy instead.`
    );
  }

  // Snapshot the live account so we can restore is_active/collection after the
  // create, report the counters the recreate will destroy, and (H3) read the
  // CURRENT on-chain lesson count. A stale/undecodable account is fine to close
  // (close_course takes an UncheckedAccount and only checks the discriminator)
  // — we just cannot snapshot it, so we degrade to defaults rather than refuse.
  let snapshot: PreCloseSnapshot = {
    totalCompletions: 0,
    totalEnrollments: 0,
    isActive: true,
    collection: null,
  };
  let onChainLessonCount: number | undefined;
  try {
    const onChain = await fetchCourse(courseId, connection, getProgramId());
    if (onChain) {
      snapshot = {
        totalCompletions: Number(onChain.total_completions ?? 0),
        totalEnrollments: Number(onChain.total_enrollments ?? 0),
        isActive: onChain.is_active !== false,
        collection: normalizeCollection(onChain.collection),
      };
      onChainLessonCount = onChain.liveLessonCount;
    }
  } catch {
    // Undecodable (stale layout). Fall back to the content bundle's collection so
    // we can still re-bind it, and leave the counters at 0 — they are already lost.
    // `onChainLessonCount` stays undefined; see the H3 fallback below.
    snapshot.collection = course!.trackCollectionAddress ?? null;
  }
  snapshot.collection ??= course!.trackCollectionAddress ?? null;

  // H3 — never widen lesson_count relative to what is currently live. Default
  // to the on-chain value; refuse if the content bundle wants more. When the
  // live account could not be decoded (fallback above), there is nothing to
  // compare against — degrade to the content bundle's count, same as the
  // collection fallback, rather than blocking every recreate on a decode edge
  // case the #449/WS-1 decoder migration is tracking separately.
  let lessonCount = course!.lessonCount;
  if (onChainLessonCount != null && lessonCount > onChainLessonCount) {
    refuse(
      `Course "${courseId}" content bundle specifies lessonCount=${lessonCount}, but the live ` +
        `on-chain lesson count is ${onChainLessonCount}. Recreating with a LARGER lesson_count ` +
        `would silently un-complete mid-course learners (finalize_course requires every ACTIVE ` +
        `lesson bit set). Refusing — the recreate always preserves the on-chain lesson_count ` +
        `exactly. Add lessons via the ordinary content sync AFTER the recreate.`
    );
  }
  if (onChainLessonCount != null) {
    lessonCount = onChainLessonCount;
  }

  return {
    courseId,
    coursePda,
    snapshot,
    createParams: {
      courseId,
      lessonCount,
      difficulty: difficultyToNumber(course!.difficulty),
      xpPerLesson: course!.xpPerLesson ?? 10,
      trackId: course!.trackId ?? 0,
      trackLevel: course!.trackLevel ?? 0,
      prerequisitePda,
      creatorWallet: creatorWallet!,
      creatorRewardXp: course!.creatorRewardXp ?? 0,
      minCompletionsForReward: course!.minCompletionsForReward ?? 0,
      allowUnusualCreator,
    },
  };
}

/**
 * PHASE 4 — best-effort restore of the two resettable fields, AFTER the create
 * landed. Never throws: the course is already up and correct on the fields that
 * matter, and both of these self-heal on the next ordinary sync (which re-binds
 * an unbound collection). Problems come back as warnings.
 */
async function restoreAfterCreate(plan: RecreatePlan): Promise<string[]> {
  const warnings: string[] = [];

  // Re-BIND the collection that already exists. Never create a new one: credentials
  // already minted point at the old collection address and would be orphaned.
  if (plan.snapshot.collection) {
    const bind = await setCourseCollectionPda(
      plan.courseId,
      plan.snapshot.collection
    );
    if (!bind.success) {
      warnings.push(
        `Collection re-bind failed: ${bind.error ?? "unknown error"}. Credential issuance reverts with CollectionMismatch until you re-sync.`
      );
    }
  }

  // create_course forces is_active = true, which would silently un-hide a course
  // an admin had deliberately deactivated.
  if (!plan.snapshot.isActive) {
    const deactivate = await updateCoursePda({
      courseId: plan.courseId,
      newIsActive: false,
    });
    if (!deactivate.success) {
      warnings.push(
        `Course was deactivated before the recreate but could not be re-deactivated: ${deactivate.error ?? "unknown error"}. It is currently LIVE — re-deactivate it.`
      );
    }
  }

  return warnings;
}

/**
 * Best-effort set/clear of the per-course maintenance gate (rail 3). Never
 * throws — a Supabase write failure here must not block a preflight-validated
 * recreate; `isCourseInMaintenance` fails CLOSED on its own read errors, so the
 * consuming write paths stay safe even if this particular write is lost. Errors
 * are logged loudly since a lost "set" degrades the safety net for the window.
 */
async function setMaintenanceGate(
  courseId: string,
  inMaintenance: boolean
): Promise<void> {
  try {
    await writeCourseMaintenanceFlag(courseId, inMaintenance);
  } catch (err) {
    console.error(
      `[recreate-course] ${courseId}: failed to ${inMaintenance ? "set" : "clear"} the maintenance gate:`,
      err
    );
  }
}

/**
 * Close and recreate a course's on-chain PDA. See the module docstring.
 *
 * @throws {RecreateCourseError} Always check `courseIntact` — `false` means the
 * Course PDA is currently GONE and the course is broken until it is redeployed.
 */
export async function recreateCourse(
  courseId: string,
  allowUnusualCreator = false
): Promise<RecreateCourseResult> {
  const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");

  // 1. PRE-FLIGHT. Nothing below this line runs unless every create param is
  //    resolved and valid (including the mainnet hard-assert and H3 lesson-count
  //    check). Throws with courseIntact: true.
  const plan = await preflightRecreate(
    courseId,
    connection,
    allowUnusualCreator
  );

  // 2. MAINTENANCE GATE ON. From here, on-chain write paths for this course
  //    (lessons/complete, certificates/mint, the webhook finalize path) must
  //    refuse/queue rather than race the absent-PDA window that starts with
  //    the very next step.
  await setMaintenanceGate(courseId, true);

  // 3. CLOSE. From here the course is DOWN until the create lands.
  const closed = await closeCoursePda(courseId);
  if (!closed.success) {
    // The close never landed, so the old PDA is still there, untouched — clear
    // the gate immediately, nothing was destroyed.
    await setMaintenanceGate(courseId, false);
    throw new RecreateCourseError(
      `Failed to close course "${courseId}": ${closed.error ?? "unknown error"}. The course is UNCHANGED and still deployed — nothing was destroyed.`,
      "close",
      true
    );
  }

  // 4. CREATE, hard. Each deployCoursePda call is a fresh `.rpc()`, and Anchor
  //    fetches a new blockhash per call — so a retry is a genuinely new tx, not a
  //    resend of an expired one.
  let createSignature: string | undefined;
  let createAttempts = 0;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= CREATE_ATTEMPTS; attempt++) {
    createAttempts = attempt;
    const created = await deployCoursePda(plan.createParams);
    if (created.success && created.signature) {
      createSignature = created.signature;
      break;
    }
    lastError = created.error ?? "unknown error";
    console.error(
      `[recreate-course] ${courseId}: create attempt ${attempt}/${CREATE_ATTEMPTS} failed: ${lastError}`
    );
    if (attempt < CREATE_ATTEMPTS) await sleep(CREATE_RETRY_DELAY_MS);
  }

  if (!createSignature) {
    // LOUD FAILURE. The close landed, every create attempt failed: the Course PDA
    // is gone. Persist that HONESTLY — leaving a stale `synced` row would have the
    // admin panel claim the course is fine while every enroll/complete_lesson
    // reverts. `not_deployed` is exactly what the status + drift routes already
    // derive from a missing account, so the panel will offer the Deploy button
    // that recreates it.
    //
    // The maintenance gate is deliberately LEFT ON here (not cleared): the
    // course is genuinely down, not just transiently absent, so write paths
    // should keep refusing/queuing until an operator redeploys it — the
    // ordinary Deploy path is expected to clear the gate once it succeeds.
    try {
      await writeCourseOnChainStatus(
        courseId,
        "not_deployed",
        plan.coursePda.toBase58(),
        closed.signature!
      );
    } catch (dbErr) {
      console.error(
        `[recreate-course] ${courseId}: FAILED to persist not_deployed status:`,
        dbErr
      );
    }
    throw new RecreateCourseError(
      `Course "${courseId}" was closed but could NOT be recreated after ${CREATE_ATTEMPTS} attempts (last error: ${lastError}). ` +
        `The course is currently NOT deployed on-chain; use Deploy to recreate it. ` +
        `Enrollments, learner progress and already-minted XP are intact, but enroll/complete_lesson will fail until the Course PDA exists again. ` +
        `Close signature: ${closed.signature}`,
      "create",
      false
    );
  }

  // 5. RESTORE the fields create_course reset. Non-fatal.
  const warnings = await restoreAfterCreate(plan);

  // 6. PERSIST, exactly as the deploy path does.
  await writeCourseOnChainStatus(
    courseId,
    "synced",
    plan.coursePda.toBase58(),
    createSignature
  );

  // 7. MAINTENANCE GATE OFF. The course is back and correct — on-chain write
  //    paths can resume immediately rather than waiting for the operator to do
  //    it manually.
  await setMaintenanceGate(courseId, false);

  return {
    action: "recreated",
    coursePda: plan.coursePda.toBase58(),
    closeSignature: closed.signature!,
    createSignature,
    createAttempts,
    lostCounters: {
      totalCompletions: plan.snapshot.totalCompletions,
      totalEnrollments: plan.snapshot.totalEnrollments,
    },
    warnings,
  };
}
