import { readFileSync } from "node:fs";
import { join } from "node:path";
import { registerCheck } from "../lint";
import { type RepoModel, type LessonEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";
import { HARNESS_MARKER } from "../harness";

/**
 * Gate 22 — a buildable challenge must ship a verification harness.
 *
 * A `buildType: buildable` block is graded by compiling it, and the build
 * server's template Cargo.toml makes almost any `lib.rs` compile. What makes
 * that verdict mean something is the harness at the bottom of the starter: a
 * type-level check naming the symbols the exercise has to define. The grader
 * splices it back onto every submission (apps/web/src/lib/challenge/harness.ts)
 * and refuses to grade a block whose starter has none — so a lesson without one
 * is not merely weak, it is un-completable. Catch it here instead.
 */

interface CodeBlock {
  type: "code";
  key: string;
  buildType?: "standard" | "buildable";
  starter: string;
}

/** Lines below the marker that are neither blank nor a comment. */
function harnessCode(starter: string): string[] {
  const lines = starter.split(/\r?\n/);
  const marker = lines.findIndex((l) => l.trim() === HARNESS_MARKER);
  if (marker === -1) return [];
  return lines
    .slice(marker + 1)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("//"));
}

export function gate22Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const entry of model.lessons) {
    for (const raw of entry.lesson.blocks as Record<string, unknown>[]) {
      if (raw.type !== "code") continue;
      const block = raw as unknown as CodeBlock;
      if (block.buildType !== "buildable") continue;

      const where = `block "${block.key}"`;
      let starter: string;
      try {
        starter = readFileSync(
          join(model.root, entry.dir, block.starter),
          "utf8"
        );
      } catch (err) {
        out.push(
          diag(
            "gate-22",
            "error",
            entry.file,
            `${where}: cannot read starter — ${err instanceof Error ? err.message : String(err)}`
          )
        );
        continue;
      }

      const code = harnessCode(starter);
      if (!starter.split(/\r?\n/).some((l) => l.trim() === HARNESS_MARKER)) {
        out.push(
          diag(
            "gate-22",
            "error",
            entry.file,
            `${where}: buildable starter has no verification harness — it must end with "${HARNESS_MARKER}" followed by a type check, or the lesson passes on bare compilation`
          )
        );
      } else if (code.length === 0) {
        out.push(
          diag(
            "gate-22",
            "error",
            entry.file,
            `${where}: verification harness is empty — it must contain code that references the symbols the exercise asks for`
          )
        );
      }
    }
  }

  return out;
}

registerCheck(gate22Check);
