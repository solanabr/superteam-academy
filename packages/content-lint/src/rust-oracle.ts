import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Compile a Rust lesson source the way the build server does.
 *
 * The build server (apps/build-server/src/build.rs) copies its template
 * `programs/Cargo.toml` + `Cargo.lock` next to the learner's `src/lib.rs` and
 * runs `cargo-build-sbf --tools-version v1.54`. Gate 6 does the same so a
 * buildable lesson's starter is proved to FAIL and its solution to PASS in the
 * repo, instead of being discovered broken by learners — which is how the
 * 2026-09 stale-build-image incident stayed invisible.
 *
 * Compile time is the constraint, so one build directory is reused for every
 * block in a lint run and `CARGO_TARGET_DIR` points at a stable, cacheable
 * directory: cargo keeps the dependency fingerprints warm and only the leaf
 * crate recompiles per source.
 */

const TOOLS_VERSION = "v1.54";
const DEFAULT_TIMEOUT_MS = 300_000;
/** Must match `SO_FILENAME` in apps/build-server/src/build.rs. */
const SO_FILENAME = "academy_program.so";

export type OracleMode = "auto" | "off" | "require";

export function oracleMode(env: NodeJS.ProcessEnv = process.env): OracleMode {
  const raw = (env.CONTENT_LINT_RUST_ORACLE ?? "auto").toLowerCase();
  return raw === "off" || raw === "require" ? raw : "auto";
}

export function timeoutMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = Number(env.CONTENT_LINT_RUST_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

/** `cargo-build-sbf` on PATH? Cached — the probe spawns a process. */
let toolchainProbe: boolean | undefined;
export function hasToolchain(): boolean {
  if (toolchainProbe === undefined) {
    const r = spawnSync("cargo-build-sbf", ["--version"], {
      stdio: "ignore",
      timeout: 60_000,
    });
    toolchainProbe = r.status === 0;
  }
  return toolchainProbe;
}

/** Test seam: forget the cached probe. */
export function resetToolchainProbe(): void {
  toolchainProbe = undefined;
}

/**
 * The build server's template manifest. Resolved from this module rather than
 * from the content root: the content repo checks the linter out beside it, so
 * `apps/build-server/programs` is always in the LINTER's tree, never the
 * content tree. `CONTENT_LINT_BUILD_TEMPLATE` overrides it.
 */
export function templateDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.CONTENT_LINT_BUILD_TEMPLATE) {
    return resolve(env.CONTENT_LINT_BUILD_TEMPLATE);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "../../../apps/build-server/programs");
}

export interface CompileResult {
  ok: boolean;
  /** Compiler output, trimmed to the tail that names the error. */
  stderr: string;
  timedOut: boolean;
}

export interface RustCompiler {
  compile(source: string): Promise<CompileResult>;
  dispose(): void;
}

/**
 * Stand up the shared build directory. Throws when the template is missing —
 * a silently skipped oracle is the failure mode this gate exists to remove.
 */
export function createCompiler(
  env: NodeJS.ProcessEnv = process.env
): RustCompiler {
  const template = templateDir(env);
  const manifest = join(template, "Cargo.toml");
  if (!existsSync(manifest)) {
    throw new Error(
      `build-server template manifest not found at ${manifest} — set CONTENT_LINT_BUILD_TEMPLATE`
    );
  }

  const buildDir = mkdtempSync(join(tmpdir(), "content-lint-sbf-"));
  mkdirSync(join(buildDir, "src"), { recursive: true });
  copyFileSync(manifest, join(buildDir, "Cargo.toml"));
  const lock = join(template, "Cargo.lock");
  if (existsSync(lock)) copyFileSync(lock, join(buildDir, "Cargo.lock"));

  // Stable by default so the dependency build survives across lint runs (and
  // is cacheable in CI by path). Every block in a run shares it.
  const targetDir =
    env.CONTENT_LINT_SBF_TARGET_DIR ??
    join(tmpdir(), "content-lint-sbf-target");
  mkdirSync(targetDir, { recursive: true });

  const limit = timeoutMs(env);

  const outDir = join(buildDir, "out");

  return {
    async compile(source: string): Promise<CompileResult> {
      writeFileSync(join(buildDir, "src", "lib.rs"), source, "utf8");
      // Clear the previous artifact so a stale .so cannot pass for this build.
      rmSync(outDir, { recursive: true, force: true });
      const r = await runBuild(buildDir, outDir, targetDir, limit);
      // The build server trusts the exit status AND requires the artifact
      // (build.rs `build_succeeded`); a linker crash or OOM can exit 0.
      return r.ok && !existsSync(join(outDir, SO_FILENAME))
        ? {
            ok: false,
            stderr: `${r.stderr}\ncargo-build-sbf exited 0 but produced no ${SO_FILENAME}`,
            timedOut: false,
          }
        : r;
    },
    dispose(): void {
      rmSync(buildDir, { recursive: true, force: true });
    },
  };
}

function runBuild(
  buildDir: string,
  outDir: string,
  targetDir: string,
  limit: number
): Promise<CompileResult> {
  return new Promise((resolvePromise) => {
    const child = spawn(
      "cargo-build-sbf",
      [
        "--tools-version",
        TOOLS_VERSION,
        "--manifest-path",
        join(buildDir, "Cargo.toml"),
        "--sbf-out-dir",
        outDir,
      ],
      {
        cwd: buildDir,
        env: { ...process.env, CARGO_TARGET_DIR: targetDir },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stderr = "";
    let settled = false;
    child.stdout.on("data", (c: Buffer) => (stderr += c.toString()));
    child.stderr.on("data", (c: Buffer) => (stderr += c.toString()));

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      resolvePromise({ ok: false, stderr: tail(stderr), timedOut: true });
    }, limit);

    const finish = (ok: boolean, extra = ""): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({
        ok,
        stderr: tail(stderr + extra),
        timedOut: false,
      });
    };

    child.on("error", (err) => finish(false, `\nspawn failed: ${err.message}`));
    child.on("close", (code) => finish(code === 0));
  });
}

/** The tail of the compiler output — the head is progress noise. */
function tail(out: string, lines = 25): string {
  return out.trim().split("\n").slice(-lines).join("\n");
}
