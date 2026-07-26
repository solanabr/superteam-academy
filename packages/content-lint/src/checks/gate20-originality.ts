import {
  ALLOWED_LICENSES,
  FORBIDDEN_CORPORA,
  type AttributionT,
} from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

/**
 * Gate 20 — originality & licensing attribution (unified launch spec 2026-07-25
 * §3 item 31, CAT-15). Numbered after §6.2's reserved 1–18 and gate 19 (item 7).
 *
 * The catalog rule is original-by-default: the reference corpora authors are
 * pointed at are all-rights-reserved (program-examples, sealevel-attacks,
 * developer-content, developer-bootcamp-2024, Ackee, Neodyme, Metaplex) or
 * GPL-3.0 (the live solana.com docs/cookbook); only LiteSVM, Mollusk, Surfpool
 * (Apache-2.0) and Trident (MIT) are adaptable. A CI check cannot prove a line
 * of code is original — that is the human review checkbox item 31 asks for at
 * minimum (docs/CONTENT-ORIGINALITY.md). What it CAN do is hold every *declared*
 * adaptation to the allow-list, so the one place an author writes down "I copied
 * this from X" is machine-verified:
 *
 *  20a (error)  the declared `source`/`url` matches a forbidden corpus — a hard
 *               fail regardless of the license typed, because a mislabelled SPDX
 *               id cannot launder an all-rights-reserved / GPL-3.0 corpus.
 *  20b (error)  the declared `license` is not in ALLOWED_LICENSES (Apache-2.0,
 *               MIT).
 *
 * A code block with no `attribution` emits nothing: it is claimed original, and
 * the review checkbox is what attests that.
 */

const ALLOWED = new Set<string>(ALLOWED_LICENSES);

/** Matches an attribution's source + url against the forbidden-corpus needles. */
function forbiddenHit(
  a: AttributionT
): (typeof FORBIDDEN_CORPORA)[number] | undefined {
  const haystack = `${a.source} ${a.url ?? ""}`.toLowerCase();
  return FORBIDDEN_CORPORA.find((c) => haystack.includes(c.pattern));
}

export function gate20Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const entry of model.lessons) {
    for (const raw of entry.lesson.blocks as Record<string, unknown>[]) {
      if (raw.type !== "code") continue;
      const attribution = raw.attribution as AttributionT | undefined;
      if (!attribution) continue; // claimed original — the review checkbox covers it.

      const key = String(raw.key);

      // 20a — forbidden corpus wins over any declared license.
      const hit = forbiddenHit(attribution);
      if (hit) {
        out.push(
          diag(
            "gate-20a",
            "error",
            entry.file,
            `block "${key}" attributes code to "${attribution.source}", which is ${hit.name} — ${hit.reason}; it is a checklist/anchor only and cannot be adapted (CAT-15). Every line of catalog code must be original.`
          )
        );
        continue;
      }

      // 20b — the declared license must be adaptable.
      if (!ALLOWED.has(attribution.license)) {
        out.push(
          diag(
            "gate-20b",
            "error",
            entry.file,
            `block "${key}" declares license "${attribution.license}" for "${attribution.source}" — only ${ALLOWED_LICENSES.join(
              " and "
            )} upstreams (LiteSVM, Mollusk, Surfpool, Trident) may be adapted (CAT-15). Everything else is all-rights-reserved or GPL-3.0; write the sample from scratch.`
          )
        );
      }
    }
  }
  return out;
}

registerCheck(gate20Check);
