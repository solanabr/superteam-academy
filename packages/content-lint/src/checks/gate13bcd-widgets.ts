import { readFileSync, realpathSync } from "node:fs";
import { join, sep } from "node:path";
import { BLOCK_REGISTRY } from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

const SLOT_WARN_THRESHOLD = 200; // of 256 (spec §6.2 gate 13d)

function checkIdl(root: string, dir: string, idlRel: string): Diagnostic[] {
  const label = `${dir}/${idlRel}`;
  const lessonDir = join(root, dir);
  const requested = join(lessonDir, idlRel);

  // The schema's `relativePath` check (packages/content-schema/src/blocks/base.ts)
  // only inspects the STRING (no leading "/", no ".." segment) — it has no idea
  // what's actually on disk at that path. A symlink named e.g. "program.idl.json"
  // satisfies that string check while resolving anywhere on the filesystem. Resolve
  // every symlink in the chain (lesson dir included, since /tmp itself can be a
  // symlink) and reject — without reading — anything that escapes the lesson dir.
  let resolvedLessonDir: string;
  let resolvedRequested: string;
  try {
    resolvedLessonDir = realpathSync(lessonDir);
    resolvedRequested = realpathSync(requested);
  } catch {
    return [
      diag(
        "gate-13c",
        "error",
        label,
        "program.idl.json does not exist or could not be resolved"
      ),
    ];
  }
  const escapesLessonDir =
    resolvedRequested !== resolvedLessonDir &&
    !resolvedRequested.startsWith(resolvedLessonDir + sep);
  if (escapesLessonDir) {
    return [
      diag(
        "gate-13c",
        "error",
        label,
        "program.idl.json resolves outside the lesson directory (symlink escape) — refusing to read it"
      ),
    ];
  }

  let idl: unknown;
  try {
    // Belt and suspenders: never interpolate the parser's error message into a
    // diagnostic. It can echo fragments of the file it just failed to parse —
    // and this diagnostic reaches the world-readable CI log.
    idl = JSON.parse(readFileSync(resolvedRequested, "utf8"));
  } catch {
    return [
      diag(
        "gate-13c",
        "error",
        label,
        "program.idl.json does not parse as valid JSON"
      ),
    ];
  }
  const out: Diagnostic[] = [];
  const obj = idl as { instructions?: unknown; metadata?: { name?: unknown } };
  if (!Array.isArray(obj.instructions) || obj.instructions.length === 0) {
    out.push(
      diag(
        "gate-13c",
        "error",
        `${dir}/${idlRel}`,
        "program.idl.json has an empty or missing `instructions` array"
      )
    );
  }
  if (
    typeof obj.metadata?.name !== "string" ||
    obj.metadata.name.length === 0
  ) {
    out.push(
      diag(
        "gate-13c",
        "error",
        `${dir}/${idlRel}`,
        "program.idl.json is missing a non-empty `metadata.name`"
      )
    );
  }
  return out;
}

export function gate13bcdCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  const registryKeys = new Set(Object.keys(BLOCK_REGISTRY));

  for (const entry of model.lessons) {
    for (const b of entry.lesson.blocks as Record<string, unknown>[]) {
      // 13b — structural: the block type must be a registry key.
      if (typeof b.type === "string" && !registryKeys.has(b.type)) {
        out.push(
          diag(
            "gate-13b",
            "error",
            entry.file,
            `block "${String(b.key)}" has type "${b.type}" absent from BLOCK_REGISTRY`
          )
        );
      }
      // 13c — program.idl.json validity for program-explorer blocks.
      if (b.type === "program-explorer" && typeof b.idl === "string") {
        out.push(...checkIdl(model.root, entry.dir, b.idl));
      }
    }
  }

  // 13d — slot-exhaustion warning.
  for (const c of model.courses) {
    if (c.slotsLock && c.slotsLock.next > SLOT_WARN_THRESHOLD) {
      out.push(
        diag(
          "gate-13d",
          "warning",
          c.slotsPath ?? `${c.dir}/slots.lock.json`,
          `slot cursor next=${c.slotsLock.next} exceeds ${SLOT_WARN_THRESHOLD} of 256 — each lesson replacement burns a slot forever; at exhaustion the course can never add a lesson without a new id`
        )
      );
    }
  }

  return out;
}

registerCheck(gate13bcdCheck);
