/**
 * Splice a buildable lesson's verification harness onto a submission.
 *
 * DUPLICATED from `apps/web/src/lib/challenge/harness.ts` on purpose:
 * content-lint does not depend on the app — the content repo's
 * validate-content workflow checks the linter out on its own. Gate 22
 * duplicates the marker string for the same reason. Keep all three in sync;
 * the whole point of gate 6's Rust oracle is to compile exactly what the
 * runtime grader compiles.
 */

/** The line a lesson puts above its harness. Gate 22 requires it. */
export const HARNESS_MARKER =
  "// VERIFICATION HARNESS — DO NOT EDIT ANYTHING BELOW THIS LINE.";

/** A `// ─────` rule line: cosmetic, and part of the harness region. */
const RULE_LINE = /^\s*\/\/\s*[─-]+\s*$/;

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
 * The source to actually compile: the submission with the starter's canonical
 * harness re-attached. A starter carrying no harness leaves the submission
 * untouched rather than truncated.
 */
export function withCanonicalHarness(
  submission: string,
  starter: string
): string {
  const { harness } = splitHarness(starter);
  if (!harness) return submission;
  return `${splitHarness(submission).body.trimEnd()}\n\n${harness.trimEnd()}\n`;
}
