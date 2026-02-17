import { Connection, PublicKey } from "@solana/web3.js";
import {
  ACADEMY_PROGRAM_ID,
  ACADEMY_RPC_URL,
} from "@/lib/generated/academy-program";

const CONFIG_SEED = "config";
const LEARNER_SEED = "learner";

const connection = new Connection(ACADEMY_RPC_URL, "confirmed");
const programId = new PublicKey(ACADEMY_PROGRAM_ID);

export type OnChainConfig = {
  authority: string;
  backendSigner: string;
  currentSeason: number;
  currentMint: string;
  seasonClosed: boolean;
  bump: number;
  address: string;
};

export type OnChainLearnerProfile = {
  authority: string;
  level: number;
  xpTotal: number;
  streakCurrent: number;
  streakLongest: number;
  lastActivityTs: number;
  profileAsset: string | null;
  bump: number;
  address: string;
};

function ensureOwnedByProgram(owner: PublicKey): void {
  if (!owner.equals(programId)) {
    throw new Error("Account is not owned by the academy program");
  }
}

function readU16LE(data: Buffer, offset: number): number {
  return data.readUInt16LE(offset);
}

function readU64LEAsNumber(data: Buffer, offset: number): number {
  return Number(data.readBigUInt64LE(offset));
}

function readI64LEAsNumber(data: Buffer, offset: number): number {
  return Number(data.readBigInt64LE(offset));
}

function readPubkeyString(data: Buffer, offset: number): string {
  return new PublicKey(data.subarray(offset, offset + 32)).toBase58();
}

function deriveConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    programId,
  );
  return pda;
}

function deriveLearnerPda(walletAddress: string): PublicKey {
  const wallet = new PublicKey(walletAddress);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(LEARNER_SEED), wallet.toBuffer()],
    programId,
  );
  return pda;
}

export function getLearnerProfilePda(walletAddress: string): string {
  return deriveLearnerPda(walletAddress).toBase58();
}

export function getAcademyProgramId(): string {
  return programId.toBase58();
}

function decodeConfigAccount(address: PublicKey, data: Buffer): OnChainConfig {
  let offset = 8; // skip anchor discriminator
  const authority = readPubkeyString(data, offset);
  offset += 32;
  const backendSigner = readPubkeyString(data, offset);
  offset += 32;
  const currentSeason = readU16LE(data, offset);
  offset += 2;
  const currentMint = readPubkeyString(data, offset);
  offset += 32;
  const seasonClosed = data.readUInt8(offset) === 1;
  offset += 1;
  const bump = data.readUInt8(offset);

  return {
    authority,
    backendSigner,
    currentSeason,
    currentMint,
    seasonClosed,
    bump,
    address: address.toBase58(),
  };
}

function decodeLearnerAccount(
  address: PublicKey,
  data: Buffer,
): OnChainLearnerProfile {
  let offset = 8; // skip anchor discriminator
  const authority = readPubkeyString(data, offset);
  offset += 32;
  const level = readU16LE(data, offset);
  offset += 2;
  const xpTotal = readU64LEAsNumber(data, offset);
  offset += 8;
  const streakCurrent = readU16LE(data, offset);
  offset += 2;
  const streakLongest = readU16LE(data, offset);
  offset += 2;
  const lastActivityTs = readI64LEAsNumber(data, offset);
  offset += 8;

  const hasProfileAsset = data.readUInt8(offset) === 1;
  offset += 1;
  const profileAsset = hasProfileAsset ? readPubkeyString(data, offset) : null;
  if (hasProfileAsset) {
    offset += 32;
  }

  const bump = data.readUInt8(offset);

  return {
    authority,
    level,
    xpTotal,
    streakCurrent,
    streakLongest,
    lastActivityTs,
    profileAsset,
    bump,
    address: address.toBase58(),
  };
}

export async function getAcademyConfigOnChain(): Promise<OnChainConfig | null> {
  try {
    const configPda = deriveConfigPda();
    const accountInfo = await connection.getAccountInfo(configPda);
    if (!accountInfo) return null;
    ensureOwnedByProgram(accountInfo.owner);
    return decodeConfigAccount(configPda, accountInfo.data);
  } catch (error: any) {
    // Network errors - return null (safe fallback)
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      return null;
    }
    throw error;
  }
}

const LEARNER_DISCRIMINATOR = Buffer.from([
  198, 114, 44, 71, 161, 227, 116, 166,
]);

export async function getAllLearnerProfilesOnChain(): Promise<
  OnChainLearnerProfile[]
> {
  try {
    const accounts = await connection.getProgramAccounts(programId, {
      commitment: "confirmed",
    });
    const out: OnChainLearnerProfile[] = [];
    for (const { pubkey, account } of accounts) {
      const data = account.data as Buffer;
      if (data.length !== 56 && data.length !== 88) continue;
      if (!data.subarray(0, 8).equals(LEARNER_DISCRIMINATOR)) continue;
      ensureOwnedByProgram(account.owner);
      out.push(decodeLearnerAccount(pubkey, data));
    }
    return out;
  } catch (error: any) {
    // Network errors - return empty array (safe fallback)
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      return [];
    }
    throw error;
  }
}

export async function getLearnerProfileOnChain(
  walletAddress: string,
): Promise<OnChainLearnerProfile | null> {
  try {
    const learnerPda = deriveLearnerPda(walletAddress);
    const accountInfo = await connection.getAccountInfo(learnerPda);
    if (!accountInfo) return null;
    ensureOwnedByProgram(accountInfo.owner);
    return decodeLearnerAccount(learnerPda, accountInfo.data);
  } catch (error: any) {
    // Network errors - return null (safe fallback)
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      return null;
    }
    throw error;
  }
}
