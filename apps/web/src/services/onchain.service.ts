/**
 * src/services/onchain.service.ts
 *
 * Solana-backed implementation of the learning service using Web3 and Helius (SolanaKit Pattern).
 */
import { Connection, PublicKey } from '@solana/web3.js';
// @ts-ignore - Assuming helius-sdk is installed in the project
import { Helius } from 'helius-sdk';
import { ILearningService } from './interface';
import { SupabaseService } from './supabase.service';
import {
  Progress,
  Credential,
  StreakData,
  LeaderboardEntry,
  Achievement,
  HeliusAsset
} from './types';

export class OnChainService implements ILearningService {
  private connection: Connection;
  private helius: Helius;
  private xpMintAddress: PublicKey;
  private dbFallback: SupabaseService;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      throw new Error('Missing environment variable: NEXT_PUBLIC_SOLANA_RPC_URL');
    }
    if (!process.env.HELIUS_API_KEY) {
      throw new Error('Missing environment variable: HELIUS_API_KEY');
    }
    if (!process.env.NEXT_PUBLIC_XP_MINT_ADDRESS) {
      throw new Error('Missing environment variable: NEXT_PUBLIC_XP_MINT_ADDRESS');
    }

    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
      { commitment: 'confirmed' }
    );

    this.helius = new Helius(
      process.env.HELIUS_API_KEY,
      'devnet'
    );

    try {
      this.xpMintAddress = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT_ADDRESS);
    } catch (error) {
      throw new Error(`Invalid XP Mint Address format: ${process.env.NEXT_PUBLIC_XP_MINT_ADDRESS}`);
    }

    this.dbFallback = new SupabaseService();
  }

  async getXP(wallet: PublicKey): Promise<number> {
    try {
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        wallet,
        { mint: this.xpMintAddress }
      );

      if (tokenAccounts.value.length === 0) return 0;

      const account = await this.connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );

      const amount = parseInt(account.value.amount, 10);
      return isNaN(amount) ? 0 : amount;
    } catch (error) {
      throw new Error(`Failed to fetch on-chain XP: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getLevel(xp: number): number {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100));
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    try {
      const response = await this.helius.rpc.getAssetsByOwner({
        ownerAddress: wallet.toBase58(),
        page: 1,
        limit: 10,
      });

      const assets = response.items as unknown as HeliusAsset[];

      return assets.map((asset) => ({
        mintAddress: asset.id,
        track: asset.metadata?.track || 'unknown',
        level: asset.metadata?.level || 1,
        metadata: {
          name: asset.metadata?.name || '',
          image: asset.metadata?.image,
          description: asset.metadata?.description,
        }
      }));
    } catch (error) {
      throw new Error(`Failed to fetch credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==== Delegate implementation to DB ====

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    return this.dbFallback.getProgress(userId, courseId);
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    return this.dbFallback.completeLesson(userId, courseId, lessonIndex);
  }

  async getStreak(userId: string): Promise<StreakData> {
    return this.dbFallback.getStreak(userId);
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]> {
    return this.dbFallback.getLeaderboard(timeframe);
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return this.dbFallback.getAchievements(userId);
  }
}
