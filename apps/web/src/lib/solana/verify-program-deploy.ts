import "server-only";
import { Connection, PublicKey } from "@solana/web3.js";

// On-chain verification that a claimed program id is a real BPF Upgradeable
// Loader program whose upgrade authority is a specific wallet (#560 / LX-E1).
//
// BPF Upgradeable Loader account layout (bincode-serialized
// `UpgradeableLoaderState`, enum tag = u32 LE):
//
//   Program account (36 bytes, `executable: true`):
//     [0..4)   tag = 2 (Program)
//     [4..36)  programdata_address: Pubkey
//
//   ProgramData account (45-byte header + program bytes):
//     [0..4)   tag = 3 (ProgramData)
//     [4..12)  slot: u64 LE (last deploy slot)
//     [12]     Option<Pubkey> flag: 1 = Some, 0 = None (authority burned)
//     [13..45) upgrade_authority_address: Pubkey (when flag = 1)

export const BPF_LOADER_UPGRADEABLE_ID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

const PROGRAM_STATE_TAG = 2;
const PROGRAM_DATA_STATE_TAG = 3;
const PROGRAM_ACCOUNT_LEN = 36;
const PROGRAM_DATA_HEADER_LEN = 45;
const AUTHORITY_OPTION_OFFSET = 12;
const AUTHORITY_OFFSET = 13;

export type DeployVerificationFailure =
  | "missing" // program (or its ProgramData) account does not exist
  | "not-executable" // account exists but is not an executable program
  | "not-upgradeable" // executable but not owned by the upgradeable loader
  | "malformed" // account data does not match the loader layout
  | "authority-mismatch"; // upgrade authority absent (burned) or not the wallet

export type DeployVerificationResult =
  | { ok: true }
  | { ok: false; reason: DeployVerificationFailure };

/**
 * Verify on-chain that `programId` is a live, executable BPF Upgradeable
 * Loader program whose upgrade authority is `expectedAuthority`.
 *
 * Read-only: two `getAccountInfo` calls, no transactions. RPC/network errors
 * propagate to the caller (which should fail closed) — only definitive
 * on-chain answers produce an `{ ok: false }` result.
 */
export async function verifyProgramDeployment(
  connection: Connection,
  programId: PublicKey,
  expectedAuthority: PublicKey
): Promise<DeployVerificationResult> {
  const programAccount = await connection.getAccountInfo(programId);
  if (!programAccount) return { ok: false, reason: "missing" };
  if (!programAccount.executable) {
    return { ok: false, reason: "not-executable" };
  }
  if (!programAccount.owner.equals(BPF_LOADER_UPGRADEABLE_ID)) {
    // Executable but owned by another loader (native/v2) — it has no
    // ProgramData, so there is no upgrade authority to attribute it to.
    return { ok: false, reason: "not-upgradeable" };
  }

  const data = programAccount.data;
  if (
    data.length < PROGRAM_ACCOUNT_LEN ||
    data.readUInt32LE(0) !== PROGRAM_STATE_TAG
  ) {
    return { ok: false, reason: "malformed" };
  }
  const programDataAddress = new PublicKey(
    data.subarray(4, PROGRAM_ACCOUNT_LEN)
  );

  // Loader invariant: the ProgramData account is the PDA of the program id.
  // Cross-check the parsed pointer so a crafted account can't redirect the
  // authority read.
  const [canonicalProgramData] = PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    BPF_LOADER_UPGRADEABLE_ID
  );
  if (!programDataAddress.equals(canonicalProgramData)) {
    return { ok: false, reason: "malformed" };
  }

  // dataSlice: the header is 45 bytes; without it the RPC would ship the
  // entire program binary (hundreds of KB) just to read the authority.
  const programDataAccount = await connection.getAccountInfo(
    programDataAddress,
    { dataSlice: { offset: 0, length: PROGRAM_DATA_HEADER_LEN } }
  );
  if (!programDataAccount) return { ok: false, reason: "missing" };
  if (!programDataAccount.owner.equals(BPF_LOADER_UPGRADEABLE_ID)) {
    return { ok: false, reason: "malformed" };
  }

  const header = programDataAccount.data;
  if (
    header.length < PROGRAM_DATA_HEADER_LEN ||
    header.readUInt32LE(0) !== PROGRAM_DATA_STATE_TAG
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (header[AUTHORITY_OPTION_OFFSET] !== 1) {
    // Upgrade authority burned (None) — nobody can claim ownership.
    return { ok: false, reason: "authority-mismatch" };
  }

  const authority = new PublicKey(
    header.subarray(AUTHORITY_OFFSET, AUTHORITY_OFFSET + 32)
  );
  if (!authority.equals(expectedAuthority)) {
    return { ok: false, reason: "authority-mismatch" };
  }

  return { ok: true };
}
