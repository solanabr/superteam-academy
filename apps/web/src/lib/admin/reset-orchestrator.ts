import type {
  ExpectedByCourseId,
  ExpectedCourseValues,
  ResetSnapshot,
  ResetVerifyResult,
} from "./reset-verify";
import type { RecreateCourseResult, RecreatePlan } from "./recreate-course";
import type { AdminCourse } from "@/lib/content/queries";

/**
 * B3 — bulk v-next devnet reset orchestration (#356), the PURE core.
 *
 * This module is the brain of `scripts/reset-vnext.ts` and is deliberately kept
 * free of every heavy/runtime dependency: it imports the frozen B4 harness
 * (`reset-verify.ts`) and the frozen recreate path (`recreate-course.ts`) as
 * TYPES ONLY. Nothing here loads `server-only`, `env.server`, an RPC
 * connection, or the content bundle — so the whole thing is unit-testable with
 * plain fakes and NEVER hits the chain. The CLI (`scripts/reset-vnext.ts`) is
 * the imperative shell that wires the real implementations into
 * {@link orchestrateReset}.
 *
 * THE NON-NEGOTIABLE. The reset performs close+recreate by calling ONE
 * function — `recreateCourse` from `recreate-course.ts`, the exact function the
 * admin UI route calls — passed in as {@link OrchestrateDeps.recreate}. There
 * is NO second close/create/`close_course` implementation anywhere in this
 * feature. The close lives inside `recreateCourse`; the orchestrator only
 * sequences calls to it and runs the B4 `verifyReset` between each.
 *
 * FAIL-CLOSED + STOP-LOUD are the whole point. Every integrity problem raises a
 * {@link ResetStopError} that the CLI prints and exits non-zero on. A verify
 * failure (or a `recreateCourse` throw) on course N halts the run BEFORE course
 * N+1 is ever touched (#356 §15.3) — a partial reset must never silently roll
 * forward over a broken course.
 */

/** v-next Course account size — a landed recreate is always exactly this. */
export const EXPECTED_VNEXT_SIZE = 253;

/** The #356 creator reward: 30 XP (down from 750). */
export const DEFAULT_CREATOR_REWARD_XP = 30;

/**
 * Devnet's public, stable genesis hash — mirrors the constant inside
 * `recreate-course.ts` (which is not exported). Used by the CLI's belt-and-
 * suspenders devnet assert before any `--execute` (the recreate path re-checks
 * it internally too; this fails the run loudly before the loop even starts).
 */
export const DEVNET_GENESIS_HASH =
  "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

/**
 * The creator guard override is NEVER enabled by the bulk path. A course whose
 * preflight refuses on the creator (denylist / equals the platform authority)
 * MUST stop the run and be surfaced to the operator — a blanket auto-override
 * across every course is forbidden (#356). This constant exists so the value is
 * a single, greppable, test-asserted source of truth.
 */
export const ALLOW_UNUSUAL_CREATOR = false as const;

export type ResetStopPhase =
  | "args"
  | "census"
  | "expected"
  | "devnet"
  | "preflight"
  | "recreate"
  | "verify"
  | "final";

/**
 * A STOP condition. Thrown the instant any integrity check fails; the CLI
 * prints `message` + every entry of `failures` and exits non-zero. The name
 * ("STOP") is the contract: seeing one means the run halted and did NOT proceed
 * to the next course.
 */
