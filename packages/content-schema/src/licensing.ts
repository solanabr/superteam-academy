import { z } from "zod";

/**
 * Code-sample licensing policy (unified launch spec 2026-07-25 §3 item 31,
 * CAT-15; catalog-redesign spec §Licensing).
 *
 * The catalog rule is **original-by-default**: "every word and every line of
 * example code in this catalog is original." The reference corpora authors are
 * pointed at are technical anchors, coverage checklists and outbound links — NOT
 * copy sources. This module encodes the one machine-checkable corner of that
 * rule: when a code block *declares* it adapted an upstream (the `attribution`
 * field), content-lint gate 20 checks that the upstream is actually adaptable.
 *
 * It cannot prove originality of undeclared code — that is a human review step
 * (the content-repo PR-template originality checkbox, see docs/CONTENT-ORIGINALITY.md).
 * This is the assist, not the proof.
 */

/**
 * SPDX ids of the only licenses whose code may be adapted into the catalog.
 * CAT-15: LiteSVM, Mollusk and Surfpool are Apache-2.0; Trident is MIT — the
 * testing layer C3 needs, and the only corpora that may be adapted at all.
 * Everything else is all-rights-reserved (no license) or GPL-3.0 (copyleft,
 * incompatible with this repo).
 */
export const ALLOWED_LICENSES = ["Apache-2.0", "MIT"] as const;
export type AllowedLicense = (typeof ALLOWED_LICENSES)[number];

/**
 * The corpora authors are told to treat as checklists/anchors only, keyed by a
 * lowercase substring matched against an attribution's `source` and `url`. A
 * declared adaptation of any of these is a hard fail *regardless of the license
 * the author typed* — a mislabelled SPDX id cannot launder an all-rights-reserved
 * or GPL-3.0 corpus (CAT-15, catalog-redesign spec §Licensing).
 */
export const FORBIDDEN_CORPORA: readonly {
  /** Human name for the diagnostic. */
  name: string;
  /** Lowercase needle matched against `source` + `url`. */
  pattern: string;
  /** Why it cannot be adapted. */
  reason: string;
}[] = [
  {
    name: "solana-foundation/program-examples",
    pattern: "program-examples",
    reason: "no license = all-rights-reserved",
  },
  {
    name: "coral-xyz/sealevel-attacks",
    pattern: "sealevel-attacks",
    reason: "no license = all-rights-reserved",
  },
  {
    name: "archived developer-content courses",
    pattern: "developer-content",
    reason: "no license = all-rights-reserved",
  },
  {
    name: "developer-bootcamp-2024",
    pattern: "developer-bootcamp",
    reason: "no license = all-rights-reserved",
  },
  {
    name: "Ackee school",
    pattern: "ackee",
    reason: "no license = all-rights-reserved",
  },
  {
    name: "Neodyme",
    pattern: "neodyme",
    reason: "no license = all-rights-reserved",
  },
  {
    name: "Metaplex docs / mpl-core",
    pattern: "metaplex",
    reason: "all-rights-reserved (mpl-core is a bespoke non-standard license)",
  },
  {
    name: "live Solana docs / cookbook (solana-com)",
    pattern: "solana.com",
    reason: "GPL-3.0 — copyleft, incompatible with this repo",
  },
] as const;

/**
 * An optional per-code-block adaptation declaration. Absent = the block is
 * claimed original (the catalog default), and gate 20 says nothing. Present =
 * the author is asserting an upstream, and gate 20 holds them to the allow-list.
 *
 * Shape only lives here; the license allow-list and forbidden-corpus resolution
 * are gate 20's job (mirroring gate 19: slug *shape* in schema, vocabulary
 * *resolution* in the gate) so a bad value yields an educational gate-20 error
 * naming the finding, not a terse gate-1 schema rejection.
 */
export const Attribution = z.object({
  /** The upstream project the code was adapted from (e.g. "LiteSVM"). */
  source: z.string().min(1),
  /** The upstream's SPDX license id; checked against ALLOWED_LICENSES by gate 20. */
  license: z.string().min(1),
  /** Optional link to the upstream. */
  url: z.string().url().optional(),
});
export type AttributionT = z.infer<typeof Attribution>;
