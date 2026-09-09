/**
 * Build the file set a buildable submission is graded on.
 *
 * DUPLICATED from `apps/web/src/lib/challenge/harness.ts` on purpose:
 * content-lint does not depend on the app — the content repo's
 * validate-content workflow checks the linter out on its own. Keep the two in
 * sync; the whole point of gate 6's Rust oracle is to compile exactly what the
 * runtime grader compiles, which is a TWO-FILE layout, not an append:
 *
 *   /src/lib.rs      `mod _verify;` + the learner's body (harness stripped)
 *   /src/_verify.rs  `use super::*;` + the starter's canonical harness
 *
 * Appending the harness to the end of a file the learner controls lets a
 * trailing `#[cfg(any())]` or a crate-level `#![cfg(any())]` switch it off; as a
 * prepended module it is out of reach. See that module for the full rationale.
 */

/** The line a lesson puts above its harness. Gate 22 requires it. */
export const HARNESS_MARKER =
  "// VERIFICATION HARNESS — DO NOT EDIT ANYTHING BELOW THIS LINE.";

/** A `// ─────` rule line: cosmetic, and part of the harness region. */
const RULE_LINE = /^\s*\/\/\s*[─-]+\s*$/;

/** Crate root. The build server only accepts `^/src/<name>.rs$` paths. */
export const LIB_PATH = "/src/lib.rs";

/** The harness's own module file, referenced from the top of `lib.rs`. */
export const VERIFY_PATH = "/src/_verify.rs";

/** Prepended to the learner's body; a type-level harness defines dead items. */
const VERIFY_DECL = "#[allow(dead_code)]\nmod _verify;\n";

/**
 * Harnesses are written to sit at the bottom of `lib.rs`, so they name
 * crate-root items directly. Glob-importing the crate root at the top of the
 * module file keeps that text valid verbatim.
 */
const VERIFY_PRELUDE = "use super::*;\n";

/**
 * Split `source` at its harness marker. The harness region runs from the rule
 * line(s) immediately above the FIRST marker to end of file — first, so a
 * source that duplicated the harness has every copy stripped.
 */
export function splitHarness(source: string): {
  body: string;
  harness: string;
} {
  const lines = source.split(/\r?\n/);
  const marker = lines.findIndex((l) => l.trim() === HARNESS_MARKER);
  if (marker === -1) return { body: lines.join("\n"), harness: "" };

  let start = marker;
  while (start > 0 && RULE_LINE.test(lines[start - 1] ?? "")) start--;

  return {
    body: lines.slice(0, start).join("\n"),
    harness: lines.slice(start).join("\n"),
  };
}

/**
 * The `[path, content]` pairs to compile for a submission: the learner's body
 * under a prepended `mod _verify;`, plus the starter's canonical harness as that
 * module. A starter carrying no harness has nothing to enforce, so the
 * submission compiles as a lone `lib.rs` — gate 22 keeps such a lesson from
 * shipping in the first place.
 */
export function buildGradeFiles(
  submission: string,
  starter: string
): [string, string][] {
  const { harness } = splitHarness(starter);
  if (!harness) return [[LIB_PATH, submission]];

  const body = splitHarness(submission).body.trimEnd();
  return [
    [LIB_PATH, `${VERIFY_DECL}\n${body}\n`],
    [VERIFY_PATH, `${VERIFY_PRELUDE}${harness.trimEnd()}\n`],
  ];
}
