/**
 * Pure helpers behind `scripts/init-program.ts`: argument parsing, cluster and
 * program-id resolution, account decoders and instruction builders. Nothing
 * here reads the environment, touches the network or prints, so it is unit
 * tested in `scripts/__tests__/program-admin.test.ts`.
 *
 * Instructions are built from the committed IDL (`idl/onchain_academy.json`)
 * with a raw `BorshCoder`, in the account order the program reads them.
 */
import { BN, BorshCoder, type Idl } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import idlJson from "../../idl/onchain_academy.json";

const coder = new BorshCoder(idlJson as unknown as Idl);

export const BPF_LOADER_UPGRADEABLE_ID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);
export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

/** Genesis hashes (public, stable), as in apps/web/src/lib/solana/network.ts. */
export const GENESIS_HASH = {
  devnet: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  mainnet: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d",
} as const;

export type Cluster = keyof typeof GENESIS_HASH;

/** `max_xp_per_call` for the backend minter; mirrors MAX_QUEST_MINT_XP in apps/web/src/lib/solana/onchain-queue.ts. */
export const DEFAULT_BACKEND_MAX_XP_PER_CALL = 100n;
export const MAX_LABEL_LEN = 32;

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

export interface ParsedArgs {
  command: string | undefined;
  flags: Record<string, string>;
}

/** `cmd --flag value --bool`; a flag followed by another flag (or nothing) is `"true"`. */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (!token?.startsWith("--")) {
      throw new UsageError(`Unexpected argument "${token}"`);
    }
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[key] = "true";
    } else {
      flags[key] = next;
      i++;
    }
  }
  return { command, flags };
}

/** `--cluster devnet|mainnet` is required: there is no default cluster. */
export function resolveCluster(flags: Record<string, string>): Cluster {
  const raw = flags.cluster;
  if (raw === "devnet" || raw === "mainnet") return raw;
  throw new UsageError(
    `--cluster devnet|mainnet is required${raw ? ` (got "${raw}")` : ""}`
  );
}

/** The RPC must answer with the declared cluster's genesis hash. */
export function assertGenesis(cluster: Cluster, genesisHash: string): void {
  if (genesisHash !== GENESIS_HASH[cluster]) {
    throw new UsageError(
      `The RPC is not ${cluster}: its genesis hash does not match. Check SOLANA_RPC_URL.`
    );
  }
}

/** `--program-id`, else ACADEMY_PROGRAM_ID, else NEXT_PUBLIC_PROGRAM_ID. No default. */
export function resolveProgramId(
  flags: Record<string, string>,
  env: Record<string, string | undefined>
): PublicKey {
  const raw =
    flags["program-id"] ?? env.ACADEMY_PROGRAM_ID ?? env.NEXT_PUBLIC_PROGRAM_ID;
  if (!raw || raw === "true") {
    throw new UsageError(
      "Program id required: --program-id <id>, or ACADEMY_PROGRAM_ID / NEXT_PUBLIC_PROGRAM_ID"
    );
  }
  return parsePubkey(raw, "program id");
}

export function parsePubkey(raw: string, what: string): PublicKey {
  try {
    return new PublicKey(raw);
  } catch {
    throw new UsageError(`Invalid ${what}: "${raw}"`);
  }
}

/** A positive u64 from a flag; `required` flags have no default. */
export function parseU64(
  flags: Record<string, string>,
  name: string,
  fallback?: bigint
): bigint {
  const raw = flags[name];
  if (raw === undefined || raw === "true") {
    if (fallback !== undefined) return fallback;
    throw new UsageError(`--${name} <n> is required`);
  }
  if (!/^\d+$/.test(raw)) {
    throw new UsageError(`--${name} must be a non-negative integer`);
  }
  const value = BigInt(raw);
  if (value > 0xffff_ffff_ffff_ffffn) {
    throw new UsageError(`--${name} does not fit in a u64`);
  }
  return value;
}

