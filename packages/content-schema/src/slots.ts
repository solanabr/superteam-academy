import { z } from "zod";
import { MAX_LESSON_SLOTS } from "./constants";
import { LessonId } from "./ids";

/**
 * A slot is a permanent on-chain bitmap position, decoupled from display order.
 * Assigned once, never renumbered, never reused. This is what makes reordering,
 * regrouping, inserting and deleting lessons safe for enrolled learners.
 *
 * Machine-owned: `pnpm content:slots` regenerates it and CI fails on a diff.
 */
const Slot = z
  .number()
  .int()
  .min(0)
  .max(MAX_LESSON_SLOTS - 1);

export const SlotsLock = z
  .object({
    version: z.literal(1),
    slots: z.record(LessonId, Slot),
    retired: z.array(Slot).default([]),
    next: z.number().int().min(0).max(MAX_LESSON_SLOTS),
  })
  .refine(
    (l) => {
      const used = Object.values(l.slots);
      return new Set(used).size === used.length;
    },
    { message: "a slot may be assigned to only one lesson", path: ["slots"] }
  )
  .refine(
    (l) => {
      const live = new Set(Object.values(l.slots));
      return l.retired.every((r) => !live.has(r));
    },
    { message: "a retired slot cannot also be live", path: ["retired"] }
  )
  .refine(
    (l) => {
      const all = [...Object.values(l.slots), ...l.retired];
      return all.every((s) => s < l.next);
    },
    {
      message: "next must exceed every assigned and retired slot",
      path: ["next"],
    }
  );

export type SlotsLockT = z.infer<typeof SlotsLock>;

/**
 * Reconcile a lockfile against the course's current lesson list.
 *
 * MIGRATION NOTE: on first run for an already-deployed course, `lessonIds` MUST
 * be the course's LIVE flattened `modules[].lessons[]` order. Existing
 * `Enrollment.lesson_flags` bits were set by array position and the enrollments
 * survive migration (spec §15.3).
 */
export function assignSlots(
  existing: SlotsLockT | null,
  lessonIds: readonly string[]
): SlotsLockT {
  if (lessonIds.length > MAX_LESSON_SLOTS) {
    throw new Error(`a course may hold at most ${MAX_LESSON_SLOTS} lessons`);
  }

  const prev = existing ?? {
    version: 1 as const,
    slots: {},
    retired: [],
    next: 0,
  };
  const slots: Record<string, number> = {};
  let next = prev.next;

  for (const id of lessonIds) {
    const kept = prev.slots[id];
    if (kept !== undefined) {
      slots[id] = kept;
    } else {
      if (next >= MAX_LESSON_SLOTS) {
        throw new Error(
          `slot space exhausted: a course may hold at most ${MAX_LESSON_SLOTS} lessons`
        );
      }
      slots[id] = next;
      next += 1;
    }
  }

  const live = new Set(lessonIds);
  const newlyRetired = Object.entries(prev.slots)
    .filter(([id]) => !live.has(id))
    .map(([, slot]) => slot);

  const retired = [...new Set([...prev.retired, ...newlyRetired])].sort(
    (a, b) => a - b
  );

  return SlotsLock.parse({ version: 1, slots, retired, next });
}
