/**
 * Blockchain service — all chain calls wrapped here.
 * UI must NEVER call chain directly; all privileged actions via /api.
 * Phase 7: Devnet connection, XP mint fetch, level derivation, enrollment tx,
 * backend signer for lesson completion, credential issuance, achievement award.
 * Helius integration for leaderboard indexing.
 */
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
export const XP_MINT = process.env.NEXT_PUBLIC_XP_MINT;
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC ?? clusterApiUrl("devnet");
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_DAS_URL =
  process.env.HELIUS_DAS_URL ?? (HELIUS_API_KEY ? `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}` : null);

let _connection: Connection | null = null;

function get_connection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, { commitment: "confirmed" });
  }
  return _connection;
}

export type XpBalance = {
  total_xp: number;
  level: number;
};

/** Level = floor(sqrt(totalXP / 100)) */
export function level_from_xp(total_xp: number): number {
  return Math.floor(Math.sqrt(total_xp / 100));
}

export async function get_xp_balance(wallet_public_key: string): Promise<XpBalance | null> {
  if (!XP_MINT || !PROGRAM_ID) return null;

  try {
    const connection = get_connection();
    const wallet = new PublicKey(wallet_public_key);
    const mint = new PublicKey(XP_MINT);

    const ata = await getAssociatedTokenAddress(mint, wallet, false, TOKEN_2022_PROGRAM_ID);

    const accountInfo = await connection.getTokenAccountBalance(ata, "confirmed").catch(() => null);
    if (!accountInfo) {
      return { total_xp: 0, level: 0 };
    }

    const raw = Number(accountInfo.value.amount);
    const total_xp = Number.isFinite(raw) ? raw : 0;
    const level = level_from_xp(total_xp);
    return { total_xp, level };
  } catch {
    return { total_xp: 0, level: 0 };
  }
}

export async function get_enrollment_status(
  wallet_public_key: string,
  course_id: string,
): Promise<boolean> {
  if (!PROGRAM_ID) return false;

  try {
    const programId = new PublicKey(PROGRAM_ID);
    const wallet = new PublicKey(wallet_public_key);

    const [enrollmentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(course_id, "utf8"), wallet.toBuffer()],
      programId,
    );

    const connection = get_connection();
    const info = await connection.getAccountInfo(enrollmentPda, "confirmed");
    return info !== null;
  } catch {
    return false;
  }
}

export async function fetch_credential_nfts(wallet_public_key: string): Promise<unknown[]> {
  if (!HELIUS_DAS_URL || !HELIUS_API_KEY) {
    return [];
  }

  type Das_asset = {
    id: string;
    grouping?: Array<{ group_key: string; group_value: string }>;
    content?: {
      metadata?: {
        name?: string;
        symbol?: string;
      };
    };
    mint?: string;
  };

  type Das_response = {
    result?: {
      items?: Das_asset[];
    };
  };

  const body = {
    jsonrpc: "2.0",
    id: "credential-nfts",
    method: "getAssetsByOwner",
    params: {
      ownerAddress: wallet_public_key,
      page: 1,
      limit: 100,
      displayOptions: {
        showUnverifiedCollections: false,
      },
    },
  };

  try {
    const response = await fetch(HELIUS_DAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as Das_response;
    const items = json.result?.items ?? [];

    const mapped = items.map((asset) => {
      const mint = asset.mint ?? asset.id;
      const name = asset.content?.metadata?.name ?? "Credential";
      const track_group = asset.grouping?.find((group_item) => group_item.group_key === "collection");
      const track = track_group?.group_value ?? null;

      const explorer_base = "https://explorer.solana.com/address/";
      const explorer_url = `${explorer_base}${mint}?cluster=devnet`;

      return {
        mint_address: mint,
        name,
        track,
        level: null as number | null,
        courses_completed: null as number | null,
        xp: null as number | null,
        explorer_url,
      };
    });

    return mapped;
  } catch {
    return [];
  }
}

export async function fetch_achievement_nfts(wallet_public_key: string): Promise<unknown[]> {
  // TODO: integrate Helius DAS to fetch achievement NFTs for this wallet
  void wallet_public_key;
  return [];
}

export async function reward_xp_onchain(args: {
  wallet_public_key: string;
  amount: number;
  reason: "challenge" | "lesson" | "achievement";
  challenge_id?: string;
}): Promise<string> {
  if (!PROGRAM_ID || !XP_MINT) {
    throw new Error("Program or XP mint not configured");
  }

  // TODO: implement Anchor client call to onchain-academy::reward_xp
  // - Validate enrollment / eligibility on-chain
  // - Prevent duplicate mint for the same (user, reason, challenge_id)
  // - Confirm transaction at 'confirmed' commitment
  // - Retry once on blockhash expiry

  return "TODO_TX_SIGNATURE";
}

export function get_backend_signer_keypair(): Uint8Array | null {
  const raw = process.env.BACKEND_SIGNER_PRIVATE_KEY;
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw) as number[];
    return new Uint8Array(arr);
  } catch {
    return null;
  }
}