export class ResetStopError extends Error {
  constructor(
    message: string,
    readonly failures: string[],
    readonly phase: ResetStopPhase
  ) {
    super(message);
    this.name = "ResetStopError";
  }
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Structural read of a {@link RecreateCourseError} without importing the class
 * (which would drag `server-only` into this pure module). `courseIntact` is the
 * field that matters: `false` means the close landed but the create did not —
 * the course is DOWN.
 */
function recreateFailureIntact(err: unknown): boolean | undefined {
  if (err instanceof Error && "courseIntact" in err) {
    const v = (err as { courseIntact?: unknown }).courseIntact;
    return typeof v === "boolean" ? v : undefined;
  }
  return undefined;
}

function symmetricDiff(a: Set<string>, b: Set<string>): string[] {
  const diff: string[] = [];
  for (const x of a) if (!b.has(x)) diff.push(x);
  for (const x of b) if (!a.has(x)) diff.push(x);
  return diff;
}

// -----------------------------------------------------------------------------
// Argument parsing (pure; testable without the CLI shell)
// -----------------------------------------------------------------------------

/**
 * Parse `--flag value` / boolean `--flag` argv into a flat map. Mirrors the B4
 * `reset-verify.ts` parser: a flag immediately followed by another `--flag`, or
 * at the end of argv, is a boolean and stored as `"true"`.
 */
export function parseFlags(argv: readonly string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token?.startsWith("--")) {
      const key = token.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        flags[key] = "true";
      } else {
        flags[key] = value;
        i++;
      }
    }
  }
  return flags;
}

/** The operator's declared baseline — the census must match these EXACTLY. */
export interface CensusExpectation {
  expectCourses: number;
  expectEnrollments: number;
}

/**
 * Read + validate the two required completeness counts. Both flags are
 * mandatory in BOTH modes (dry-run and execute): the completeness guard is the
 * baseline-integrity check that closes B4's single-RPC blind spot, and it
 * cannot run without an operator-declared expected count.
 */
export function parseCensusExpectation(
  flags: Record<string, string>
): CensusExpectation {
  const parseCount = (name: string): number => {
    const raw = flags[name];
    if (raw === undefined || raw === "true") {
      throw new ResetStopError(
        `--${name} <N> is required (the census completeness guard cannot run without an operator-declared baseline)`,
        [name],
        "args"
      );
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      throw new ResetStopError(
        `--${name} must be a non-negative integer, got "${raw}"`,
        [name],
        "args"
      );
    }
    return n;
  };
  return {
    expectCourses: parseCount("expect-courses"),
    expectEnrollments: parseCount("expect-enrollments"),
  };
}

// -----------------------------------------------------------------------------
// Completeness guard (#356 §1)
// -----------------------------------------------------------------------------

/**
 * PROTOCOL STEP 1 — the completeness guard. Assert the PRE census found EXACTLY
 * the operator's declared counts, with zero undecoded accounts. A census SHORT
 * of the declared count is refused as a partial RPC read — a partial PRE
 * baseline is the one thing that could hide an orphaned enrollment, so this
 * fails closed rather than proceeding on an incomplete baseline.
 *
 * When a `secondary` snapshot (from an independent RPC) is supplied, the two
 * account SETS must match exactly — cross-RPC completeness, closing B4's
 * single-RPC blind spot.
 */
