import { z } from "zod";
import { blockBase } from "./base";

/**
 * A reflection: one learner message, one AI reply, feedback only. Never graded,
 * never mints XP (spec D5). `required` in the registry, satisfied by a sealed
 * attestation that the server saw a submission.
 */
export const OpenEndedBlock = z.object({
  type: z.literal("openEnded"),
  ...blockBase,
  prompt: z.string().min(1),
  /** Bounds one cache-shaped Gemini call. */
  maxWords: z.number().int().min(20).max(500).default(200),
});

export type OpenEndedBlockT = z.infer<typeof OpenEndedBlock>;
