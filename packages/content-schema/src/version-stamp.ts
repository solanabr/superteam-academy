import { z } from "zod";

/**
 * Version stamp (unified launch spec 2026-07-25 §3 item 8). A machine-readable
 * record of the exact package versions a lesson was authored against, plus the
 * date that pin was last verified current. CI (content-lint gate 21) reads it
 * and warns when a pin has drifted from the registry's `latest` — the catch
 * mechanism for the failure mode that rotted every competitor's material
 * (CAT-13: Kit 8 canary publishes daily, @solana/react pins kit exactly, C5
 * deliberately pins the kit-6 shelf while C1–C4 pin 7). This is load-bearing,
 * not hygiene.
 *
 * Optional on the lesson (see lesson.ts) — the field is opt-in, exactly like
 * `tutorNotes`/`failureMessage`. Existing content carries none; stamps land via
 * content PRs. A lesson without a stamp is checked by nothing.
 */

// An EXACT, pinned version — semver 2.0 core plus optional prerelease/build.
// Range operators (^, ~, x, >=, ...) are rejected on purpose: the stamp records
// the ONE version the lesson was authored and verified against, and a range
// cannot drift, which is the whole signal the currency check reads.
const EXACT_SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export const PinnedVersion = z
  .string()
  .regex(
    EXACT_SEMVER,
    "must be an exact semver version, e.g. 7.0.0 or 8.0.0-canary.1 — no ranges (^, ~, x, >=)"
  );

// npm package name: optional lowercase scope + name, url-safe. Mirrors npm's own
// validation surface closely enough to reject a typo'd or upper-cased name at
// authoring time rather than at a registry 404.
const NPM_PACKAGE_NAME =
  /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export const PackageName = z
  .string()
  .min(1)
  .max(214) // npm's hard limit on package-name length.
  .regex(NPM_PACKAGE_NAME, "must be a valid lowercase npm package name");

/** Real calendar date, `YYYY-MM-DD` — not just the shape, the actual day. */
function isRealDate(s: string): boolean {
  const parts = s.split("-");
  if (parts.length !== 3) return false;
  const [y, m, d] = parts.map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO date, YYYY-MM-DD")
  .refine(isRealDate, "not a real calendar date");

/** Upper bound on the pin set — a stamp lists a handful of load-bearing deps, not a lockfile. */
const MAX_PINNED_PACKAGES = 20;

export const VersionStamp = z.object({
  /** The day this pin set was last verified current against the registry. */
  checkedAt: IsoDate,
  /**
   * package name → exact version the lesson was authored against. Non-empty; a
   * record so a name can appear at most once.
   */
  packages: z
    .record(PackageName, PinnedVersion)
    .refine((r) => Object.keys(r).length >= 1, {
      message: "version stamp must pin at least one package",
    })
    .refine((r) => Object.keys(r).length <= MAX_PINNED_PACKAGES, {
      message: `a version stamp may pin at most ${MAX_PINNED_PACKAGES} packages`,
    }),
});

export type VersionStampT = z.infer<typeof VersionStamp>;
