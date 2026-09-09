import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

type Block = Record<string, unknown> & { type: string; key: string };

/**
 * A `code` block with `deployable: true` is only completable when the same
 * lesson carries a later `deployed-program-card` block.
 *
 * The deploy panel is mounted by that block and nothing else
 * (`lessons/[id]/blocks/deployed-program-card-block.tsx`), and the challenge
 * runner only reveals Submit after the panel fires `superteam:deploy-complete`.
 * Without the card the learner reaches a green test run and then has no way to
 * finish the lesson — for any wallet kind.
 *
 * Gate 13a covers the capability edge (`produces: deployed-program` →
 * `consumes`), which is a different question: it is satisfied by a consumer in
 * a LATER lesson, or even a later course on the same path, and it does not care
 * about the block's type. This one is intra-lesson and type-specific.
 */
export function gate13eCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const lesson of model.lessons) {
    const blocks = lesson.lesson.blocks as Block[];
    blocks.forEach((block, i) => {
      if (block.type !== "code" || block.deployable !== true) return;
      const hasCard = blocks
        .slice(i + 1)
        .some((b) => b.type === "deployed-program-card");
      if (hasCard) return;
      out.push(
        diag(
          "gate-13e",
          "error",
          lesson.file,
          `lesson "${lesson.id}" block "${block.key}" is deployable but no later block in the lesson is a "deployed-program-card" — the card is what mounts the deploy panel, so the learner never gets a Submit button and the lesson is uncompletable`
        )
      );
    });
  }
  return out;
}

registerCheck(gate13eCheck);
