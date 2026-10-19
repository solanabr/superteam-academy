import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import { getAllCoursesAdmin } from "@/lib/content/queries";
import {
  writeCourseOnChainStatus,
  writeCourseMaintenanceFlag,
  acquireCourseMaintenanceGate,
} from "@/lib/content/deployment-writes";
import { recordCourseRecreated } from "@/lib/content/changelog-writes";
import {
  decodeCourse,
  fetchCourse,
  type DecodedCourse,
} from "@/lib/solana/academy-reads";
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
import {
  difficultyToNumber,
  getMissingCourseFields,
  isDraftId,
} from "./sync-diff";

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
 *   2. THE MAINTENANCE GATE. Conditionally ACQUIRED
 *      (`acquireCourseMaintenanceGate`) before the close and cleared
 *      (`writeCourseMaintenanceFlag`) after the create lands. The acquire is
 *      a mutual-exclusion primitive, not a plain write: a SECOND concurrent
 *      recreate for the same course (a UI double-click) fails to acquire and
 *      aborts before ever closing anything, so it can never clear the FIRST
 *      recreate's gate out from under it. The on-chain write paths that can
 *      race the absent-PDA window (`/api/lessons/complete`,
 *      `/api/certificates/mint`, the webhook finalize path in
 *      `lib/helius/event-handlers.ts`) check the gate and refuse/queue
 *      instead of reading a course that may not exist yet. A gate stuck open
 *      by a failed recreate also clears the next time the course transitions
 *      to `"synced"` (e.g. via the ordinary Deploy path) — see
 *      `writeCourseOnChainStatus`.
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
 * LEARNER PROGRESS DOES NOT SURVIVE. On the Pinocchio program, `create_course`
 * stamps the course with a new generation from `Config.course_nonce`, and every
 * enrollment records the generation it was made under. Enrollment PDAs are not
 * touched by `close_course`, but `complete_lesson`, `finalize_course`,
 * `issue_credential` and `upgrade_credential` reject an enrollment from an older
 * generation (`StaleEnrollment`, 6034), and `enroll` re-initialises it in place
 * with empty lesson flags, no `completed_at` and no credential link. So a
 * recreate resets every enrolled learner's on-chain progress in the course.
 * XP already minted to learners and credentials already in their wallets stay.
 *
 * `create_course` also hard-resets `total_completions` and `total_enrollments`
 * to 0, and no instruction can write them back. The pre-flight reads both
 * counters off the live account and returns them in
 * {@link RecreateCourseResult.lostCounters} for operator visibility.
 * `is_active` and `collection` are also reset, but those we CAN restore, and
 * do — see {@link restoreAfterCreate}.
 *
 * MAINNET. Custody stays a single platform key (no Squads, #305 is not
 * coming), so the rule is narrow instead: on mainnet a course can be recreated
 * ONLY while nobody is enrolled (`total_enrollments == 0`), i.e. while a recreate
 * cannot reset anyone's progress. The cluster is identified by the RPC's genesis
 * hash and the network label must agree; anything else is refused (see rail 4
 * in {@link preflightRecreate}). Because `enroll` is learner-signed, the
 * maintenance gate cannot stop it, so after the gate is acquired the course is
 * deactivated (`enroll` then fails `CourseNotActive`) and the count is re-read
 * at or after that slot before the close (see {@link freezeEnrollments}). On
 * mainnet `allowUnusualCreator` is ignored, so the #427 denylist and
 * creator != authority always apply.
 */

/** Create attempts after the close has landed. */
const CREATE_ATTEMPTS = 4;

/** Backoff between create attempts (ms). */
const CREATE_RETRY_DELAY_MS = 1_000;

/**
 * Solana devnet's genesis hash (public, stable — devnet has never been
 * re-genesised). F3 — `NEXT_PUBLIC_SOLANA_NETWORK` is a display label with NO
 * relationship to which RPC `SOLANA_RPC_URL` actually points at; a `"devnet"`
 * label paired with a misconfigured mainnet RPC would otherwise sail past the
 * label check below and close a REAL mainnet course. This authenticates the
 * connection itself, not just the label.
 */
const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

/** Solana mainnet-beta's genesis hash (public, stable). */
const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

