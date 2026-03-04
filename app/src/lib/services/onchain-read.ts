import { Connection, PublicKey, type ParsedAccountData } from "@solana/web3.js";
import type { Credential } from "@/lib/types/learning";

// Token-2022 Program ID
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

// Replace with deployed program values from github.com/solanabr/superteam-academy
// Set NEXT_PUBLIC_XP_TOKEN_MINT and NEXT_PUBLIC_CREDENTIAL_COLLECTION in your .env
const XP_TOKEN_MINT_DEVNET = new PublicKey(
  process.env.NEXT_PUBLIC_XP_TOKEN_MINT || "11111111111111111111111111111111"
);

const HELIUS_DAS_API_DEVNET = "https://devnet.helius-rpc.com/?api-key=";

// Replace with deployed program values from github.com/solanabr/superteam-academy
const CREDENTIAL_COLLECTION_DEVNET =
  process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION || "11111111111111111111111111111111";

interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      description: string;
      image: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
  };
  compression: {
    compressed: boolean;
  };
  ownership: {
    owner: string;
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
}

/**
 * Service for reading on-chain data from Solana Devnet
 * - XP Token balances (Token-2022 NonTransferable)
 * - Credential cNFTs (Metaplex Bubblegum via Helius DAS API)
 */
export class OnChainReadService {
  private connection: Connection;
  private heliusApiKey: string | null;

  constructor(
    rpcUrl: string = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    heliusApiKey?: string
  ) {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.heliusApiKey = heliusApiKey || process.env.NEXT_PUBLIC_HELIUS_API_KEY || null;
  }

  /**
   * Get XP token balance for a wallet
   * Returns 0 if no token account exists or if mint not found
   */
  async getXPBalance(walletAddress: PublicKey | string): Promise<number> {
    try {
      const wallet = typeof walletAddress === "string" 
        ? new PublicKey(walletAddress) 
        : walletAddress;

      // Get all Token-2022 accounts for this wallet
      const accounts = await this.connection.getParsedTokenAccountsByOwner(
        wallet,
        { programId: TOKEN_2022_PROGRAM_ID }
      );

      // Find the XP token account
      const xpAccount = accounts.value.find((acc) => {
        const parsed = acc.account.data as ParsedAccountData;
        return parsed.parsed.info.mint === XP_TOKEN_MINT_DEVNET.toBase58();
      });

      if (!xpAccount) {
        return 0;
      }

      const parsed = xpAccount.account.data as ParsedAccountData;
      return parsed.parsed.info.tokenAmount.uiAmount || 0;
    } catch (error) {
      console.error("Error fetching XP balance:", error);
      return 0;
    }
  }

  /**
   * Check if wallet has XP token account
   */
  async hasXPTokenAccount(walletAddress: PublicKey | string): Promise<boolean> {
    try {
      const wallet = typeof walletAddress === "string" 
        ? new PublicKey(walletAddress) 
        : walletAddress;

      const accounts = await this.connection.getParsedTokenAccountsByOwner(
        wallet,
        { programId: TOKEN_2022_PROGRAM_ID }
      );

      return accounts.value.some((acc) => {
        const parsed = acc.account.data as ParsedAccountData;
        return parsed.parsed.info.mint === XP_TOKEN_MINT_DEVNET.toBase58();
      });
    } catch (error) {
      console.error("Error checking XP token account:", error);
      return false;
    }
  }

