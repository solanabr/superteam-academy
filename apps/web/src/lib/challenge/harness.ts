/**
 * Splice a buildable lesson's verification harness onto a learner submission.
 *
 * A buildable challenge is graded by compiling it (see `buildable-executor.ts`),
 * so the only thing that makes the grade mean anything is the harness the lesson
 * ships at the bottom of its starter: a type-level check that references the
 * symbols the exercise asks for. Left in the learner's buffer the harness is
 * just text they can delete — and `pub fn nothing() {}` compiles fine against
 * the build server's template Cargo.toml. So the server grader (and, so it
 * agrees, the browser pre-check) strips whatever harness region the submission
 * carries and appends the STARTER's canonical one before compiling.
 *
 * Pure and dependency-free — it runs on the server grader and in the browser.
 * Line endings are normalised to LF so a CRLF submission splices identically.
 */

/** The line a lesson puts above its harness. Content CI (gate 22) requires it. */
export const HARNESS_MARKER =
  "// VERIFICATION HARNESS — DO NOT EDIT ANYTHING BELOW THIS LINE.";

/** A `// ─────` rule line: cosmetic, and part of the harness region. */
const RULE_LINE = /^\s*\/\/\s*[─-]+\s*$/;

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
 * The source to actually compile: the learner's work with the starter's
 * canonical harness re-attached.
 *
 * When the starter carries no harness there is nothing to enforce, so the
 * submission is returned untouched rather than truncated — the buildable grader
 * refuses to grade such a lesson at all, and gate 22 keeps it from shipping.
 */
export function withCanonicalHarness(
  submission: string,
  starter: string
): string {
  const { harness } = splitHarness(starter);
  if (!harness) return submission;
  return `${splitHarness(submission).body.trimEnd()}\n\n${harness.trimEnd()}\n`;
}