/** The two clusters a recreate may run on. */
export type RecreateCluster = "devnet" | "mainnet";

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
 *     the Course PDA does not exist and `enroll` / `complete_lesson` revert until
 *     it is recreated. Learner XP is intact; their on-chain course progress does
 *     not carry over to the recreated course.
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
  /** From the RPC's genesis hash; mainnet adds the zero-enrollment rule. */
  cluster: RecreateCluster;
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

  // Rail 4 — which cluster. The FIRST check, read fresh every call. The RPC's
  // genesis hash identifies the chain (F3: `NEXT_PUBLIC_SOLANA_NETWORK` is a
  // display label that can disagree with `SOLANA_RPC_URL`), and the label must
  // agree with it. Default-deny: a genesis hash we can't read, one that is
  // neither devnet's nor mainnet's, or a label that disagrees (unset included)
  // refuses. Mainnet additionally needs zero enrollments, checked below once the
  // live course is read.
  let genesisHash: string;
  try {
    genesisHash = await connection.getGenesisHash();
  } catch (err) {
    refuse(
      `Could not verify the RPC's genesis hash (${err instanceof Error ? err.message : String(err)}) — ` +
        `refusing to recreate. The network label alone is not sufficient authentication for ` +
        `this destructive operation.`
    );
  }
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  let cluster: RecreateCluster;
  if (genesisHash! === DEVNET_GENESIS_HASH && network === "devnet") {
    cluster = "devnet";
  } else if (
    genesisHash! === MAINNET_GENESIS_HASH &&
    (network === "mainnet" || network === "mainnet-beta")
  ) {
    cluster = "mainnet";
  } else {
    refuse(
      `SOLANA_RPC_URL's genesis hash ("${genesisHash!}") and NEXT_PUBLIC_SOLANA_NETWORK ` +
        `("${network ?? "unset"}") do not identify devnet or mainnet together — recreate needs ` +
        `devnet's genesis (${DEVNET_GENESIS_HASH}) with "devnet", or mainnet's ` +
        `(${MAINNET_GENESIS_HASH}) with "mainnet". Refusing to recreate.`
    );
  }
  // On mainnet the override is ignored: the #427 denylist and
  // creator != authority always apply.
  const allowOverride = cluster! === "devnet" && allowUnusualCreator;

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
    assertCreatorAllowed(creator!, authority!, courseId, allowOverride);
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
  // CURRENT on-chain lesson count. The account is already confirmed to EXIST
  // (the check just above) — so a throw here means the bytes are undecodable
  // (stale/corrupt layout), NOT "not deployed yet" (that case already refused
  // earlier with courseIntact: true). We do NOT degrade to the content
  // bundle's lesson_count in that case: we cannot verify what is currently
  // live, and defaulting to the bundle could silently WIDEN the mask and
  // un-complete mid-course learners — exactly the hole H3 exists to close.
  // Refuse outright rather than guess.
  let snapshot: PreCloseSnapshot = {
    totalCompletions: 0,
    totalEnrollments: 0,
    isActive: true,
    collection: null,
  };
  let onChainLessonCount: number | undefined;
  let liveCourseRead = false;
  try {
    const onChain = await fetchCourse(courseId, connection, getProgramId());
    if (onChain) {
      liveCourseRead = true;
      snapshot = {
        totalCompletions: Number(onChain.total_completions ?? 0),
        totalEnrollments: Number(onChain.total_enrollments ?? 0),
        isActive: onChain.is_active !== false,
        collection: normalizeCollection(onChain.collection),
      };
      onChainLessonCount = onChain.liveLessonCount;
    }
  } catch (err) {
    refuse(
      `Course "${courseId}" exists on-chain but its account data could not be decoded ` +
        `(${err instanceof Error ? err.message : String(err)}) — cannot verify the on-chain ` +
        `lesson count; refusing to recreate. Nothing was closed.`
    );
  }
  snapshot.collection ??= course!.trackCollectionAddress ?? null;

  // Mainnet: only while nobody is enrolled. A recreate gives the course a new
  // generation and every existing enrollment goes stale, so with even one
  // learner enrolled it would reset real progress. `total_enrollments` only
  // ever grows (close_enrollment does not decrement it), so 0 means no
  // enrollment exists for the current generation. An unreadable course counts
  // as "can't prove zero" and refuses. Re-checked after deactivating, right
  // before the close.
  if (cluster! === "mainnet") {
    if (!liveCourseRead) {
      refuse(
        `Could not read course "${courseId}" to confirm it has no enrollments — refusing to recreate on mainnet.`
      );
    }
    if (snapshot.totalEnrollments !== 0) {
      refuse(
        `Course "${courseId}" has ${snapshot.totalEnrollments} enrollment(s). On mainnet a course can only be ` +
          `recreated while nobody is enrolled, because a recreate resets every enrolled learner's progress. ` +
          `Nothing was closed.`
      );
    }
  }

  // H3 — never widen lesson_count relative to what is currently live. Default
  // to the on-chain value; refuse if the content bundle wants more. An
  // undecodable account is refused above, so `onChainLessonCount` reaching
  // here as `undefined` only happens when `fetchCourse` resolves falsy without
  // throwing — treated the same as "nothing to compare against yet".
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
    cluster: cluster!,
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
      allowUnusualCreator: allowOverride,
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
 * CLEAR the per-course maintenance gate (rail 3). Never throws — returns
 * whether the write succeeded. Best-effort: a lost clear just leaves the gate
 * on longer than necessary, which is safe by construction
 * (`isCourseInMaintenance` fails CLOSED on its own read errors too, so write
 * paths never trust an unconfirmed state either way) — and F1(a) gives a
 * stuck gate a second, independent recovery path via the next `synced` write.
 * Errors are still logged loudly since a lost clear degrades the operator
 * experience (the gate stays on until the next sync).
 */
