import type { BlockType } from "@superteam-lms/content-schema";
import { ProseBlock } from "./prose-block";
import { VideoBlock } from "./video-block";
import { CodeBlock } from "./code-block";
import { QuizBlock } from "./quiz-block";
import { OpenEndedBlock } from "./open-ended-block";
import { WalletFundingBlock } from "./wallet-funding-block";
import { ProgramExplorerBlock } from "./program-explorer-block";
import { DeployedProgramCardBlock } from "./deployed-program-card-block";
import type { Renderer } from "./types";

export type { BlockContext, BlockRenderProps, Renderer } from "./types";

/**
 * One React component per block type. `satisfies Record<BlockType, Renderer>`
 * makes a missing renderer a COMPILE error (the render-side mirror of the grader
 * map). `lesson-client` dispatches `RENDERERS[block._type]`.
 */
export const RENDERERS = {
  prose: ProseBlock,
  video: VideoBlock,
  code: CodeBlock,
  quiz: QuizBlock,
  openEnded: OpenEndedBlock,
  "wallet-funding": WalletFundingBlock,
  "program-explorer": ProgramExplorerBlock,
  "deployed-program-card": DeployedProgramCardBlock,
} satisfies Record<BlockType, Renderer>;
