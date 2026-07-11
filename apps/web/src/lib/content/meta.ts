import "server-only";
import meta from "@/content/generated/meta.json";

/**
 * The committed content bundle's `meta.json`, surfaced through `lib/content`
 * (the only place the ESLint rule permits importing `content/generated/*`).
 * `meta.json` carries no secrets — just the pinned SHA the compiler read from
 * `content.lock` plus per-type counts — but it is routed here so the generated
 * dir keeps a single import seam. `server-only` matches the rest of the store.
 */
export interface ContentMeta {
  /** The courses-academy commit `content.lock` pins (mirrored by the compiler). */
  sha: string;
  /** Per-type document counts in the bundle (courses, lessons, …). */
  counts: Record<string, number>;
  /** ISO timestamp the bundle was compiled, when recorded. */
  compiledAt?: string;
}

export const contentMeta: ContentMeta = meta;