async function clearMaintenanceGate(courseId: string): Promise<boolean> {
  try {
    await writeCourseMaintenanceFlag(courseId, false);
    return true;
  } catch (err) {
    console.error(
      `[recreate-course] ${courseId}: failed to clear the maintenance gate:`,
      err
    );
    return false;
  }
}

/** Why an acquire attempt did not result in holding the gate. */
type AcquireFailureReason = "held" | "error";

/**
 * ACQUIRE the per-course maintenance gate (rail 3 + F2 mutual exclusion).
 * This is the FIRST gate operation `recreateCourse` performs, strictly before
 * `close_course` — so a caller that does not acquire NEVER reaches close or
 * any clear. That ordering is what makes every subsequent clear in this
 * module safe to be unconditional: only the acquirer gets far enough to call
 * one.
 *
 * Two distinct failure reasons, because they need different messages (but
 * are both fatal — ABORT before the close ever runs either way):
 *   - `"held"`  — a DIFFERENT recreate already holds the gate
 *     ({@link acquireCourseMaintenanceGate} returned `false`). Nothing is
 *     wrong; this caller must simply not proceed concurrently.
 *   - `"error"` — the acquire attempt itself failed (DB error). A LOST
 *     acquire must not be treated as "proceed anyway": the entire point of
 *     this rail is that on-chain write paths refuse/queue instead of racing
 *     the absent-PDA window, so an unconfirmed gate state means we cannot
 *     safely close.
 */
async function tryAcquireMaintenanceGate(
  courseId: string
): Promise<{ ok: true } | { ok: false; reason: AcquireFailureReason }> {
  try {
    const acquired = await acquireCourseMaintenanceGate(courseId);
    return acquired ? { ok: true } : { ok: false, reason: "held" };
  } catch (err) {
    console.error(
      `[recreate-course] ${courseId}: failed to acquire the maintenance gate:`,
      err
    );
    return { ok: false, reason: "error" };
  }
}

/**
 * Put `is_active` back after a mainnet recreate stopped short of the close
 * (only if it was active before). Never throws; returns a note for the error.
 */
async function reactivate(plan: RecreatePlan): Promise<string> {
  if (!plan.snapshot.isActive) return "";
  const on = await updateCoursePda({
    courseId: plan.courseId,
    newIsActive: true,
  });
  return on.success
    ? ""
    : ` The course was left INACTIVE (re-activating failed: ${on.error ?? "unknown error"}) — re-activate it.`;
}

/**
 * MAINNET only, with the gate held and before the close. `enroll` is
 * learner-signed, so the maintenance gate cannot stop it: deactivate the course
 * (`enroll` then fails `CourseNotActive`), then re-read it at or after the
 * deactivation's slot and require it inactive with zero enrollments. Any
 * failure puts `is_active` back, clears the gate and throws with nothing closed.
 */
