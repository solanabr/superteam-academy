import { BlastRadiusError, type SanityDoc } from "./types";

const SOURCE = "academy-courses";

/** GROQ that selects prunable ids: our marker, a stale rev. Parameterised by $sha. */
export function prunableQuery(): string {
  return '*[sync.source == "academy-courses" && sync.rev != $sha]._id';
}

/**
 * Docs to delete after a full write: ours (matching `sync.source`) whose `_id`
 * is absent from the new tree (`projectedIds`). Computed purely from the
 * pre-write managed read + the projected id set — never from a post-write
 * read-back — so an async / lagging managed-read can never place a just-written
 * doc in the delete set (the read-your-writes race). Documents without our
 * marker — image assets, hand-created docs, drafts — are untouchable
 * (spec §9.4 guard 2).
 */
export function selectPrunable(
  existing: SanityDoc[],
  projectedIds: ReadonlySet<string>
): SanityDoc[] {
  return existing.filter(
    (d) => d.sync?.source === SOURCE && !projectedIds.has(d._id)
  );
}

/** Blast-radius guard (spec §9.4 guard 4): abort if prune > 20% of managed docs. */
export function assertBlastRadius(
  pruneCount: number,
  managedTotal: number
): void {
  if (managedTotal > 0 && pruneCount > managedTotal * 0.2) {
    throw new BlastRadiusError(pruneCount, managedTotal);
  }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)])
    );
  }
  return value;
}

const stable = (d: SanityDoc): string => {
  const { _rev, _createdAt, _updatedAt, ...rest } = d as Record<
    string,
    unknown
  >;
  void _rev;
  void _createdAt;
  void _updatedAt;
  return JSON.stringify(sortKeys(rest));
};

/**
 * Idempotency core (Global Constraints): only the docs whose projected value
 * differs from the existing doc. Re-running at the same sha yields [] because
 * `sync.rev` is identical and every projected field is a pure function of the
 * repo. PRESERVE fields must already be reattached onto `projected` (Task 6/8)
 * so an unchanged onChainStatus does not register as a diff.
 */
export function selectChangedDocs(
  existing: SanityDoc[],
  projected: SanityDoc[]
): SanityDoc[] {
  const byId = new Map(existing.map((d) => [d._id, d]));
  return projected.filter((p) => {
    const cur = byId.get(p._id);
    return !cur || stable(cur) !== stable(p);
  });
}