export function parseBool(
  flags: Record<string, string>,
  name: string
): boolean {
  const raw = flags[name];
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new UsageError(`--${name} true|false is required`);
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export function configPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  )[0];
}

export function minterRolePda(
  minter: PublicKey,
  programId: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    programId
  )[0];
}

/** The program's ProgramData account under the upgradeable loader. */
export function programDataAddress(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    BPF_LOADER_UPGRADEABLE_ID
  )[0];
}

// ---------------------------------------------------------------------------
// Account decoders
// ---------------------------------------------------------------------------

export interface ProgramDataState {
  slot: bigint;
  /** `null` for an immutable program. */
  upgradeAuthority: PublicKey | null;
}

/** bincode `UpgradeableLoaderState::ProgramData`: u32 tag 3, u64 slot, Option<Pubkey>. */
export function decodeProgramData(data: Buffer): ProgramDataState {
  if (data.length < 45 || data.readUInt32LE(0) !== 3) {
    throw new Error("Not a ProgramData account");
  }
  const slot = data.readBigUInt64LE(4);
  const tag = data[12];
  if (tag === 0) return { slot, upgradeAuthority: null };
  if (tag !== 1) throw new Error("Malformed ProgramData authority option");
  return { slot, upgradeAuthority: new PublicKey(data.subarray(13, 45)) };
}

export interface ConfigState {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
  paused: boolean;
  courseNonce: number;
}

const CONFIG_DISCRIMINATOR = Buffer.from([
  155, 12, 170, 224, 30, 250, 204, 130,
]);

/** Config: 8 disc | authority | backend_signer | xp_mint | paused @104 | course_nonce @105 | bump @112. */
export function decodeConfig(data: Buffer): ConfigState {
  if (data.length < 113 || !data.subarray(0, 8).equals(CONFIG_DISCRIMINATOR)) {
    throw new Error("Not a Config account");
  }
  return {
    authority: new PublicKey(data.subarray(8, 40)),
    backendSigner: new PublicKey(data.subarray(40, 72)),
    xpMint: new PublicKey(data.subarray(72, 104)),
    paused: data[104] === 1,
    courseNonce: data.readUInt32LE(105),
  };
}

export interface MinterRoleState {
  minter: PublicKey;
  label: string;
  maxXpPerCall: bigint;
  totalXpMinted: bigint;
  isActive: boolean;
  maxTotalXp: bigint;
}

const MINTER_ROLE_DISCRIMINATOR = Buffer.from([
  21, 246, 6, 133, 142, 211, 33, 193,
]);

/** MinterRole: 8 disc | minter | label (u32 + bytes) | max_xp_per_call | total_xp_minted | is_active | created_at | max_total_xp | bump. */
export function decodeMinterRole(data: Buffer): MinterRoleState {
  if (
    data.length < 44 ||
    !data.subarray(0, 8).equals(MINTER_ROLE_DISCRIMINATOR)
  ) {
    throw new Error("Not a MinterRole account");
  }
  const labelLen = data.readUInt32LE(40);
  const o = 44 + labelLen;
  if (o + 8 + 8 + 1 + 8 + 8 + 1 > data.length) {
    throw new Error("Malformed MinterRole account");
  }
  return {
    minter: new PublicKey(data.subarray(8, 40)),
    label: data.subarray(44, o).toString("utf8"),
    maxXpPerCall: data.readBigUInt64LE(o),
    totalXpMinted: data.readBigUInt64LE(o + 8),
    isActive: data[o + 16] === 1,
    maxTotalXp: data.readBigUInt64LE(o + 25),
  };
}

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

/** `initialize`. `authority` must be the program's upgrade authority. */
export function buildInitializeIx(
  programId: PublicKey,
  authority: PublicKey,
  xpMint: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: configPda(programId), isSigner: false, isWritable: true },
      { pubkey: xpMint, isSigner: true, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      {
        pubkey: minterRolePda(authority, programId),
        isSigner: false,
        isWritable: true,
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: programDataAddress(programId),
        isSigner: false,
        isWritable: false,
      },
    ],
    data: coder.instruction.encode("initialize", {}),
  });
}