export function assertCensusComplete(
  primary: ResetSnapshot,
  expectation: CensusExpectation,
  secondary?: ResetSnapshot
): void {
  const failures: string[] = [];

  if (primary.undecodedCourses.length > 0) {
    failures.push(
      `${primary.undecodedCourses.length} Course account(s) matched the discriminator but failed to decode ` +
        `(corrupt/partial read — refusing an unreliable baseline): ${primary.undecodedCourses
          .map((u) => u.address)
          .join(", ")}`
    );
  }
  if (primary.undecodedEnrollments.length > 0) {
    failures.push(
      `${primary.undecodedEnrollments.length} Enrollment account(s) matched the discriminator but failed to decode ` +
        `(corrupt/partial read): ${primary.undecodedEnrollments.map((u) => u.address).join(", ")}`
    );
  }

  if (primary.courses.length !== expectation.expectCourses) {
    const short = primary.courses.length < expectation.expectCourses;
    failures.push(
      `census found ${primary.courses.length} course(s) but --expect-courses=${expectation.expectCourses}` +
        (short
          ? " — partial RPC read; refusing to proceed on an incomplete baseline"
          : " — MORE courses on-chain than declared; the operator baseline is stale, refusing")
    );
  }
  if (primary.enrollments.length !== expectation.expectEnrollments) {
    const short = primary.enrollments.length < expectation.expectEnrollments;
    failures.push(
      `census found ${primary.enrollments.length} enrollment(s) but --expect-enrollments=${expectation.expectEnrollments}` +
        (short
          ? " — partial RPC read; refusing to proceed on an incomplete baseline (a missed enrollment is the one thing that could hide an orphan)"
          : " — MORE enrollments on-chain than declared; the operator baseline is stale, refusing")
    );
  }

  if (secondary) {
    if (
      secondary.undecodedCourses.length > 0 ||
      secondary.undecodedEnrollments.length > 0
    ) {
      failures.push(
        "secondary-RPC census has undecoded accounts — corrupt/partial read on the cross-check RPC"
      );
    }
    const courseDiff = symmetricDiff(
      new Set(primary.courses.map((c) => c.coursePda)),
      new Set(secondary.courses.map((c) => c.coursePda))
    );
    const enrollDiff = symmetricDiff(
      new Set(primary.enrollments.map((e) => e.address)),
      new Set(secondary.enrollments.map((e) => e.address))
    );
    if (courseDiff.length > 0) {
      failures.push(
        `cross-RPC course-set mismatch (${courseDiff.length}): ${courseDiff.join(", ")} — ` +
          `one RPC has a partial view; refusing an incomplete baseline`
      );
    }
    if (enrollDiff.length > 0) {
      failures.push(
        `cross-RPC enrollment-set mismatch (${enrollDiff.length}): ${enrollDiff.join(", ")} — ` +
          `one RPC has a partial view; refusing an incomplete baseline`
      );
    }
  }

  if (failures.length > 0) {
    throw new ResetStopError(
      `Census completeness guard FAILED (${failures.length} problem(s)) — refusing to reset on an unverified baseline.`,
      failures,
      "census"
    );
  }
}

// -----------------------------------------------------------------------------
// Expected map (#356 §2) — ALL courses, never omit one
// -----------------------------------------------------------------------------

/**
 * PROTOCOL STEP 2 — build the `expected` map for the FULL census. B4's
 * `verifyReset` only checks courses present in `expected`, so an omitted course
 * would go silently unverified — this builds one entry for EVERY course and
 * refuses (fail-closed) if any course lacks a content-bundle instructor wallet
 * (the whole reason the recreate exists: to set `Course.creator` to the
 * instructor, not the platform authority).
 */
export function buildExpected(
  courses: readonly Pick<AdminCourse, "_id" | "creatorWallet">[],
  rewardXp: number = DEFAULT_CREATOR_REWARD_XP
): ExpectedByCourseId {
  const expected: ExpectedByCourseId = {};
  const missing: string[] = [];
  for (const c of courses) {
    if (!c.creatorWallet) {
      missing.push(c._id);
      continue;
    }
    expected[c._id] = {
      expectedSize: EXPECTED_VNEXT_SIZE,
      expectedCreator: c.creatorWallet,
      expectedRewardXp: rewardXp,
    };
  }
  if (missing.length > 0) {
    throw new ResetStopError(
      `Cannot build the expected map — ${missing.length} course(s) have no instructor/creator wallet in the content bundle: ` +
        `${missing.join(", ")}. A recreate needs the instructor wallet, and a course omitted from 'expected' is never ` +
        `verified (B4 verifyReset only checks courses in the map). Refusing to proceed with an incomplete expected map.`,
      missing,
      "expected"
    );
  }
  return expected;
}

/**
 * Guard: every course present in the PRE census must have an `expected` entry.
 * Catches the "a course missing from expected would go unverified" failure mode
 * directly, independent of how `expected` was built.
 */
/**
 * Look up an expected entry that {@link assertExpectedCoversCensus} has already
 * proven exists. The throw is a belt-and-suspenders internal invariant (it
 * cannot fire after the coverage check) and satisfies `noUncheckedIndexedAccess`.
 */
