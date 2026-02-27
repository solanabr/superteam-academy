import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';

/**
 * Solana XP Service
 * Handles Token-2022 XP balance fetching from Solana Devnet
 */

// Environment configuration
const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  clusterApiUrl((process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'testnet' | 'mainnet-beta') || 'devnet');
const XP_TOKEN_MINT = process.env.XP_TOKEN_MINT_ADDRESS || process.env.NEXT_PUBLIC_XP_MINT;

export interface OnChainXPBalance {
  balance: number;
  rawBalance: bigint;
  decimals: number;
  mintAddress: string;
  tokenAccount: string;
  lastFetched: Date;
}

export interface XPSyncResult {
  onChainBalance: number;
  offChainBalance: number;
  inSync: boolean;
  difference: number;
}

export class SolanaXPService {
  private connection: Connection;
  private xpTokenMint: PublicKey | null;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    this.xpTokenMint = XP_TOKEN_MINT ? new PublicKey(XP_TOKEN_MINT) : null;
  }

  /**
   * Get XP Token-2022 balance for a wallet address
   */
  async getXPBalance(walletAddress: string): Promise<OnChainXPBalance | null> {
    if (!this.xpTokenMint) {
      console.warn('XP Token mint address not configured');
      return null;
    }

    try {
      const walletPubkey = new PublicKey(walletAddress);

      // Get the associated token account for Token-2022
      const tokenAccountAddress = getAssociatedTokenAddressSync(
        this.xpTokenMint,
        walletPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      // Get token account info
      const tokenAccount = await getAccount(
        this.connection,
        tokenAccountAddress,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );

      // Get mint info to know decimals
      const mintInfo = await getMint(
        this.connection,
        this.xpTokenMint,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );

      const rawBalance = tokenAccount.amount;
      const decimals = mintInfo.decimals;
      const balance = Number(rawBalance) / Math.pow(10, decimals);

      return {
        balance,
        rawBalance,
        decimals,
        mintAddress: this.xpTokenMint.toBase58(),
        tokenAccount: tokenAccountAddress.toBase58(),
        lastFetched: new Date(),
      };
    } catch (error) {
      // Token account doesn't exist (user has no XP tokens yet)
      if ((error as Error).message?.includes('could not find account')) {
        return {
          balance: 0,
          rawBalance: BigInt(0),
          decimals: 6,
          mintAddress: this.xpTokenMint.toBase58(),
          tokenAccount: '',
          lastFetched: new Date(),
        };
      }

      console.error('Error fetching XP balance:', error);
      throw error;
    }
  }

  /**
   * Get XP balances for multiple wallets (batch operation)
   */
  async getBatchXPBalances(
    walletAddresses: string[]
  ): Promise<Map<string, OnChainXPBalance | null>> {
    const results = new Map<string, OnChainXPBalance | null>();

    // Process in parallel with rate limiting
    const batchSize = 10;
    for (let i = 0; i < walletAddresses.length; i += batchSize) {
      const batch = walletAddresses.slice(i, i + batchSize);
      const balances = await Promise.all(
        batch.map(async (address) => {
          try {
            return await this.getXPBalance(address);
          } catch {
            return null;
          }
        })
      );

      batch.forEach((address, index) => {
        results.set(address, balances[index]);
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < walletAddresses.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Check if XP Token mint is configured
   */
  isConfigured(): boolean {
    return this.xpTokenMint !== null;
  }

  /**
   * Get the configured XP Token mint address
   */
  getMintAddress(): string | null {
    return this.xpTokenMint?.toBase58() || null;
  }

  /**
   * Verify a wallet's token account exists
   */
  async tokenAccountExists(walletAddress: string): Promise<boolean> {
    if (!this.xpTokenMint) return false;

    try {
      const walletPubkey = new PublicKey(walletAddress);
      const tokenAccountAddress = getAssociatedTokenAddressSync(
        this.xpTokenMint,
        walletPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const accountInfo = await this.connection.getAccountInfo(tokenAccountAddress);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get Solana connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    slot: number | null;
    blockTime: number | null;
  }> {
    try {
      const slot = await this.connection.getSlot();
      const blockTime = await this.connection.getBlockTime(slot);
      return {
        connected: true,
        slot,
        blockTime,
      };
    } catch {
      return {
        connected: false,
        slot: null,
        blockTime: null,
      };
    }
  }
}

// Singleton instance
let solanaXPServiceInstance: SolanaXPService | null = null;

export function getSolanaXPService(): SolanaXPService {
  if (!solanaXPServiceInstance) {
    solanaXPServiceInstance = new SolanaXPService();
  }
  return solanaXPServiceInstance;
}
