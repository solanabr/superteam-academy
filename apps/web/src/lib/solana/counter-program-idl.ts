import type { Idl } from "@coral-xyz/anchor";

/**
 * Hardcoded IDL for the Solarium counter program (PDA-based).
 *
 * The program exposes four instructions:
 *   - initialize: Creates a Counter PDA with count = 0
 *   - greet:      Logs a greeting (no state mutation)
 *   - increment:  Adds 1 to the counter
 *   - decrement:  Subtracts 1 (reverts with Underflow if count == 0)
 *
 * Counter accounts are PDAs derived from seeds [b"counter", user_wallet_pubkey].
 * Each wallet gets exactly one counter per deployed program — deterministic,
 * no keypair storage needed.
 *
 * Anchor v0.32 changed the IDL schema significantly:
 *   - `address` is now required (set to a placeholder; overridden at runtime)
 *   - `metadata` replaces the top-level `version`/`name` fields
 *   - Instructions require explicit `discriminator` arrays
 *   - Accounts use `writable`/`signer` booleans instead of `isMut`/`isSigner`
 *   - Account defs also need `discriminator` arrays
 *   - PDA accounts include `pda.seeds` for address derivation
 *
 * Because the program address is different per student, the `address` field is
 * set to a dummy value and should be replaced when constructing the `Program`.
 *
 * Discriminator values are the first 8 bytes of SHA-256("global:<fn_name>")
 * for instructions, and SHA-256("account:<AccountName>") for accounts.
 * We pre-compute them here so we don't need async crypto at import time.
 */

// Pre-computed SHA-256("global:initialize")[0..8]
const DISC_INITIALIZE = [175, 175, 109, 31, 13, 152, 155, 237];
// Pre-computed SHA-256("global:greet")[0..8]
const DISC_GREET = [203, 194, 3, 150, 228, 58, 181, 62];
// Pre-computed SHA-256("global:increment")[0..8]
const DISC_INCREMENT = [11, 18, 104, 9, 104, 174, 59, 33];
// Pre-computed SHA-256("global:decrement")[0..8]
const DISC_DECREMENT = [106, 227, 168, 59, 248, 27, 150, 101];
// Pre-computed SHA-256("account:Counter")[0..8]
const DISC_COUNTER_ACCOUNT = [255, 176, 4, 245, 188, 253, 124, 25];

// UTF-8 bytes for the PDA seed "counter"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COUNTER_SEED_BYTES: any = [99, 111, 117, 110, 116, 101, 114];

// System program address constant
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";

// Placeholder address — replaced at runtime with the student's deployed program
const PLACEHOLDER_ADDRESS = "11111111111111111111111111111111";

/**
 * The counter IDL in Anchor 0.32+ format.
 *
 * We cast through `unknown` because the object literal doesn't perfectly match
 * every optional field in the `Idl` type, but it is structurally compatible
 * with `BorshInstructionCoder` and `Program` at runtime.
 */
export const COUNTER_IDL = {
  address: PLACEHOLDER_ADDRESS,
  metadata: {
    name: "solarium_program",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "initialize",
      discriminator: DISC_INITIALIZE,
      accounts: [
        {
          name: "counter",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: COUNTER_SEED_BYTES },
              { kind: "account", path: "user" },
            ],
          },
        },
        { name: "user", writable: true, signer: true },
        {
          name: "system_program",
          address: SYSTEM_PROGRAM_ID,
        },
      ],
      args: [],
    },
    {
      name: "greet",
      discriminator: DISC_GREET,
      accounts: [{ name: "greet", writable: false, signer: false }],
      args: [],
    },
    {
      name: "increment",
      discriminator: DISC_INCREMENT,
      accounts: [
        {
          name: "counter",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: COUNTER_SEED_BYTES },
              { kind: "account", path: "user" },
            ],
          },
        },
        { name: "user", signer: true },
      ],
      args: [],
    },
    {
      name: "decrement",
      discriminator: DISC_DECREMENT,
      accounts: [
        {
          name: "counter",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: COUNTER_SEED_BYTES },
              { kind: "account", path: "user" },
            ],
          },
        },
        { name: "user", signer: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Counter",
      discriminator: DISC_COUNTER_ACCOUNT,
    },
  ],
  types: [
    {
      name: "Counter",
      type: {
        kind: "struct" as const,
        fields: [
          { name: "count", type: "u64" as const },
          { name: "authority", type: "publicKey" as const },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "Underflow", msg: "Cannot decrement below zero" },
  ],
} as unknown as Idl;
