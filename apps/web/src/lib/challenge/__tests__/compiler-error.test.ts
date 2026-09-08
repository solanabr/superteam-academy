import { describe, it, expect } from "vitest";
import { firstCompilerErrorLine } from "../compiler-error";

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
});
