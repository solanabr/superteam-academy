import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, vi } from "vitest";

const version = spawnSync("rustc", ["--version"], { encoding: "utf8" });

/** `rustc 1.x.y (...)`, or null when there's no rustc on PATH. */
export const RUSTC_VERSION =
  version.status === 0 ? version.stdout.trim() : null;

/** Compile and run what the grader would have sent to the Playground. */
export function stubPlaygroundWithLocalRustc(): void {
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    const { code } = JSON.parse(init.body) as { code: string };
    const dir = mkdtempSync(join(tmpdir(), "rustvec-"));
    try {
      const src = join(dir, "main.rs");
      const bin = join(dir, "main");
      writeFileSync(src, code);
      const build = spawnSync("rustc", ["--edition", "2021", "-o", bin, src], {
        encoding: "utf8",
      });
      const run =
        build.status === 0
          ? spawnSync(bin, { encoding: "utf8", timeout: 10_000 })
          : null;
      return {
        ok: true,
        json: async () => ({
          success: build.status === 0,
          stdout: run?.stdout ?? "",
          stderr: build.stderr + (run?.stderr ?? ""),
        }),
      } as unknown as Response;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

/**
 * `describe` for tests that need rustc. The Frontend CI job has no Rust setup
 * step and gets rustc from the runner image, so if an image drops it these
 * tests must fail there rather than skip. Off CI a missing rustc warns and skips.
 */
export function describeWithRustc(name: string, fn: () => void): void {
  if (RUSTC_VERSION) {
    describe(name, fn);
  } else if (process.env.CI) {
    describe(name, () => {
      it("needs rustc on PATH in CI", () => {
        throw new Error(
          "rustc isn't on PATH: install a toolchain in this CI job, these tests can't run without it"
        );
      });
    });
  } else {
    console.warn(`Skipping "${name}": rustc isn't on PATH`);
    describe.skip(name, fn);
  }
}
