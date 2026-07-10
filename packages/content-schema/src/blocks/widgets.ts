import { z } from "zod";
import { blockBase, relativePath } from "./base";

/**
 * Each widget is its own block type (Amendment A), so the block type IS the
 * renderer-registry key. A widget that renders nothing cannot exist: the union
 * rejects a type with no member, which is exactly the `deployed-program-card`
 * failure mode this replaces.
 */

export const WalletFundingBlock = z.object({
  type: z.literal("wallet-funding"),
  ...blockBase,
  /** Gate 13a local half: funding a wallet can only ever produce `funded-wallet`. */
  produces: z.literal("funded-wallet").optional(),
  /** SOL. Hardcoded to 2 in wallet-funding-card.tsx today. */
  amount: z.number().positive().max(5).default(2),
  network: z.literal("devnet").default("devnet"),
});

export const ProgramExplorerBlock = z.object({
  type: z.literal("program-explorer"),
  ...blockBase,
  /** A pure consumer — it can never produce a capability. */
  produces: z.never().optional(),
  /**
   * A real file, not a textarea. CI asserts it parses, has a non-empty
   * `instructions` array, and that `metadata.name` matches the keypair-storage
   * key `generic-program-explorer.tsx` looks for.
   */
  idl: relativePath(".json"),
});

export const DeployedProgramCardBlock = z.object({
  type: z.literal("deployed-program-card"),
  ...blockBase,
  /** A pure consumer — it can never produce a capability. */
  produces: z.never().optional(),
});

export type WalletFundingBlockT = z.infer<typeof WalletFundingBlock>;
export type ProgramExplorerBlockT = z.infer<typeof ProgramExplorerBlock>;
export type DeployedProgramCardBlockT = z.infer<
  typeof DeployedProgramCardBlock
>;
