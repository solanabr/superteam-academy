import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
);

export const XP_MINT = process.env.NEXT_PUBLIC_XP_MINT
  ? new PublicKey(process.env.NEXT_PUBLIC_XP_MINT)
  : null;

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER ?? "devnet") as
  | "mainnet-beta"
  | "devnet"
  | "testnet";

export const HELIUS_RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ??
  (CLUSTER === "devnet"
    ? `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? ""}`
    : `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? ""}`);

export function getConnection(): Connection {
  const endpoint =
    process.env.NEXT_PUBLIC_RPC_URL ??
    (HELIUS_RPC_URL || clusterApiUrl(CLUSTER));
  return new Connection(endpoint, "confirmed");
}

export function getXpAta(walletAddress: string): PublicKey | null {
  if (!XP_MINT) return null;
  try {
    return getAssociatedTokenAddressSync(
      XP_MINT,
      new PublicKey(walletAddress),
      false,
      TOKEN_2022_PROGRAM_ID
    );
  } catch {
    return null;
  }
}

export async function fetchXpBalance(walletAddress: string): Promise<number> {
  const ata = getXpAta(walletAddress);
  if (!ata) return 0;
  try {
    const conn = getConnection();
    const balance = await conn.getTokenAccountBalance(ata);
    return Number(balance.value.amount);
  } catch {
    return 0;
  }
}

export async function fetchAllXpBalances(): Promise<
  Array<{ wallet: string; xp: number }>
> {
  if (!XP_MINT) return [];
  try {
    const conn = getConnection();
    const accounts = await conn.getTokenLargestAccounts(XP_MINT);
    const results: Array<{ wallet: string; xp: number }> = [];
    for (const acc of accounts.value) {
      try {
        const info = await conn.getParsedAccountInfo(acc.address);
        if (
          info.value?.data &&
          typeof info.value.data === "object" &&
          "parsed" in info.value.data
        ) {
          const parsed = info.value.data.parsed as {
            info?: { owner?: string; tokenAmount?: { amount?: string } };
          };
          if (parsed.info?.owner) {
            results.push({
              wallet: parsed.info.owner,
              xp: Number(parsed.info.tokenAmount?.amount ?? 0),
            });
          }
        }
      } catch {
        // skip
      }
    }
    return results.sort((a, b) => b.xp - a.xp);
  } catch {
    return [];
  }
}

export function solanaExplorerUrl(
  addressOrSig: string,
  type: "address" | "tx" = "address"
): string {
  const cluster = CLUSTER !== "mainnet-beta" ? `?cluster=${CLUSTER}` : "";
  return `https://explorer.solana.com/${type}/${addressOrSig}${cluster}`;
}