function requireExpected(
  expected: ExpectedByCourseId,
  courseId: string
): ExpectedCourseValues {
  const exp = expected[courseId];
  if (!exp) {
    throw new ResetStopError(
      `internal invariant: course "${courseId}" is absent from the expected map after the coverage check`,
      [courseId],
      "expected"
    );
  }
  return exp;
}

export function assertExpectedCoversCensus(
  snapshot: ResetSnapshot,
  expected: ExpectedByCourseId
): void {
  const missing = snapshot.courses
    .map((c) => c.courseId)
    .filter((id) => !(id in expected));
  if (missing.length > 0) {
    throw new ResetStopError(
      `${missing.length} on-chain course(s) are NOT in the expected map and would go UNVERIFIED ` +
        `(B4 verifyReset only checks courses present in 'expected'): ${missing.join(", ")}`,
      missing,
      "expected"
    );
  }
}

// -----------------------------------------------------------------------------
// Devnet assert (belt-and-suspenders before --execute)
// -----------------------------------------------------------------------------

/**
 * Refuse to run a destructive reset against anything but devnet. The recreate
 * path re-authenticates the RPC by genesis hash internally, but this asserts it
 * once, loudly, BEFORE the loop even starts — so a misconfigured RPC fails the
 * whole run up front instead of after the first close.
 */
export function assertDevnetGenesis(genesisHash: string): void {
  if (genesisHash !== DEVNET_GENESIS_HASH) {
    throw new ResetStopError(
      `RPC genesis hash "${genesisHash}" does not match devnet (${DEVNET_GENESIS_HASH}) — refusing to --execute ` +
        `a destructive reset against a non-devnet cluster.`,
      [genesisHash],
      "devnet"
    );
  }
}

// -----------------------------------------------------------------------------
// Mode resolution (safety): dry-run by default, destruction gated
// -----------------------------------------------------------------------------

export interface ModeDecision {
  execute: boolean;
  note: string;
}

/**
 * Resolve dry-run vs. destructive execute. Destruction requires BOTH `--execute`
 * AND the typed confirmation token `--i-understand-this-destroys-<N>-courses`
 * where `<N>` is the actual course count. Absent either → dry-run. The token
 * encodes the count, so a stale token (the number of courses changed since the
 * operator wrote the command) fails safe back to dry-run rather than destroying
 * a set the operator did not actually confirm.
 */
export function resolveMode(
  flags: Record<string, string>,
  courseCount: number
): ModeDecision {
  const token = `i-understand-this-destroys-${courseCount}-courses`;
  const wantsExecute = flags.execute === "true";
  const hasToken = flags[token] === "true";
  if (!wantsExecute) {
    return {
      execute: false,
      note: "DRY-RUN (no --execute) — zero destructive calls.",
    };
  }
  if (!hasToken) {
    return {
      execute: false,
      note:
        `--execute was given but the confirmation token --${token} was NOT provided (or its count is wrong) — ` +
        `staying in DRY-RUN. Destruction requires BOTH --execute and --${token}.`,
    };
  }
  return {
    execute: true,
    note: `--execute AND --${token} confirmed — DESTRUCTIVE run.`,
  };
}

// -----------------------------------------------------------------------------
// The recreate binding — the single audited path, override forbidden
// -----------------------------------------------------------------------------

/**
 * Bind the real `recreateCourse` with {@link ALLOW_UNUSUAL_CREATOR} pinned to
 * `false`. This is the ONLY way the orchestrator invokes the recreate, and it
 * is impossible for the bulk path to pass `allowUnusualCreator: true` — a
 * per-course creator refusal (denylist / creator == authority) throws and stops
 * the run instead of being auto-overridden.
 */
export function bindRecreate(
  impl: (
    courseId: string,
    allowUnusualCreator?: boolean
  ) => Promise<RecreateCourseResult>
): (courseId: string) => Promise<RecreateCourseResult> {
  return (courseId) => impl(courseId, ALLOW_UNUSUAL_CREATOR);
}

