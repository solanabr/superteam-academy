import { describe, it, expect } from "vitest";
import {
  analyzeCompilerError,
  compilerErrorSummary,
  firstCompilerErrorLine,
} from "../compiler-error";

/** A real `cargo-build-sbf` failure: long INFO/WARN preamble, then the error. */
const CARGO_STDERR = [
  '[2026-09-08T12:00:01Z INFO  cargo_build_sbf] spawn: "/Users/x/.cache/solana/v1.43/platform-tools/rust/bin/rustc" "--version"',
  '[2026-09-08T12:00:01Z INFO  cargo_build_sbf] spawn: "/Users/x/.cache/solana/v1.43/platform-tools/rust/bin/cargo" "build" "--release" "--target" "sbpf-solana-solana"',
  "warning: dropping unsupported crate type `cdylib` for target `sbpf-solana-solana`",
  "warning: `counter` (lib) generated 1 warning",
  "    Compiling counter v0.1.0 (/build)",
  "warning: two crate types defined, only the first is used",
  "error[E0107]: struct takes 4 lifetime arguments but 1 lifetime argument was supplied",
  "   --> src/lib.rs:24:24",
  "    |",
  "24  |     pub fn increment(ctx: Context<'info, Increment>) -> Result<()> {",
  "    |                                    ^^^^^^^^^ expected 4 lifetime arguments",
  "error: could not compile `counter` (lib) due to 1 previous error",
].join("\n");

describe("firstCompilerErrorLine", () => {
  it("skips the cargo preamble and returns the error with its location", () => {
    expect(firstCompilerErrorLine(CARGO_STDERR)).toBe(
      "error[E0107]: struct takes 4 lifetime arguments but 1 lifetime argument was supplied --> src/lib.rs:24:24"
    );
  });

  it("falls back when stderr holds no error line", () => {
    const warningsOnly = [
      "[INFO cargo_build_sbf] spawn: rustc --version",
      "warning: unused variable: `ctx`",
    ].join("\n");
    expect(firstCompilerErrorLine(warningsOnly)).toBe(
      "Program did not compile"
    );
    expect(firstCompilerErrorLine("")).toBe("Program did not compile");
  });

  it("strips ANSI colour codes", () => {
    const coloured =
      "\x1b[1m\x1b[32m   Compiling\x1b[0m counter v0.1.0\n" +
      "\x1b[1m\x1b[31merror[E0425]\x1b[0m\x1b[1m: cannot find value `x` in this scope\x1b[0m\n" +
      "\x1b[1m\x1b[34m   -->\x1b[0m src/lib.rs:9:5";
    expect(firstCompilerErrorLine(coloured)).toBe(
      "error[E0425]: cannot find value `x` in this scope --> src/lib.rs:9:5"
    );
  });

  it("prefers a diagnostic line over an incidental 'error' match", () => {
    const stderr = [
      "   Compiling thiserror v1.0.63",
      "error: linking with `cc` failed",
    ].join("\n");
    expect(firstCompilerErrorLine(stderr)).toBe(
      "error: linking with `cc` failed"
    );
  });

  it("still surfaces an incidental match when no diagnostic line exists", () => {
    expect(firstCompilerErrorLine("  some error happened somewhere")).toBe(
      "some error happened somewhere"
    );
  });

  it("truncates to maxLength", () => {
    const long = `error: ${"x".repeat(500)}`;
    expect(firstCompilerErrorLine(long)).toHaveLength(200);
    expect(firstCompilerErrorLine(long, 300)).toHaveLength(300);
  });

  it("keeps the location intact and truncates only the error line", () => {
    const stderr = [
      `error[E0107]: ${"x".repeat(500)}`,
      "   --> src/lib.rs:24:24",
    ].join("\n");
    const result = firstCompilerErrorLine(stderr, 200);
    expect(result).toHaveLength(200);
    expect(result.endsWith("--> src/lib.rs:24:24")).toBe(true);
  });

  it("truncates the location too when it alone exceeds maxLength", () => {
    const stderr = [
      "error: short",
      `   --> ${"src/".repeat(100)}lib.rs:1:1`,
    ].join("\n");
    const result = firstCompilerErrorLine(stderr, 50);
    expect(result).toHaveLength(50);
  });
});

