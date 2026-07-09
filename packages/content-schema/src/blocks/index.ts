import { z } from "zod";
import { ProseBlock } from "./prose";
import { VideoBlock } from "./video";
import { CodeBlock } from "./code";
import { QuizBlock } from "./quiz";
import { OpenEndedBlock } from "./open-ended";
import {
  WalletFundingBlock,
  ProgramExplorerBlock,
  DeployedProgramCardBlock,
} from "./widgets";

export * from "./base";
export * from "./prose";
export * from "./video";
export * from "./code";
export * from "./quiz";
export * from "./open-ended";
export * from "./widgets";

/**
 * `CodeBlock` and `QuizBlock` carry `.refine()`, so they are ZodEffects rather
 * than ZodObject. `z.discriminatedUnion` in zod 4 accepts them because the
 * discriminator is still statically resolvable through the effect.
 */
export const Block = z.discriminatedUnion("type", [
  ProseBlock,
  VideoBlock,
  CodeBlock,
  QuizBlock,
  OpenEndedBlock,
  WalletFundingBlock,
  ProgramExplorerBlock,
  DeployedProgramCardBlock,
]);

export type BlockT = z.infer<typeof Block>;
export type BlockType = BlockT["type"];

export interface BlockMeta {
  /** A deterministic grader returns pass/fail; failing blocks lesson completion. */
  graded: boolean;
  /** The learner must interact before the lesson can complete. */
  required: boolean;
}

/**
 * `satisfies` makes an unregistered block type a compile error. The completion
 * gate (Plan 6) dispatches on this: a block with no registered grader is DENIED,
 * so an unknown type fails closed — the inverse of today's
 * `if (answerKey.type === "challenge")`, which lets unknown types through.
 */
export const BLOCK_REGISTRY = {
  prose: { graded: false, required: false },
  video: { graded: false, required: false },
  code: { graded: true, required: true },
  quiz: { graded: true, required: true },
  openEnded: { graded: false, required: true },
  "wallet-funding": { graded: false, required: false },
  "program-explorer": { graded: false, required: false },
  "deployed-program-card": { graded: false, required: false },
} satisfies Record<BlockType, BlockMeta>;

export const isGraded = (t: BlockType): boolean => BLOCK_REGISTRY[t].graded;
export const isRequired = (t: BlockType): boolean => BLOCK_REGISTRY[t].required;