// -----------------------------------------------------------------------------
// The orchestrator
// -----------------------------------------------------------------------------

export interface OrchestrateDeps {
  /** Full-program structural snapshot (POST re-reads during execute). */
  snapshot: () => Promise<ResetSnapshot>;
  /** Read-only per-course preflight (dry-run "what would change"). */
  preflight: (courseId: string) => Promise<RecreatePlan>;
  /** The single audited close+recreate path — `recreateCourse`, bound via {@link bindRecreate}. */
  recreate: (courseId: string) => Promise<RecreateCourseResult>;
  /** The frozen B4 diff. */
  verify: (
    pre: ResetSnapshot,
    post: ResetSnapshot,
    expected: ExpectedByCourseId
  ) => ResetVerifyResult;
  /** Sink for human-readable progress (CLI passes `console.error`). */
  log: (line: string) => void;
}

export interface OrchestrateConfig {
  /** The validated PRE census (completeness-guarded before this call). */
  preSnapshot: ResetSnapshot;
  /** The full expected map (every census course). */
  expected: ExpectedByCourseId;
  /** `false` → dry-run (no destructive calls); `true` → destructive. */
  execute: boolean;
}

export interface OrchestrateResult {
  /** Course ids that were recreated (empty in dry-run). */
  recreated: string[];
  /** `true` when nothing destructive ran. */
  dryRun: boolean;
  /** The final full-set verify (execute mode only). */
  finalVerify?: ResetVerifyResult;
}

/**
 * PROTOCOL STEPS 3-4 — the sequenced reset.
 *
 * DRY-RUN: census is already done; run the read-only preflight per course and
 * print what WOULD change. ZERO destructive calls. A preflight that refuses
 * (creator denylist, H3 lesson-count widening, missing fields …) is collected
 * as a blocker and the whole dry-run exits non-zero — so the owner's readiness
 * check surfaces every blocker in one pass.
 *
 * EXECUTE, per course IN SEQUENCE:
 *   a. read the live on-chain `lesson_count` from the PRE snapshot (H3 — the
 *      recreate pins to this, never the bundle),
 *   b. `recreate(courseId)` (== `recreateCourse(courseId, false)`),
 *   c. re-snapshot and `verify(pre, post, { [courseId]: … })` — the single-course
 *      invariants PLUS every enrollment's byte-identity,
 *   d. if verify fails OR the recreate threw: STOP immediately, do NOT touch the
 *      next course (#356 §15.3).
 * Then one final `verify` over the FULL expected map: all N courses at 253 with
 * the right creator+reward, all M enrollments byte-identical PRE→POST.
 */
