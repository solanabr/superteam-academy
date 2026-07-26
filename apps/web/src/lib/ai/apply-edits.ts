import type { CodeEdit } from "./partner-types";

/**
 * Result of applying a propose response's `edits` to the learner's current
 * buffer. `ok` carries the reconstructed file (ready to accept); a failure
 * carries no buffer so the caller degrades to showing the edits textually and
 * NEVER writes a partial/corrupt result back to the editor.
 */
export type ApplyEditsResult = { ok: true; proposed: string } | { ok: false };

/**
 * Apply structured search/replace `edits` to `current`, in order, replacing the
 * FIRST occurrence of each `search`. Deterministic substring matching — no line
 * numbers, no fuzzy context — so a clean apply is unambiguous and a miss is an
 * honest miss (the model's snippet no longer occurs in the live buffer, e.g. the
 * learner edited it since the request). Fails closed: an empty/absent edit list,
 * an empty `search`, or any `search` not found returns `{ ok: false }` and the
 * caller shows the edit textually instead of guessing.
 */
export function applyEdits(
  current: string,
  edits: CodeEdit[]
): ApplyEditsResult {
  if (!Array.isArray(edits) || edits.length === 0) return { ok: false };

  let buffer = current;
  for (const edit of edits) {
    if (typeof edit?.search !== "string" || edit.search.length === 0) {
      return { ok: false };
    }
    const at = buffer.indexOf(edit.search);
    if (at === -1) return { ok: false };
    const replace = typeof edit.replace === "string" ? edit.replace : "";
    buffer =
      buffer.slice(0, at) + replace + buffer.slice(at + edit.search.length);
  }
  return { ok: true, proposed: buffer };
}
