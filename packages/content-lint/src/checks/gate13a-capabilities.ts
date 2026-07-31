import { CAPABILITY_KEYS } from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type CourseEntry, type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

type Block = Record<string, unknown> & {
  type: string;
  key: string;
  produces?: string;
  consumes?: string[];
};

/** Only these block types may legitimately produce each capability (spec §4.9). */
const VALID_PRODUCER: Record<string, (b: Block) => boolean> = {
  "funded-wallet": (b) => b.type === "wallet-funding",
  "deployed-program": (b) => b.type === "code" && b.deployable === true,
};

function isValidProducer(block: Block): boolean {
  if (
    !block.produces ||
    !(CAPABILITY_KEYS as readonly string[]).includes(block.produces)
  ) {
    return false;
  }
  const validator = VALID_PRODUCER[block.produces];
  return validator !== undefined && validator(block);
}

/** A course's blocks in DISPLAY order: module order, lesson order, block order. */
function displayOrder(
  model: RepoModel,
  course: CourseEntry
): { lessonFile: string; block: Block }[] {
  const seq: { lessonFile: string; block: Block }[] = [];
  for (const lid of course.course.modules.flatMap((m) => m.lessons)) {
    const lesson = model.lessonsById.get(lid);
    if (!lesson) continue; // missing lesson is a gate-4 error
    for (const b of lesson.lesson.blocks as Block[]) {
      seq.push({ lessonFile: lesson.file, block: b });
    }
  }
  return seq;
}

/**
 * Capabilities a course is available to hand to the next course. Invalid
 * producers are reported by the ordering pass below, not here — this only
 * collects what genuinely gets produced.
 */
function producedByCourse(model: RepoModel, course: CourseEntry): Set<string> {
  const out = new Set<string>();
  for (const { block } of displayOrder(model, course)) {
    if (isValidProducer(block)) out.add(block.produces as string);
  }
  return out;
}

/**
 * Capabilities a course already holds on entry: everything produced by the
 * courses that precede it on a learning path it sits on.
 *
 * The catalog thesis is that each course consumes the previous course's output
 * as a named, checkable input — C4 lesson 1 generates a client from the program
 * C3 deployed. Without this, a cross-course `consumes:` is unexpressible: every
 * capability would have to be re-produced inside the consuming course.
 *
 * Path order is the ladder deliberately. `prerequisiteCourse` is NOT used: it is
 * written into the on-chain Course account and enforced by `enroll`, so setting
 * it to satisfy a linter would gate learner access to the course.
 */
function inheritedByCourse(model: RepoModel): Map<string, Set<string>> {
  const produced = new Map(
    model.courses.map((c) => [c.id, producedByCourse(model, c)])
  );
  const inherited = new Map(
    model.courses.map((c) => [c.id, new Set<string>()])
  );

  for (const { path } of model.paths) {
    const upstream = new Set<string>();
    for (const courseId of path.courses) {
      const into = inherited.get(courseId);
      if (into) for (const cap of upstream) into.add(cap);
      for (const cap of produced.get(courseId) ?? []) upstream.add(cap);
    }
  }
  return inherited;
}

export function gate13aCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  const inherited = inheritedByCourse(model);

  for (const course of model.courses) {
    const producedSoFar = new Set<string>(inherited.get(course.id) ?? []);

    for (const { lessonFile, block } of displayOrder(model, course)) {
      for (const need of block.consumes ?? []) {
        if (!producedSoFar.has(need)) {
          out.push(
            diag(
              "gate-13a",
              "error",
              lessonFile,
              `block "${block.key}" consumes "${need}" but no earlier block (in display order) — and no course earlier on this course's learning path — produces it (spec §4.9)`
            )
          );
        }
      }
      // Register this block's output only if it is a VALID producer for that capability.
      if (
        block.produces &&
        (CAPABILITY_KEYS as readonly string[]).includes(block.produces)
      ) {
        if (isValidProducer(block)) {
          producedSoFar.add(block.produces);
        } else {
          out.push(
            diag(
              "gate-13a",
              "error",
              lessonFile,
              `block "${block.key}" declares produces "${block.produces}" but is not a valid producer for it (spec §4.9)`
            )
          );
        }
      }
    }
  }
  return out;
}

registerCheck(gate13aCheck);