export async function orchestrateReset(
  deps: OrchestrateDeps,
  config: OrchestrateConfig
): Promise<OrchestrateResult> {
  const { snapshot, preflight, recreate, verify, log } = deps;
  const { preSnapshot, expected, execute } = config;

  // A course present on-chain but absent from `expected` would go unverified.
  assertExpectedCoversCensus(preSnapshot, expected);

  const courseIds = preSnapshot.courses.map((c) => c.courseId);

  if (!execute) {
    log(
      `DRY-RUN — ${courseIds.length} course(s) would be recreated. No destructive calls will be made.`
    );
    const blockers: string[] = [];
    for (const courseId of courseIds) {
      const preCourse = preSnapshot.courses.find(
        (c) => c.courseId === courseId
      );
      log(`\n[dry-run] ${courseId}`);
      log(
        `  live on-chain lesson_count (PRE, H3 pin): ${preCourse?.liveLessonCount}`
      );
      try {
        const plan = await preflight(courseId);
        const exp = requireExpected(expected, courseId);
        log(
          `  creator: ${preCourse?.creator} -> ${plan.createParams.creatorWallet} (expect ${exp.expectedCreator})`
        );
        log(
          `  creator_reward_xp -> ${plan.createParams.creatorRewardXp} (expect ${exp.expectedRewardXp})`
        );
        log(
          `  recreate lesson_count: ${plan.createParams.lessonCount} (must equal the H3 pin above)`
        );
        log(
          `  counters that WILL be reset to 0: total_completions=${plan.snapshot.totalCompletions}, total_enrollments=${plan.snapshot.totalEnrollments}`
        );
      } catch (err) {
        const msg = errMsg(err);
        blockers.push(`${courseId}: ${msg}`);
        log(`  BLOCKER: ${msg}`);
      }
    }
    if (blockers.length > 0) {
      throw new ResetStopError(
        `DRY-RUN found ${blockers.length} blocker(s) — NOT ready to execute. Resolve every blocker first.`,
        blockers,
        "preflight"
      );
    }
    log(
      `\nDRY-RUN complete — all ${courseIds.length} course(s) preflight clean. ` +
        `To execute: --execute --i-understand-this-destroys-${courseIds.length}-courses`
    );
    return { recreated: [], dryRun: true };
  }

  // EXECUTE.
  const recreated: string[] = [];
  for (const courseId of courseIds) {
    // 3a. H3 — live on-chain lesson_count from the PRE snapshot, never the bundle.
    const preCourse = preSnapshot.courses.find((c) => c.courseId === courseId);
    log(
      `\n=== Recreating "${courseId}" (PRE on-chain lesson_count=${preCourse?.liveLessonCount}) ===`
    );

    // 3b. The single audited path.
    let result: RecreateCourseResult;
    try {
      result = await recreate(courseId);
    } catch (err) {
      const intact = recreateFailureIntact(err);
      const downNote =
        intact === false
          ? " COURSE IS DOWN — the close landed but the create did not; recover it via the ordinary Deploy path before anything else."
          : " The course is intact (preflight refused or the close never landed).";
      throw new ResetStopError(
        `recreateCourse FAILED for "${courseId}" — halting the run; the next course is NOT touched (#356 §15.3).${downNote}`,
        [errMsg(err)],
        "recreate"
      );
    }
    recreated.push(courseId);
    log(
      `  recreated (create attempts=${result.createAttempts}); counters reset: ` +
        `total_completions=${result.lostCounters.totalCompletions}, total_enrollments=${result.lostCounters.totalEnrollments}`
    );
    for (const w of result.warnings) log(`  WARNING: ${w}`);

    // 3c. Re-snapshot + verify THIS course (single-course expected) AND every
    //     enrollment's byte-identity (verifyReset always checks all PRE enrollments).
    const post = await snapshot();
    const verdict = verify(preSnapshot, post, {
      [courseId]: requireExpected(expected, courseId),
    });
    // 3d. STOP on failure — before the next course is ever touched.
    if (!verdict.ok) {
      throw new ResetStopError(
        `verifyReset FAILED after recreating "${courseId}" — halting the run; the next course is NOT touched (#356 §15.3).`,
        verdict.failures,
        "verify"
      );
    }
    log(
      `  verify OK for "${courseId}" (+ all ${post.enrollments.length} enrollment(s) byte-identical PRE->POST)`
    );
  }

  // 4. Final full-set verify.
  const finalPost = await snapshot();
  const finalVerify = verify(preSnapshot, finalPost, expected);
  if (!finalVerify.ok) {
    throw new ResetStopError(
      `FINAL verifyReset FAILED — the full-set invariants do not hold after recreating all ${recreated.length} course(s).`,
      finalVerify.failures,
      "final"
    );
  }
  log(
    `\nFINAL verify OK: all ${Object.keys(expected).length} course(s) at ${EXPECTED_VNEXT_SIZE}B with the correct ` +
      `creator + reward; all ${finalPost.enrollments.length} enrollment(s) byte-identical PRE->POST.`
  );
  return { recreated, dryRun: false, finalVerify };
}
