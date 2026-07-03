import "server-only";

/**
 * Derive a URL-safe slug from a course title, matching the shape Sanity's
 * `slug` type produces (lowercase, hyphen-separated, `maxLength: 96`).
 *
 * A short random suffix is appended so two courses created with the same title
 * do not collide on their slug — the on-chain / catalog layer treats slug as a
 * lookup key, and Sanity does not enforce slug uniqueness on its own.
 */
export function slugifyCourseTitle(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 80);

  const suffix = Math.random().toString(36).slice(2, 8);
  const stem = base.length > 0 ? base : "course";
  return `${stem}-${suffix}`.slice(0, 96);
}
