import {
  assignSlots,
  SlotsLock,
  type SlotsLockT,
} from "@superteam-lms/content-schema";
import { registerCheck, type LintContext } from "../lint";
import { type RepoModel, type CourseEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";
import { mergeBase, gitShow } from "../git";

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

/** The committed lock at the merge-base, or null if new / unavailable. */
function baseLock(ctx: LintContext, course: CourseEntry): SlotsLockT | null {
  if (!ctx.baseRef || !course.slotsPath) return null;
  const base = mergeBase(ctx.root, ctx.baseRef);
  if (!base) return null;
  const text = gitShow(ctx.root, base, course.slotsPath);
  if (text === null) return null;
  const parsed = SlotsLock.safeParse(JSON.parse(text));
  return parsed.success ? parsed.data : null;
}

export function gate3Check(model: RepoModel, ctx: LintContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const course of model.courses) {
    const file = course.slotsPath ?? `${course.dir}/slots.lock.json`;
    if (!course.slotsLock) {
      out.push(
        diag(
          "gate-3",
          "error",
          file,
          "missing or invalid slots.lock.json (run `pnpm content:slots`)"
        )
      );
      continue;
    }
    const displayOrder = course.course.modules.flatMap((m) => m.lessons);
    // KNOWN LIMITATION: regenerating from the merge-base assumes no add-then-remove
    // of the SAME lesson within one PR (which would retire a slot the base never knew
    // about). `pnpm content:slots` regenerates incrementally from the immediately-
    // preceding commit, so a correctly-generated lock always passes; the rare intra-PR
    // churn case is the sync-time re-validation's job (spec §9.2).
    let expected: SlotsLockT;
    try {
      expected = assignSlots(baseLock(ctx, course), displayOrder);
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
          `slots.lock.json does not match regeneration — a slot was changed, reused, or a lesson is missing. Run \`pnpm content:slots\`. Expected ${JSON.stringify(expected)}`
        )
      );
    }
  }
  return out;
}

registerCheck(gate3Check);
