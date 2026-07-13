import "server-only";

import metaJson from "@/content/generated/meta.json";

/**
 * The committed content bundle's `meta.json`, surfaced through `lib/content`
 * (the only place the ESLint `no-restricted-imports` rule permits importing
 * `content/generated/*`). `meta.json` carries no secrets — just the pinned SHA
 * the compiler read from `content.lock` plus per-type counts — but it is routed
 * here so the generated dir keeps a single import seam. `server-only` matches
 * the rest of the store.
 */
export interface ContentMeta {
  /** The courses-academy commit `content.lock` pins (mirrored by the compiler). */
  sha: string;
  /** Per-type document counts in the bundle (courses, lessons, …). */
  counts: Record<string, number>;
  /** ISO timestamp the bundle was compiled, when recorded. */
  compiledAt?: string;
}

export const contentMeta: ContentMeta = metaJson;

/**
 * The commit SHA the committed content bundle was compiled from (SP2-B).
 *
 * Before SP2, the "last-synced" SHA lived in the Sanity `contentSync` singleton
 * and was read at request time. SP2-A moved content into a committed bundle
 * pinned to a single SHA (`apps/web/content.lock`, mirrored into
 * `src/content/generated/meta.json`), so the synced SHA is now a build-time
 * constant: the bundle *is* the synced content. The deploy (`courses/sync`) and
 * status (`admin/status`) routes read this instead of fetching the singleton +
 * a runtime GitHub tarball.
 */
export const SYNCED_SHA: string = contentMeta.sha;
