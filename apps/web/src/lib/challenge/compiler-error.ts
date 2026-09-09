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

import { VERIFY_PATH } from "./harness";

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

/** `_verify.rs` — the hidden harness module (see harness.ts). */
const VERIFY_FILE = VERIFY_PATH.replace(/^\//, "");

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

  const errorLine = lines[index]!.trim();
  const next = lines[index + 1]?.trim();
  const location = next?.startsWith("-->") ? next : undefined;

  if (!location) return errorLine.slice(0, maxLength);

  // Truncate each half on its own budget so a long diagnostic never cuts
  // the `--> file:line:col` location mid-string — the location gets first
  // claim on the budget, the error line takes what's left.
  const separator = " ";
  let truncatedLocation = location.slice(
    0,
    Math.max(0, maxLength - separator.length)
  );
  const truncatedError = errorLine.slice(
    0,
    Math.max(0, maxLength - separator.length - truncatedLocation.length)
  );
  // No room for any of the error line — give the location the full budget
  // instead of leaving a separator's worth of space unused.
  if (!truncatedError) truncatedLocation = location.slice(0, maxLength);

  return [truncatedError, truncatedLocation].filter(Boolean).join(separator);
}

/**
 * What the first diagnostic actually says, and — the part that matters — WHOSE
 * file it points at.
 *
 * Since #1218 the verification harness compiles as its own `src/_verify.rs`,
 * a file the learner never sees. When their code doesn't satisfy it, rustc's
 * first error is about that file (`cannot find function \`ping\` … -->
 * src/_verify.rs:12:22`), which the test row printed verbatim — the "weird
 * thing at the bottom" a learner has no way to act on. A harness diagnostic
 * gets translated into what it really means (the lesson asked for a symbol
 * that isn't there); an error in `src/lib.rs` is the learner's own code and
 * keeps reading exactly as rustc wrote it.
 */
export interface CompilerDiagnostic {
  /** The first diagnostic + its location, as `firstCompilerErrorLine` renders it. */
  raw: string;
  /** The diagnostic's location is inside the hidden harness module. */
  fromHarness: boolean;
  /** The symbol rustc named, when the message names one. */
  symbol: string | null;
}

/**
 * Patterns that name a symbol in a way a learner can act on. Order matters
 * only in that the first match wins; each targets a distinct rustc message.
 */
const SYMBOL_PATTERNS: RegExp[] = [
  // E0425 / E0412 / E0422 / E0531: cannot find <thing> `X` in this scope
  /cannot find \w+ `([^`]+)`/,
  // E0433: failed to resolve: use of undeclared crate or module `X`
  /use of undeclared (?:crate or module|type) `([^`]+)`/,
  // E0432: unresolved import `X`
  /unresolved import `([^`]+)`/,
  // E0599: no method named `X` / no function or associated item named `X`
  /no (?:method|function or associated item|variant or associated item) named `([^`]+)`/,
  // E0609: no field `X` on type …
  /no field `([^`]+)`/,
];

export function analyzeCompilerError(
  stderr: string,
  maxLength = 200
): CompilerDiagnostic {
  const lines = stderr.replace(ANSI_REGEX, "").split("\n");

  let index = lines.findIndex((l) => /^\s*error(\[|:)/.test(l));
  if (index === -1) index = lines.findIndex((l) => l.includes("error"));

  const raw = firstCompilerErrorLine(stderr, maxLength);
  if (index === -1) return { raw, fromHarness: false, symbol: null };

  const message = lines[index]!.trim();

  // The location can sit a few lines under the message (rustc prints notes and
  // a source snippet between them), so scan the diagnostic's own block —
  // up to the next blank line or the next diagnostic — for the first `-->`.
  let fromHarness = false;
  for (let i = index + 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^\s*(error|warning)(\[|:)/.test(line)) break;
    const arrow = line.trim();
    if (arrow.startsWith("-->")) {
      fromHarness = arrow.includes(VERIFY_FILE);
      break;
    }
    if (arrow === "") break;
  }

  let symbol: string | null = null;
  for (const pattern of SYMBOL_PATTERNS) {
    const match = pattern.exec(message);
    if (match?.[1]) {
      symbol = match[1];
      break;
    }
  }

  return { raw, fromHarness, symbol };
}

/**
 * The English harness sentences. The client renders the localized copy
 * (`lesson.harnessMissingSymbol` / `lesson.harnessMismatch`); the server grader
 * has no locale, so its 403 `detail` uses these — same words, so the two
 * verdicts read as one.
 */
export function harnessMessage(symbol: string | null): string {
  return symbol
    ? `The verification harness could not find what the lesson asks for: ${symbol}`
    : "Your code does not match what the harness expects";
}

/**
 * The one-line verdict for a failed build, harness-aware. `translate` is the
 * caller's localizer (the browser runner passes next-intl); omitted, the
 * English sentences above are used.
 */
export function compilerErrorSummary(
  stderr: string,
  maxLength = 200,
  translate?: (symbol: string | null) => string
): string {
  const diagnostic = analyzeCompilerError(stderr, maxLength);
  if (!diagnostic.fromHarness) return diagnostic.raw;
  return (translate ?? harnessMessage)(diagnostic.symbol);
}
