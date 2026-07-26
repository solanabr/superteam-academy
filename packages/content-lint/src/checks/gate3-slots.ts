import {
  assignSlots,
  SlotsLock,
  type SlotsLockT,
} from "@superteam-lms/content-schema";
import { registerCheck, type LintContext } from "../lint";
import { type RepoModel, type CourseEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";
import { mergeBase, gitShow, resolveLocalBase } from "../git";

/** Order-independent structural equality of two locks. */
function locksEqual(a: SlotsLockT, b: SlotsLockT): boolean {
  if (a.version !== b.version || a.next !== b.next) return false;
  const ak = Object.keys(a.slots);
  const bk = Object.keys(b.slots);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a.slots[k] !== b.slots[k]) return false;
  const ar = [...a.retired].sort((x, y) => x - y).join(",");
  const br = [...b.retired].sort((x, y) => x - y).join(",");
  return ar === br;
}

/** The committed lock at the given base ref, or null if new / unavailable. */
function baseLock(
  ctx: LintContext,
  course: CourseEntry,
  baseRef: string | null
): SlotsLockT | null {
  if (!baseRef || !course.slotsPath) return null;
  const text = gitShow(ctx.root, baseRef, course.slotsPath);
  if (text === null) return null;
  const parsed = SlotsLock.safeParse(JSON.parse(text));
  return parsed.success ? parsed.data : null;
}

/** Emitted once when no base ref is resolvable — the check is skipped, not failed. */
function missingLockDiag(course: CourseEntry): Diagnostic {
  const file = course.slotsPath ?? `${course.dir}/slots.lock.json`;
  // A brand-new course with no lock file yet is the ONLY safe place to generate a
  // fresh 0-N assignment. A present-but-unparseable lock is different: the course
  // may already be deployed, so we flag it for a human instead of inviting a
  // from-scratch regeneration that would renumber live slots.
  const message =
    course.slotsPath === null
      ? "missing slots.lock.json — a new course needs one generated from its lesson order"
      : "slots.lock.json is present but does not parse against the schema — fix it by hand; do NOT regenerate a deployed course's lock from scratch (that renumbers live slots)";
  return diag("gate-3", "error", file, message);
}

export function gate3Check(model: RepoModel, ctx: LintContext): Diagnostic[] {
  const out: Diagnostic[] = [];

  // CI sets ctx.baseRef; a bare local run does not. Fall back to a remote-tracking
  // default (origin/HEAD → origin/main) so a correct lock validates locally too,
  // instead of being regenerated from scratch and reported as a false mismatch (#737).
  const resolvedRef = ctx.baseRef ?? resolveLocalBase(ctx.root);

  // Resolve the fork point ONCE (same baseRef for every course). A degrade to the
  // base tip (e.g. a shallow --depth=1 fetch) makes the slots-lock immutability
  // comparison inexact, so surface it — never silently — exactly once.
  const base = resolvedRef ? mergeBase(ctx.root, resolvedRef) : null;

  // No base ref at all (no CI ref, no origin remote): slot immutability CANNOT be
  // verified — the base state to diff against is unknown. Never regenerate a fresh
  // 0-N lock and assert a mismatch against a correct one (#737); say the check was
  // skipped and only catch a genuinely missing lock, which needs no base ref.
  if (!base) {
    out.push(
      diag(
        "gate-3",
        "warning",
        "",
        "slot immutability not checked — no base ref (set GITHUB_BASE_REF, or fetch origin/main with full history). Slot invariants are verified in CI."
      )
    );
    for (const course of model.courses) {
      if (!course.slotsLock) out.push(missingLockDiag(course));
    }
    return out;
  }

  if (!base.exact) {
    out.push(
      diag(
        "gate-3",
        "warning",
        "",
        `could not compute an exact merge-base with "${resolvedRef}" (shallow base?) — regenerating slots against the base TIP instead of the fork point; results may be inaccurate. Fetch the base with full history (fetch-depth: 0).`
      )
    );
  }
  const baseRef = base.ref;

  for (const course of model.courses) {
    const file = course.slotsPath ?? `${course.dir}/slots.lock.json`;
    if (!course.slotsLock) {
      out.push(missingLockDiag(course));
      continue;
    }
    const displayOrder = course.course.modules.flatMap((m) => m.lessons);
    // KNOWN LIMITATION: regenerating from the merge-base assumes no add-then-remove
    // of the SAME lesson within one PR (which would retire a slot the base never knew
    // about). The generator regenerates incrementally from the base lock, so a
    // correctly-generated lock always passes; the rare intra-PR churn case is the
    // sync-time re-validation's job (spec §9.2).
    let expected: SlotsLockT;
    try {
      expected = assignSlots(baseLock(ctx, course, baseRef), displayOrder);
    } catch (err) {
      out.push(
        diag(
          "gate-3",
          "error",
          file,
          err instanceof Error ? err.message : String(err)
        )
      );
      continue;
    }
    if (!locksEqual(course.slotsLock, expected)) {
      out.push(
        diag(
          "gate-3",
          "error",
          file,
          // A slot is a permanent on-chain progress-bit position for enrolled
          // learners. The remedy is to REPAIR the lock, never to regenerate it:
          // regenerating a deployed course renumbers every slot and corrupts
          // learner progress (#737).
          `slots.lock.json violates the slot invariant — surviving lessons must keep their assigned slot, retired slots are never reused, and \`next\` only grows. ` +
            `Fix the lock BY HAND to preserve every slot already assigned in the base ref (diff it: \`git show <base>:${file}\`). ` +
            `DANGER: do NOT run any regenerate-from-scratch command on a deployed course — it renumbers slots and re-points every already-enrolled learner's completed-lesson bitmap. Regeneration is ONLY for a brand-new course that has never been deployed. ` +
            `Expected ${JSON.stringify(expected)}`
        )
      );
    }
  }
  return out;
}

registerCheck(gate3Check);
