/**
 * Pick the line a learner actually needs out of a cargo build's stderr.
 *
 * `cargo-build-sbf` prints a long INFO/WARN preamble (`spawn: "…/rustc"
 * --version`, the "two crate types defined" LTO warning) before it reaches the
 * diagnostics, so the first N characters of stderr never contain the error.
 * Shared by the server grader (`buildable-executor.ts`) and the browser runner
 * (`challenge-runner.tsx`) so the in-editor Run agrees with the server verdict.
 * Deliberately dependency-free: the runner is a client component.
 */

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

/**
 * The first real compiler diagnostic, plus its ` --> file:line:col` location
 * when cargo printed one. Prefers a diagnostic line (`error[E0425]:` /
 * `error:`) over incidental matches like a crate named "…-error" in cargo's
 * "Compiling …" progress. Falls back to a generic message when stderr holds no
 * error at all.
 */
export function firstCompilerErrorLine(
  stderr: string,
  maxLength = 200
): string {
  const lines = stderr.replace(ANSI_REGEX, "").split("\n");

  let index = lines.findIndex((l) => /^\s*error(\[|:)/.test(l));
  if (index === -1) index = lines.findIndex((l) => l.includes("error"));
  if (index === -1) return "Program did not compile";

  const parts = [lines[index]!.trim()];
  const next = lines[index + 1]?.trim();
  if (next?.startsWith("-->")) parts.push(next);

  return parts.join(" ").slice(0, maxLength);
}