/**
 * Real diagnostics from the two live buildable lessons. Since #1218 a lesson's
 * verification harness compiles as `src/_verify.rs`, so a submission that does
 * not define what the lesson asks for fails inside a file the learner has never
 * seen — and the test row printed that verbatim.
 */
const HARNESS_MISSING_TYPE = [
  "[INFO cargo_build_sbf] spawn: rustc --version",
  "    Compiling first_program v0.1.0 (/build)",
  "error[E0412]: cannot find type `Ping` in this scope",
  "  --> src/_verify.rs:12:22",
  "   |",
  "12 |     const _: fn() = || { let _: Ping; };",
  "   |                      ^^^^ not found in this scope",
  "error: could not compile `first_program` (lib) due to 1 previous error",
].join("\n");

const HARNESS_MISSING_FN = [
  "    Compiling first_program v0.1.0 (/build)",
  "error[E0425]: cannot find function `ping` in this scope",
  "  --> src/_verify.rs:12:22",
].join("\n");

const HARNESS_UNRESOLVED_MODULE = [
  "    Compiling first_program v0.1.0 (/build)",
  "error[E0433]: failed to resolve: use of undeclared crate or module `first_program`",
  "  --> src/_verify.rs:7:9",
].join("\n");

const HARNESS_VAULT_STATE = [
  "    Compiling vault v0.1.0 (/build)",
  "error[E0412]: cannot find type `VaultState` in this scope",
  "  --> src/_verify.rs:15:17",
].join("\n");

const LEARNER_LIFETIMES = [
  "    Compiling counter v0.1.0 (/build)",
  "error[E0107]: struct takes 4 lifetime arguments but 1 lifetime argument was supplied",
  "  --> src/lib.rs:24:24",
].join("\n");

describe("analyzeCompilerError", () => {
  it("flags a harness diagnostic and names the missing type", () => {
    const diagnostic = analyzeCompilerError(HARNESS_MISSING_TYPE);
    expect(diagnostic.fromHarness).toBe(true);
    expect(diagnostic.symbol).toBe("Ping");
    expect(diagnostic.raw).toContain("src/_verify.rs:12:22");
  });

  it("names a missing function", () => {
    expect(analyzeCompilerError(HARNESS_MISSING_FN)).toMatchObject({
      fromHarness: true,
      symbol: "ping",
    });
  });

  it("names an unresolved module", () => {
    expect(analyzeCompilerError(HARNESS_UNRESOLVED_MODULE)).toMatchObject({
      fromHarness: true,
      symbol: "first_program",
    });
  });

  it("flags a harness error it cannot name a symbol for", () => {
    const stderr = [
      "error[E0308]: mismatched types",
      "  --> src/_verify.rs:9:5",
    ].join("\n");
    expect(analyzeCompilerError(stderr)).toMatchObject({
      fromHarness: true,
      symbol: null,
    });
  });

  it("leaves an error in the learner's own file alone", () => {
    const diagnostic = analyzeCompilerError(LEARNER_LIFETIMES);
    expect(diagnostic.fromHarness).toBe(false);
    expect(diagnostic.raw).toContain("src/lib.rs:24:24");
  });
});

describe("compilerErrorSummary", () => {
  it("explains a harness miss instead of printing it", () => {
    expect(compilerErrorSummary(HARNESS_VAULT_STATE)).toBe(
      "The verification harness could not find what the lesson asks for: VaultState"
    );
  });

  it("falls back when the message names no symbol", () => {
    const stderr = [
      "error[E0061]: this function takes 1 argument but 2 arguments were supplied",
      "  --> src/_verify.rs:9:5",
    ].join("\n");
    expect(compilerErrorSummary(stderr)).toBe(
      "Your code does not match what the harness expects"
    );
  });

  it("uses the caller's localizer when one is given", () => {
    expect(
      compilerErrorSummary(HARNESS_MISSING_FN, 200, (symbol) =>
        symbol ? `faltando: ${symbol}` : "sem simbolo"
      )
    ).toBe("faltando: ping");
  });

  it("passes a learner-file diagnostic through verbatim", () => {
    expect(compilerErrorSummary(LEARNER_LIFETIMES)).toBe(
      firstCompilerErrorLine(LEARNER_LIFETIMES)
    );
  });
});
