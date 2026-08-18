import { BLOCK_REGISTRY, type BlockType } from "@superteam-lms/content-schema";

/**
 * Block types the client's Mark Complete gate waits on — derived from
 * BLOCK_REGISTRY, never hardcoded (#970). The server's completion gate
 * (/api/lessons/complete) denies unless every `graded` block passes its grader
 * and every `required` ungraded block carries an attestation, so the client
 * must gate on the same union or it shows an enabled button the server 403s
 * (the #969 gate finding: `parsons` is graded but the client only knew
 * quiz/openEnded).
 *
 * `code` is in the set but currently unused by the gate UI: lesson-client
 * hides the Mark Complete button entirely for code lessons (they complete via
 * the editor's submit path), and code-block never calls setBlockDone — lifting
 * that restriction without wiring setBlockDone would ship a permanently
 * disabled button.
 */
export const GATE_BLOCK_TYPES: ReadonlySet<BlockType> = new Set(
  (Object.keys(BLOCK_REGISTRY) as BlockType[]).filter(
    (t) => BLOCK_REGISTRY[t].graded || BLOCK_REGISTRY[t].required
  )
);

export const isGateBlock = (type: BlockType): boolean =>
  GATE_BLOCK_TYPES.has(type);
