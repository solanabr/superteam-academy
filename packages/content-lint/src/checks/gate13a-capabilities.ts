import { CAPABILITY_KEYS } from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
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

export function gate13aCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const course of model.courses) {
    // Flatten to DISPLAY order: module order, lesson order within module, block order within lesson.
    const seq: { lessonFile: string; block: Block }[] = [];
    for (const lid of course.course.modules.flatMap((m) => m.lessons)) {
      const lesson = model.lessonsById.get(lid);
      if (!lesson) continue; // missing lesson is a gate-4 error
      for (const b of lesson.lesson.blocks as Block[]) {
        seq.push({ lessonFile: lesson.file, block: b });
      }
    }

    const producedSoFar = new Set<string>();
    for (const { lessonFile, block } of seq) {
      for (const need of block.consumes ?? []) {
        if (!producedSoFar.has(need)) {
          out.push(
            diag(
              "gate-13a",
              "error",
              lessonFile,
              `block "${block.key}" consumes "${need}" but no earlier block (in display order) produces it (spec §4.9)`
            )
          );
        }
      }
      // Register this block's output only if it is a VALID producer for that capability.
      if (
        block.produces &&
        (CAPABILITY_KEYS as readonly string[]).includes(block.produces)
      ) {
        const validator = VALID_PRODUCER[block.produces];
        if (validator && validator(block)) {
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
