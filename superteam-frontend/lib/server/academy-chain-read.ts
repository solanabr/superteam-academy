import { Connection, PublicKey } from "@solana/web3.js";
import { unstable_cache } from "next/cache";
import {
  ACADEMY_PROGRAM_ID,
  ACADEMY_RPC_URL,
} from "@/lib/generated/academy-program";
import { CacheTags } from "./cache-tags";

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
      filters: [{ dataSize: 96 }],
    });
    const out: OnChainLearnerProfile[] = [];
    for (const { pubkey, account } of accounts) {
      const data = account.data as Buffer;
      // LearnerProfile: 8 discriminator + 88 LEN = 96 bytes
      if (data.length !== 96) continue;
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

// ---------------------------------------------------------------------------
// Credential NFTs via Helius DAS API
// ---------------------------------------------------------------------------

export type OnChainCredentialNFT = {
  id: string;
  name: string;
  mintAddress: string;
  imageUrl: string;
  trackName: string;
  level: number;
  coursesCompleted: number;
  xp: number;
  completionDate: string;
};

type DASAsset = {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
    links?: {
      image?: string;
    };
    json_uri?: string;
  };
  authorities?: Array<{
    address: string;
    scopes: string[];
  }>;
  creators?: Array<{
    address: string;
    verified: boolean;
  }>;
  ownership?: {
    owner: string;
  };
};

function parseDASAttribute(
  attributes: Array<{ trait_type: string; value: string }> | undefined,
  key: string,
): string | undefined {
  return attributes?.find(
    (a) => a.trait_type.toLowerCase() === key.toLowerCase(),
  )?.value;
}

function isAcademyCredential(asset: DASAsset): boolean {
  const programIdStr = ACADEMY_PROGRAM_ID;

  const authorityMatch = asset.authorities?.some(
    (a) => a.address === programIdStr,
  );
  if (authorityMatch) return true;

  const creatorMatch = asset.creators?.some(
    (c) => c.address === programIdStr && c.verified,
  );
  if (creatorMatch) return true;

  const attrs = asset.content?.metadata?.attributes;
  const programAttr = parseDASAttribute(attrs, "program");
  if (programAttr === programIdStr) return true;

  const name = asset.content?.metadata?.name ?? "";
  if (name.startsWith("Superteam Academy")) return true;

  return false;
}

function dasAssetToCredential(asset: DASAsset): OnChainCredentialNFT {
  const attrs = asset.content?.metadata?.attributes;
  const name = asset.content?.metadata?.name ?? "Academy Credential";
  const imageUrl = asset.content?.links?.image ?? "";

  return {
    id: asset.id,
    name,
    mintAddress: asset.id,
    imageUrl,
    trackName: parseDASAttribute(attrs, "track") ?? "General",
    level: parseInt(parseDASAttribute(attrs, "level") ?? "1", 10),
    coursesCompleted: parseInt(
      parseDASAttribute(attrs, "courses_completed") ?? "0",
      10,
    ),
    xp: parseInt(parseDASAttribute(attrs, "xp") ?? "0", 10),
    completionDate:
      parseDASAttribute(attrs, "completion_date") ??
      new Date().toISOString().split("T")[0]!,
  };
}

/**
 * Fetch Metaplex Core NFT credentials from the Helius DAS API.
 * Filters assets owned by the wallet to only those issued by the academy program.
 */
async function _getCredentialNFTs(
  walletAddress: string,
): Promise<OnChainCredentialNFT[]> {
  try {
    const response = await fetch(ACADEMY_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "getAssetsByOwner",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          displayOptions: {
            showCollectionMetadata: true,
          },
        },
      }),
    });

    if (!response.ok) return [];

    const json = await response.json();
    const items: DASAsset[] = json?.result?.items ?? [];

    return items.filter(isAcademyCredential).map(dasAssetToCredential);
  } catch {
    return [];
  }
}

function cachedGetCredentialNFTs(wallet: string) {
  return unstable_cache(
    () => _getCredentialNFTs(wallet),
    ["getCredentialNFTs", wallet],
    { tags: [CacheTags.credentialNfts(wallet)], revalidate: 600 },
  );
}

export async function getCredentialNFTs(
  walletAddress: string,
): Promise<OnChainCredentialNFT[]> {
  return cachedGetCredentialNFTs(walletAddress)();
}
