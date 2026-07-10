import { readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { registerCheck } from "../lint";
import { type RepoModel, type LessonEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

/** Files whose bare name is always allowed under a lesson dir. */
const KNOWN = (f: string): boolean =>
  f === "lesson.yaml" || f.endsWith(".quiz.yaml");

/** Relative asset paths referenced from markdown image/link syntax. */
function markdownRefs(mdText: string): string[] {
  const refs: string[] = [];
  const re = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mdText))) {
    const target = m[1]!;
    if (!/^https?:|^#|^mailto:/.test(target)) {
      refs.push(target.split("#")[0]!.split("?")[0]!);
    }
  }
  return refs;
}

/** Every lesson-dir-relative file a lesson's blocks (and their markdown) reference. */
function referenced(entry: LessonEntry, root: string): Set<string> {
  const rel = new Set<string>();
  const add = (p: string | undefined) => {
    if (p) rel.add(posix.normalize(p));
  };
  for (const b of entry.lesson.blocks as Record<string, unknown>[]) {
    add(b.src as string | undefined);
    add(b.starter as string | undefined);
    add(b.solution as string | undefined);
    add(b.tests as string | undefined);
    add(b.idl as string | undefined);
    if (b.type === "prose" && typeof b.src === "string") {
      const mdAbs = join(root, entry.dir, b.src);
      try {
        for (const r of markdownRefs(readFileSync(mdAbs, "utf8"))) add(r);
      } catch {
        /* missing md is a gate-1/gate-5 concern elsewhere */
      }
    }
  }
  return rel;
}

export function gate5Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const entry of model.lessons) {
    const refs = referenced(entry, model.root);
    for (const file of entry.files) {
      const name = file.slice(entry.dir.length + 1); // lesson-dir-relative
      if (KNOWN(name)) continue;
      if (!refs.has(posix.normalize(name))) {
        out.push(
          diag(
            "gate-5",
            "error",
            file,
            `orphan file "${name}" — no block references it and it is not a known name`
          )
        );
      }
    }
  }
  return out;
}

registerCheck(gate5Check);
