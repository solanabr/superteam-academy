/**
 * Generic "resolve a ref id against a bundle map" helper (#513 WS-C).
 *
 * No such helper existed before this: `courseLessonDocs` and `pathCourseRefIds`
 * (`./queries.ts`) each dereference weak refs by hand and SILENTLY DROP any id
 * that doesn't resolve — fine for the public catalog (a dangling ref should
 * never surface to learners), wrong for an admin content view, where a broken
 * ref is exactly the kind of authoring mistake an operator needs to see.
 *
 * This is intentionally content-agnostic (no import of the bundle store) so it
 * has zero server-only dependencies and is trivial to unit test: callers pass
 * whichever `ReadonlyMap<string, TDoc>` they need resolved against (courses,
 * lessons, paths, ...).
 */

export interface RefResolution<TDoc> {
  /** Docs the ids resolved to, in input order. */
  resolved: TDoc[];
  /** Ids that matched nothing in `byId` — surface these loudly, never drop them. */
  dangling: string[];
}

export function resolveRefs<TDoc>(
  ids: readonly string[],
  byId: ReadonlyMap<string, TDoc>
): RefResolution<TDoc> {
  const resolved: TDoc[] = [];
  const dangling: string[] = [];
  for (const id of ids) {
    const doc = byId.get(id);
    if (doc) {
      resolved.push(doc);
    } else {
      dangling.push(id);
    }
  }
  return { resolved, dangling };
}