export interface UpdateConfigChange {
  newBackendSigner?: PublicKey;
  paused?: boolean;
  newAuthority?: PublicKey;
}

/**
 * `update_config`. Rotating the backend signer must pass the CURRENT backend's
 * `["minter", old]` role PDA, which the program deactivates.
 */
export function buildUpdateConfigIx(
  programId: PublicKey,
  authority: PublicKey,
  change: UpdateConfigChange,
  currentBackendSigner?: PublicKey
): TransactionInstruction {
  const keys = [
    { pubkey: configPda(programId), isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: true, isWritable: false },
  ];
  if (change.newBackendSigner) {
    if (!currentBackendSigner) {
      throw new UsageError(
        "Rotating the backend signer needs the current backend signer (its minter role is retired)"
      );
    }
    keys.push({
      pubkey: minterRolePda(currentBackendSigner, programId),
      isSigner: false,
      isWritable: true,
    });
  }
  return new TransactionInstruction({
    programId,
    keys,
    data: coder.instruction.encode("update_config", {
      params: {
        new_backend_signer: change.newBackendSigner ?? null,
        paused: change.paused ?? null,
        new_authority: change.newAuthority ?? null,
      },
    }),
  });
}

export interface RegisterMinterParams {
  minter: PublicKey;
  label: string;
  maxXpPerCall: bigint;
  /** Lifetime cap; 0 would mean unlimited, which this tooling refuses. */
  maxTotalXp: bigint;
}

/** `register_minter`, paid by the authority. */
export function buildRegisterMinterIx(
  programId: PublicKey,
  authority: PublicKey,
  params: RegisterMinterParams
): TransactionInstruction {
  if (Buffer.byteLength(params.label, "utf8") > MAX_LABEL_LEN) {
    throw new UsageError(`--label is longer than ${MAX_LABEL_LEN} bytes`);
  }
  if (params.maxTotalXp === 0n) {
    throw new UsageError(
      "--max-total-xp must be greater than 0 (0 means unlimited on-chain)"
    );
  }
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: configPda(programId), isSigner: false, isWritable: false },
      {
        pubkey: minterRolePda(params.minter, programId),
        isSigner: false,
        isWritable: true,
      },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: coder.instruction.encode("register_minter", {
      params: {
        minter: params.minter,
        label: params.label,
        max_xp_per_call: new BN(params.maxXpPerCall.toString()),
        max_total_xp: new BN(params.maxTotalXp.toString()),
      },
    }),
  });
}

/** Decodes an instruction built above (for tests and the dry-run printout). */
export function decodeIx(data: Buffer): { name: string; data: unknown } | null {
  return coder.instruction.decode(data);
}

// ---------------------------------------------------------------------------
// Keypair files
// ---------------------------------------------------------------------------

/**
 * Writes `kp` as a Solana CLI keypair file in `dir`, owner-only (0600), and
 * never over an existing file. Returns the path; the secret is never printed.
 */
export function writeKeypairFile(
  dir: string,
  name: string,
  kp: Keypair
): string {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, name);
  fs.writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)), {
    mode: 0o600,
    flag: "wx",
  });
  // `mode` is masked by the umask on create; set it explicitly.
  fs.chmodSync(file, 0o600);
  return file;
}

/** Reads a Solana CLI keypair file (a JSON array of 64 bytes). */
export function readKeypairFile(file: string): Keypair {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new UsageError(`Cannot read a keypair from ${file}`);
  }
  return keypairFromBytes(parsed, file);
}

export function keypairFromBytes(parsed: unknown, source: string): Keypair {
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new UsageError(`${source} is not a 64-byte keypair array`);
  }
  try {
    return Keypair.fromSecretKey(Uint8Array.from(parsed as number[]));
  } catch {
    throw new UsageError(`${source} is not a valid keypair`);
  }
}

/** Replaces every http(s) URL in `text`: RPC errors can embed the URL and its key. */
export function redactUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, "[redacted-url]");
}
