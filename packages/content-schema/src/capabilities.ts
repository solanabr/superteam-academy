import { z } from "zod";

/**
 * Per-learner state that one block produces and a later block consumes.
 * Closed set so CI can verify ordering (spec §4.9): every `consumes: X` must be
 * preceded, by slot order within the course, by a block that `produces: X`.
 */
export const CAPABILITY_KEYS = ["funded-wallet", "deployed-program"] as const;

export const CapabilityKey = z.enum(CAPABILITY_KEYS);
export type CapabilityKeyT = z.infer<typeof CapabilityKey>;
