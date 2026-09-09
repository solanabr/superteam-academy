/**
 * The string-level tests prove WHERE the harness lands; only a real compile
 * proves the bypasses are dead. This one runs `cargo build-sbf` against the
 * build server's own `programs/Cargo.toml` — the same manifest and toolchain
 * prod compiles with — on the live lessons' starters and solutions.
 *
 * OPT-IN: needs the Solana toolchain (several minutes of cold compile), so it is
 * skipped unless `SBF_INTEGRATION=1` and `cargo-build-sbf` is on PATH.
 *
 *   SBF_INTEGRATION=1 pnpm --filter web exec vitest run src/lib/challenge
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { lessonsById } from "@/lib/content/store";
import { buildGradeFiles, splitHarness } from "../harness";

function hasToolchain(): boolean {
  try {
    execFileSync("cargo-build-sbf", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const ENABLED = process.env.SBF_INTEGRATION === "1" && hasToolchain();

const MANIFEST = resolve(
  __dirname,
  "../../../../../..",
  "apps/build-server/programs/Cargo.toml"
);

/** Compile a submission the way the grader would. Returns the build's stderr. */
function compile(
  submission: string,
  starter: string
): { ok: boolean; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "harness-sbf-"));
  mkdirSync(join(dir, "src"));
  copyFileSync(MANIFEST, join(dir, "Cargo.toml"));
  for (const [path, content] of buildGradeFiles(submission, starter)) {
    writeFileSync(join(dir, path.replace(/^\//, "")), content);
  }
  try {
    const out = execFileSync(
      "cargo",
      [
        "build-sbf",
        "--manifest-path",
        "Cargo.toml",
        "--tools-version",
        "v1.54",
      ],
      { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    return { ok: true, out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

interface CodeBlock {
  _type: string;
  buildType?: string | null;
  starter?: string;
  solution?: string;
}

function block(lessonId: string): CodeBlock {
  const b = (
    lessonsById.get(lessonId)?.blocks as CodeBlock[] | undefined
  )?.find((x) => x._type === "code" && x.buildType === "buildable");
  if (!b) throw new Error(`no buildable block in ${lessonId}`);
  return b;
}

const LESSONS = [
  "lesson-b2s-your-first-solana-program",
  "lesson-b2s-an-anchor-vault",
];

describe.skipIf(!ENABLED)(
  "buildGradeFiles compiles as the grader intends",
  () => {
    for (const id of LESSONS) {
      describe(id, () => {
        const { starter = "", solution = "" } = block(id);

        it("rejects a dangling trailing attribute (bypass 1)", () => {
          const r = compile("pub fn nothing() {}\n\n#[cfg(any())]\n", starter);
          expect(r.ok).toBe(false);
          expect(r.out).toContain("expected item after attributes");
        }, 600_000);

        it("rejects a crate-level inner attribute (bypass 2)", () => {
          const r = compile("#![cfg(any())]\npub fn nothing() {}\n", starter);
          expect(r.ok).toBe(false);
          expect(r.out).toContain("inner attribute is not permitted");
        }, 600_000);

        it("rejects an emptied submission", () => {
          expect(compile("pub fn nothing() {}\n", starter).ok).toBe(false);
        }, 600_000);

        it("accepts the reference solution (harness inline)", () => {
          expect(compile(solution, starter).ok).toBe(true);
        }, 600_000);

        it("accepts the reference solution with its harness region removed", () => {
          expect(compile(splitHarness(solution).body, starter).ok).toBe(true);
        }, 600_000);
      });
    }
  }
);