  /**
   * Get credentials (cNFTs) for a wallet via Helius DAS API
   * Filters by Caminho credential collection
   */
  async getCredentials(walletAddress: PublicKey | string): Promise<Credential[]> {
    if (!this.heliusApiKey) {
      console.warn("Helius API key not configured, returning empty credentials");
      return [];
    }

    try {
      const wallet = typeof walletAddress === "string" 
        ? walletAddress 
        : walletAddress.toBase58();

      const response = await fetch(`${HELIUS_DAS_API_DEVNET}${this.heliusApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "caminho-credentials",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: wallet,
            page: 1,
            limit: 100,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result?.items) {
        return [];
      }

      // Filter for compressed NFTs from our credential collection
      const credentials: Credential[] = data.result.items
        .filter((asset: HeliusAsset) => {
          // Must be a compressed NFT
          if (!asset.compression?.compressed) return false;
          
          // Must be from our credential collection
          const isInCollection = asset.grouping?.some(
            (g) => g.group_key === "collection" && g.group_value === CREDENTIAL_COLLECTION_DEVNET
          );
          
          return isInCollection;
        })
        .map((asset: HeliusAsset) => {
          const metadata = asset.content.metadata;
          
          // Extract track name and level from attributes
          const trackAttr = metadata.attributes?.find((a) => a.trait_type === "Track");
          const levelAttr = metadata.attributes?.find((a) => a.trait_type === "Level");
          
          return {
            mintAddress: asset.id,
            trackName: trackAttr?.value || metadata.name || "Unknown Track",
            level: parseInt(levelAttr?.value || "1"),
            imageUrl: metadata.image || "",
            metadata: metadata.attributes?.reduce((acc, attr) => {
              acc[attr.trait_type] = attr.value;
              return acc;
            }, {} as Record<string, string>) || {},
            verifyUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
          };
        });

      return credentials;
    } catch (error) {
      console.error("Error fetching credentials:", error);
      return [];
    }
  }

  /**
   * Get single credential details by mint address
   */
  async getCredentialByMint(mintAddress: string): Promise<Credential | null> {
    if (!this.heliusApiKey) {
      return null;
    }

    try {
      const response = await fetch(`${HELIUS_DAS_API_DEVNET}${this.heliusApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "caminho-credential",
          method: "getAsset",
          params: {
            id: mintAddress,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result) {
        return null;
      }

      const asset: HeliusAsset = data.result;
      const metadata = asset.content.metadata;
      
      const trackAttr = metadata.attributes?.find((a) => a.trait_type === "Track");
      const levelAttr = metadata.attributes?.find((a) => a.trait_type === "Level");

      return {
        mintAddress: asset.id,
        trackName: trackAttr?.value || metadata.name || "Unknown Track",
        level: parseInt(levelAttr?.value || "1"),
        imageUrl: metadata.image || "",
        metadata: metadata.attributes?.reduce((acc, attr) => {
          acc[attr.trait_type] = attr.value;
          return acc;
        }, {} as Record<string, string>) || {},
        verifyUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
      };
    } catch (error) {
      console.error("Error fetching credential:", error);
      return null;
    }
  }

  /**
   * Get all XP token holders for leaderboard
   * Returns array of { wallet, xp, rank }
   */
  async getLeaderboardFromTokenAccounts(
    limit: number = 100
  ): Promise<Array<{ wallet: string; xp: number; rank: number }>> {
    try {
      // Get all token accounts for the XP mint
      const accounts = await this.connection.getParsedProgramAccounts(
        TOKEN_2022_PROGRAM_ID,
        {
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: XP_TOKEN_MINT_DEVNET.toBase58(),
              },
            },
          ],
        }
      );

      // Parse accounts and sort by balance
      const holders = accounts
        .map((acc) => {
          const parsed = acc.account.data as ParsedAccountData;
          return {
            wallet: parsed.parsed.info.owner,
            xp: parsed.parsed.info.tokenAmount.uiAmount || 0,
          };
        })
        .filter((h) => h.xp > 0)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit)
        .map((h, index) => ({
          ...h,
          rank: index + 1,
        }));

      return holders;
    } catch (error) {
      console.error("Error fetching leaderboard from token accounts:", error);
      return [];
    }
  }

  /**
   * Verify a credential on-chain
   * Returns true if the credential exists and is owned by the wallet
   */
  async verifyCredential(
    mintAddress: string,
    walletAddress: PublicKey | string
  ): Promise<boolean> {
    try {
      const credential = await this.getCredentialByMint(mintAddress);
      if (!credential) return false;

      const wallet = typeof walletAddress === "string" 
        ? walletAddress 
        : walletAddress.toBase58();

      // Fetch asset again to verify ownership
      if (!this.heliusApiKey) return false;

      const response = await fetch(`${HELIUS_DAS_API_DEVNET}${this.heliusApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "caminho-verify",
          method: "getAsset",
          params: {
            id: mintAddress,
          },
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.result?.ownership?.owner === wallet;
    } catch (error) {
      console.error("Error verifying credential:", error);
      return false;
    }
  }
}

// Singleton instance
let _onChainService: OnChainReadService | null = null;

export function getOnChainReadService(): OnChainReadService {
  if (!_onChainService) {
    _onChainService = new OnChainReadService();
  }
  return _onChainService;
}

// Hook for React components
export function useOnChainReadService(): OnChainReadService {
  return getOnChainReadService();
}
