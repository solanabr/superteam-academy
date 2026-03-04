import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Credential } from "@/types";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL);

// The canonical XP Mint for the platform (should be configured in env)
const XP_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT || "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");

/**
 * Fetches the real XP balance from the blockchain (Token-2022)
 */
export async function getXPBalance(wallet: PublicKey): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(
      XP_MINT,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
    const account = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    
    // XP is usually 0 decimals for simplicity on-chain
    return Number(account.amount);
  } catch (error) {
    // If the account doesn't exist, they have 0 XP
    return 0;
  }
}

/**
 * Fetches verifiable credentials (badges/NFTs) for the user
 */
export async function getCredentials(wallet: PublicKey): Promise<Credential[]> {
  try {
    // In a production app, we would use Helius Digital Asset Standard (DAS) API here
    // For now, we fetch the token accounts and filter for known Academy badge mints
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      programId: TOKEN_2022_PROGRAM_ID,
    });

    // Map on-chain tokens to our Credential format
    // This is a simplified version - in production we'd fetch NFT metadata (Metaplex/DAS)
    const credentials: Credential[] = tokenAccounts.value
      .filter(ta => {
        // Here you would filter by known Academy mints or collections
        return ta.account.data.parsed.info.tokenAmount.uiAmount > 0;
      })
      .map(ta => {
        const info = ta.account.data.parsed.info;
        return {
          id: info.mint.slice(0, 8),
          track: "Development", // Should be derived from metadata
          level: 1,
          earnedAt: new Date().toISOString().split('T')[0],
          xp: 0,
          mintAddress: info.mint,
          metadata: {
            name: `Academy Badge (${info.mint.slice(0, 4)})`,
            image: "/credentials/placeholder.png",
            attributes: [],
          },
        };
      });

    return credentials.length > 0 ? credentials : [];
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return [];
  }
}

// Calculate level from XP
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) || 1;
}

// Calculate XP needed for next level
export function getXPToNextLevel(level: number): number {
  return Math.pow(level + 1, 2) * 100;
}

// Calculate progress to next level
export function getProgressToNextLevel(xp: number): number {
  const level = calculateLevel(xp);
  const currentLevelBaseXP = Math.pow(level, 2) * 100;
  const nextLevelXP = Math.pow(level + 1, 2) * 100;
  const progress = ((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}