async function freezeEnrollments(
  plan: RecreatePlan,
  connection: Connection
): Promise<void> {
  const { courseId } = plan;
  const abort = async (reason: string): Promise<never> => {
    const note = await reactivate(plan);
    await clearMaintenanceGate(courseId);
    throw new RecreateCourseError(
      `${reason} Nothing was closed.${note}`,
      "preflight",
      true
    );
  };

  const off = await updateCoursePda({ courseId, newIsActive: false });
  if (!off.success || !off.signature) {
    return abort(
      `Could not deactivate course "${courseId}" before the mainnet recreate (${off.error ?? "unknown error"}).`
    );
  }

  let recheck: DecodedCourse | null;
  try {
    const status = await connection.getSignatureStatus(off.signature);
    const slot = status.value?.slot;
    if (slot == null) {
      return abort(
        `Could not confirm the deactivation of course "${courseId}" on this RPC.`
      );
    }
    const info = await connection.getAccountInfo(plan.coursePda, {
      commitment: "confirmed",
      minContextSlot: slot,
    });
    recheck = info ? decodeCourse(info.data) : null;
  } catch (err) {
    return abort(
      `Could not re-read course "${courseId}" after deactivating it (${err instanceof Error ? err.message : String(err)}).`
    );
  }
  if (!recheck || recheck.is_active) {
    return abort(
      `Course "${courseId}" did not read back as inactive after deactivating it.`
    );
  }
  if (recheck.total_enrollments !== 0) {
    return abort(
      `Course "${courseId}" now has ${recheck.total_enrollments} enrollment(s): someone enrolled after the ` +
        `pre-flight. On mainnet a course can only be recreated while nobody is enrolled.`
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
  //    resolved and valid (including the cluster rail, the mainnet
  //    zero-enrollment rule and the H3 lesson-count check). Throws with
  //    courseIntact: true.
  const plan = await preflightRecreate(
    courseId,
    connection,
    allowUnusualCreator
  );

  // 2. MAINTENANCE GATE ON — a CONDITIONAL ACQUIRE (F2 mutual exclusion). From
  //    here, on-chain write paths for this course (lessons/complete,
  //    certificates/mint, the webhook finalize path) must refuse/queue rather
  //    than race the absent-PDA window that starts with the very next step. A
  //    LOST or CONTENDED acquire ABORTS before the close ever runs — this is
  //    the FIRST gate operation in the function, and short-circuits BEFORE
  //    close_course, so a caller that loses the race here never reaches close
  //    or clear at all. That ordering is what makes two concurrent recreates
  //    for the same course safe: only one of them can ever hold the gate, so
  //    only one of them can ever close/clear it.
  const acquired = await tryAcquireMaintenanceGate(courseId);
  if (!acquired.ok) {
    const message =
      acquired.reason === "held"
        ? `A recreate is already in progress for course "${courseId}" — refusing to start a second one ` +
          `concurrently. The course is UNCHANGED and still deployed.`
        : `Could not set the maintenance gate for course "${courseId}" — refusing to close. ` +
          `The course is UNCHANGED and still deployed; retry once the gate write succeeds.`;
    throw new RecreateCourseError(message, "preflight", true);
  }

  // 2b. MAINNET: stop new enrollments and re-check the count before closing.
  if (plan.cluster === "mainnet") {
    await freezeEnrollments(plan, connection);
  }

  // 3. CLOSE. From here the course is DOWN until the create lands.
  const closed = await closeCoursePda(courseId);
  if (!closed.success) {
    // The close never landed, so the old PDA is still there, untouched — clear
    // the gate immediately, nothing was destroyed. Safe unconditionally: step 2
    // guarantees only the acquirer ever reaches this line. On mainnet step 2b
    // deactivated it, so put that back first.
    const note = plan.cluster === "mainnet" ? await reactivate(plan) : "";
    await clearMaintenanceGate(courseId);
    throw new RecreateCourseError(
      `Failed to close course "${courseId}": ${closed.error ?? "unknown error"}. The course is UNCHANGED and still deployed — nothing was destroyed.${note}`,
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
        `Already-minted XP is unaffected, but enrolled learners' on-chain progress does not carry over to the recreated course, and enroll/complete_lesson fail until the Course PDA exists again. ` +
        `Close signature: ${closed.signature}`,
      "create",
      false
    );
  }

  // 5. RESTORE the fields create_course reset. Non-fatal.
  const warnings = await restoreAfterCreate(plan);

  // 6. PERSIST, exactly as the deploy path does. F1(b) — swallow-and-log
  //    (matching the not_deployed persist above) rather than letting a throw
  //    here escape: the create already landed and the course IS genuinely
  //    fine, so a transient DB blip on this write must not be able to skip
  //    step 7 below. (The write's own success also clears in_maintenance as
  //    part of the same upsert — see writeCourseOnChainStatus — so this is a
  //    defense-in-depth backstop specifically for the case where the write
  //    itself fails.)
  try {
    await writeCourseOnChainStatus(
      courseId,
      "synced",
      plan.coursePda.toBase58(),
      createSignature
    );
  } catch (dbErr) {
    console.error(
      `[recreate-course] ${courseId}: FAILED to persist synced status:`,
      dbErr
    );
  }

  // 7. MAINTENANCE GATE OFF. The course is back and correct — on-chain write
  //    paths can resume immediately rather than waiting for the operator to do
  //    it manually. Unconditionally reached even if step 6 threw (see above).
  await clearMaintenanceGate(courseId);

  // 8. CHANGELOG (#738). Record the recreate — the most dramatic on-chain
  //    mutation, and previously silent. Non-fatal and last: the course is
  //    already up, restored, and the gate is cleared, so a changelog blip must
  //    not affect any of that. create_course reset version to 1; lessonCount is
  //    the live count preserved through the recreate (H3 never widens it).
  try {
    await recordCourseRecreated({
      courseId,
      txSignature: createSignature,
      lessonCount: plan.createParams.lessonCount,
    });
  } catch (changelogErr) {
    console.error(
      `[recreate-course] ${courseId}: changelog write failed:`,
      changelogErr
    );
  }

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
