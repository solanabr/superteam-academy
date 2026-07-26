import { parse as parseYaml } from "yaml";
import { byteLength } from "@superteam-lms/content-schema";
import { registerCheck, type LintContext } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";
import { mergeBase, gitShow, resolveLocalBase } from "../git";

const BYTE_CAP: Record<string, number> = { course: 32, achievement: 32 };

/** Every (kind, id, file) triple in the repo. */
function idsOf(model: RepoModel): { kind: string; id: string; file: string }[] {
  return [
    ...model.courses.map((c) => ({ kind: "course", id: c.id, file: c.file })),
    ...model.lessons.map((l) => ({ kind: "lesson", id: l.id, file: l.file })),
    ...model.achievements.map((a) => ({
      kind: "achievement",
      id: a.achievement.id,
      file: a.file,
    })),
    ...model.quests.map((q) => ({
      kind: "quest",
      id: q.quest.id,
      file: q.file,
    })),
    ...model.paths.map((p) => ({ kind: "path", id: p.path.id, file: p.file })),
  ];
}

/** Read the `id:` field from a YAML string, tolerating a broken base version. */
function idFrom(text: string): string | undefined {
  try {
    const doc = parseYaml(text, { version: "1.2" }) as { id?: unknown };
    return typeof doc?.id === "string" ? doc.id : undefined;
  } catch {
    return undefined;
  }
}

export function gate2Check(model: RepoModel, ctx: LintContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  const all = idsOf(model);

  // Uniqueness within each kind.
  const seen = new Map<string, string>(); // `${kind}:${id}` -> first file
  for (const { kind, id, file } of all) {
    const key = `${kind}:${id}`;
    const prev = seen.get(key);
    if (prev) {
      out.push(
        diag(
          "gate-2",
          "error",
          file,
          `duplicate ${kind} id "${id}" (also in ${prev})`
        )
      );
    } else {
      seen.set(key, file);
    }
    // Byte cap for PDA-seed ids.
    const cap = BYTE_CAP[kind];
    if (cap && byteLength(id) > cap) {
      out.push(
        diag(
          "gate-2",
          "error",
          file,
          `${kind} id "${id}" is ${byteLength(id)} bytes (max ${cap})`
        )
      );
    }
  }

  // Immutability vs the PR base: an id present at base whose value changed is a hard fail.
  // Base resolution mirrors gate-3 (#737): CI supplies ctx.baseRef; a bare local run
  // falls back to a remote-tracking default so the check still runs outside CI.
  const resolvedRef = ctx.baseRef ?? resolveLocalBase(ctx.root);
  const base = resolvedRef ? mergeBase(ctx.root, resolvedRef) : null;

  if (!base) {
    if (ctx.baseRef) {
      // A base ref was EXPLICITLY requested (CI sets LINT_BASE_REF) but does not
      // resolve — never fetched, or the ref name is wrong. Fail CLOSED: warning-and-
      // skip here would silently disable the id-immutability gate on a green run.
      out.push(
        diag(
          "gate-2",
          "error",
          "",
          `CI misconfiguration: told to diff id immutability against "${ctx.baseRef}" but it is not resolvable — fetch it (fetch-depth: 0) or fix LINT_BASE_REF. Id immutability was NOT verified.`
        )
      );
    } else {
      // No base ref at all (bare local, no origin remote): there is genuinely
      // nothing to diff against. Say the check was skipped rather than fabricating
      // a verdict — but never vanish silently (#614/#694).
      out.push(
        diag(
          "gate-2",
          "warning",
          "",
          "id immutability not checked — no base ref (set GITHUB_BASE_REF, or fetch origin/main with full history). Id invariants are verified in CI."
        )
      );
    }
    return out;
  }

  if (!base.exact) {
    // Degraded to the base tip (e.g. a shallow --depth=1 base fetch). The tip
    // is not the fork point on a diverged base, so the immutability comparison
    // below may be wrong — never let that be silent (fetch base with full
    // history, `fetch-depth: 0`, to restore an exact merge-base).
    out.push(
      diag(
        "gate-2",
        "warning",
        "",
        `could not compute an exact merge-base with "${resolvedRef}" (shallow base?) — comparing id immutability against the base TIP instead of the fork point; results may be inaccurate. Fetch the base with full history (fetch-depth: 0).`
      )
    );
  }

  for (const { kind, id, file } of all) {
    const baseText = gitShow(ctx.root, base.ref, file);
    if (baseText === null) continue; // file is new at head — nothing to compare
    const baseId = idFrom(baseText);
    if (baseId !== undefined && baseId !== id) {
      out.push(
        diag(
          "gate-2",
          "error",
          file,
          `${kind} id changed from "${baseId}" to "${id}" — ids are immutable (spec §4.7)`
        )
      );
    }
  }

  return out;
}

registerCheck(gate2Check);
