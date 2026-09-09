/**
 * Build the file set a buildable submission is graded on: the learner's body in
 * `/src/lib.rs`, the lesson's canonical verification harness in its OWN file.
 *
 * A buildable challenge is graded by compiling it (see `buildable-executor.ts`),
 * so the only thing that makes the grade mean anything is the harness the lesson
 * ships at the bottom of its starter: a type-level check that references the
 * symbols the exercise asks for. Left in the learner's buffer the harness is
 * just text they can delete — and `pub fn nothing() {}` compiles fine against
 * the build server's template Cargo.toml. So the server grader (and, so it
 * agrees, the browser pre-check) strips whatever harness region the submission
 * carries and compiles the STARTER's canonical one alongside it.
 *
 * WHY A SEPARATE FILE, NOT AN APPEND. Appending the harness to the end of a file
 * the learner fully controls lets the text just above it switch the harness off:
 *
 *   - a submission ending in a dangling `#[cfg(any())]` binds that attribute to
 *     the appended `mod verify` and removes it;
 *   - a crate-level `#![cfg(any())]` strips the whole crate, harness included.
 *
 * Both compiled clean and paid XP. With the harness in `/src/_verify.rs` and
 * `mod _verify;` PREPENDED to the body, no trailing attribute can reach it (it
 * dangles at EOF → `expected item after attributes`) and an inner attribute
 * after the module declaration is a hard error (`an inner attribute is not
 * permitted in this context`). A learner redefining `_verify` collides with the
 * declaration. All three fail closed.
 *
 * Pure and dependency-free — it runs on the server grader and in the browser.
 * Line endings are normalised to LF so a CRLF submission splices identically.
 */

/** The line a lesson puts above its harness. Content CI (gate 22) requires it. */
export const HARNESS_MARKER =
  "// VERIFICATION HARNESS — DO NOT EDIT ANYTHING BELOW THIS LINE.";

/** A `// ─────` rule line: cosmetic, and part of the harness region. */
const RULE_LINE = /^\s*\/\/\s*[─-]+\s*$/;

/** Crate root. The build server only accepts `^/src/<name>.rs$` paths. */
export const LIB_PATH = "/src/lib.rs";

/** The harness's own module file, referenced from the top of `lib.rs`. */
export const VERIFY_PATH = "/src/_verify.rs";

/**
 * Prepended to the learner's body. `#[allow(dead_code)]` because a type-level
 * harness defines items nothing calls; the leading `mod _verify;` is what puts
 * the harness out of reach of anything the learner writes below it.
 */
const VERIFY_DECL = "#[allow(dead_code)]\nmod _verify;\n";

/**
 * The harness file's first line. Harnesses are written to sit at the bottom of
 * `lib.rs`, so they name crate-root items directly (and their inner `mod verify`
 * does `use super::*`). Glob-importing the crate root at the top of the module
 * file keeps that text valid verbatim — no rewriting of the lesson's harness.
 */
const VERIFY_PRELUDE = "use super::*;\n";

function toLines(source: string): string[] {
  return source.split(/\r?\n/);
}

/**
 * Split `source` at its harness marker. The harness region runs from the rule
 * line(s) immediately above the FIRST marker to end of file — first, so a
 * submission that duplicated the harness has every copy stripped.
 *
 * No marker → the whole source is the body and `harness` is empty.
 */
export function splitHarness(source: string): {
  body: string;
  harness: string;
} {
  const lines = toLines(source);
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
 * module.
 *
 * When the starter carries no harness there is nothing to enforce, so the
 * submission is returned as a lone `lib.rs` rather than being wrapped around a
 * module that does not exist — the buildable grader refuses to grade such a
 * lesson at all, and gate 22 keeps it from shipping.
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
