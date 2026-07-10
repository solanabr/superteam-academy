import { proseBlock } from "./prose";
import { videoBlock } from "./video";
import { codeBlock } from "./code";
import { quizBlock } from "./quiz";
import { openEndedBlock } from "./openEnded";
import {
  walletFundingBlock,
  programExplorerBlock,
  deployedProgramCardBlock,
} from "./widgets";

/**
 * The eight first-class block object types (Amendment A). Adding a block type
 * touches exactly this array plus a new file — a lesson's `blocks[]` spreads
 * BLOCK_MEMBERS into `of`, so no container edit is needed (spec §7.3).
 */
export const blockTypes = [
  proseBlock,
  videoBlock,
  codeBlock,
  quizBlock,
  openEndedBlock,
  walletFundingBlock,
  programExplorerBlock,
  deployedProgramCardBlock,
];

/** `of` members for the lesson `blocks[]` array — each block type by name. */
export const BLOCK_MEMBERS = blockTypes.map((t) => ({ type: t.name }));
