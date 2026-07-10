import type { ManagedType, SanityDoc } from "./types";

/** Sanity-owned fields that survive a re-sync (spec §9.3). */
export const PRESERVE: Record<ManagedType, string[]> = {
  course: ["onChainStatus"],
  achievement: ["onChainStatus"],
  lesson: [],
  instructor: [],
  learningPath: [],
  quest: [],
};

/**
 * Fields the projector writes per type (Task 6). Kept in lockstep with
 * projector.ts; the CI equality below fails the build if the two diverge from
 * the Sanity schema.
 */
export const PROJECTED_FIELDS: Record<ManagedType, string[]> = {
  course: [
    "title",
    "slug",
    "description",
    "difficulty",
    "duration",
    "xpPerLesson",
    "xpReward",
    "trackId",
    "trackLevel",
    "creatorRewardXp",
    "minCompletionsForReward",
    "tags",
    "instructor",
    "prerequisiteCourse",
    "modules",
    "thumbnail",
  ],
  lesson: ["title", "slug", "blocks"],
  instructor: ["name", "wallet", "avatar", "bio", "socialLinks"],
  learningPath: [
    "title",
    "slug",
    "description",
    "tag",
    "order",
    "difficulty",
    "courses",
  ],
  achievement: [
    "name",
    "description",
    "icon",
    "category",
    "xpReward",
    "maxSupply",
    "award",
  ],
  quest: [
    "name",
    "description",
    "type",
    "targetValue",
    "xpReward",
    "resetType",
    "active",
  ],
};

/** System fields Sanity always adds; excluded from the equality check. */
const SYSTEM_FIELDS = new Set([
  "_id",
  "_type",
  "_rev",
  "_createdAt",
  "_updatedAt",
  "_key",
]);

/**
 * Copy PRESERVE fields from the existing doc onto the projected doc, so a
 * whole-document `createOrReplace` does not erase Sanity-owned state (§9.3).
 */
export function reattachPreserved(
  projected: SanityDoc,
  existing: SanityDoc | undefined
): SanityDoc {
  if (!existing) return projected;
  const keep = PRESERVE[projected._type as ManagedType] ?? [];
  const out: SanityDoc = { ...projected };
  for (const field of keep) {
    if (existing[field] !== undefined) out[field] = existing[field];
  }
  return out;
}

/**
 * Build-time invariant (spec §9.3): every Sanity field is projected, preserved,
 * the sync marker, or a system field. A Sanity-owned field added without adding
 * it to PRESERVE throws here — it would otherwise be silently wiped on sync.
 */
export function assertSchemaFieldsCovered(
  type: ManagedType,
  sanityFields: string[]
): void {
  const allowed = new Set([
    ...PROJECTED_FIELDS[type],
    ...PRESERVE[type],
    "sync",
  ]);
  const orphans = sanityFields.filter(
    (f) => !SYSTEM_FIELDS.has(f) && !allowed.has(f)
  );
  if (orphans.length > 0) {
    throw new Error(
      `Sanity ${type} has unregistered field(s) [${orphans.join(", ")}]: add to PROJECTED_FIELDS or PRESERVE`
    );
  }
}
