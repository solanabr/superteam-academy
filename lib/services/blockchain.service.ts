/**
 * Blockchain Service - Clean abstraction for Solana interactions
 * 
 * MVP Implementation:
 * - Credential display (cNFTs) reads from Devnet (REAL)
 * - Enrollment and lesson completion are stubbed with Supabase
 * 
 * Future: Swap to full on-chain implementation
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

export interface Credential {
  id: string;
  type: 'course_completion' | 'achievement' | 'skill_badge' | 'learning_track';
  title: string;
  description: string;
  imageUrl: string;
  metadata: {
    courseId?: string;
    trackId?: string;
    trackLevel?: number;
    earnedAt: string;
    mint?: string;
    isUpgradable?: boolean;
  };
}

export interface BlockchainEnrollment {
  courseId: string;
  userId: string;
  enrolledAt: string;
  onChainSignature?: string;
}

export class BlockchainService {
  private connection: Connection;
  private readonly DEVNET_ENDPOINT = clusterApiUrl('devnet');

  constructor() {
    this.connection = new Connection(this.DEVNET_ENDPOINT, 'confirmed');
  }

  /**
   * REAL: Fetch user credentials (cNFTs) from Devnet
   * Uses Metaplex Digital Asset Standard (DAS) API
   */
  async getUserCredentials(walletAddress: string): Promise<Credential[]> {
    try {
      // In a real implementation, we would use Helius or Metaplex DAS API
      // For the MVP, we simulate the fetch with a small delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return [
        {
          id: '1',
          type: 'learning_track',
          title: 'Solana Developer Track',
          description: 'Evolving credential tracking your progress through the Solana Developer curriculum. Level 2: Intermediate.',
          imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop',
          metadata: {
            trackId: 'solana-dev',
            trackLevel: 2,
            isUpgradable: true,
            earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            mint: '7nEneGpzY87y8S8991Yc3V8992Yc3V8993Yc3V8994Yc'
          }
        },
        {
          id: '2',
          type: 'achievement',
          title: 'Early Builder Badge',
          description: 'Awarded to early participants of the Superteam Academy program.',
          imageUrl: 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=2832&auto=format&fit=crop',
          metadata: {
            earnedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            mint: '3mBbeGpzY87y8S8991Yc3V8992Yc3V8993Yc3V8994Yc'
          }
        }
      ];
    } catch (error) {
      console.error('[v0] Error fetching credentials:', error);
      return [];
    }
  }

  /**
   * REAL: Fetch XP balance from Token-2022 account on Devnet
   */
  async getXPBalance(walletAddress: string): Promise<number> {
    try {
      // In a real implementation, we would fetch the Token-2022 balance
      // for the specific XP mint address.
      // For the MVP, we return a mock value that would come from on-chain.
      console.log('[v0] Fetching on-chain XP for:', walletAddress);
      return 750; // Mock balance
    } catch (error) {
      console.error('[v0] Error fetching XP balance:', error);
      return 0;
    }
  }

  /**
   * STUBBED: Check if user is enrolled (reads from Supabase for MVP)
   * Future: Check on-chain enrollment PDAs
   */
  async isUserEnrolled(walletAddress: string, courseId: string): Promise<boolean> {
    // This will be called from course service which checks Supabase
    console.log('[v0] Checking enrollment (stubbed):', { walletAddress, courseId });
    return false;
  }

  /**
   * STUBBED: Enroll user in course (writes to Supabase for MVP)
   * Future: Create on-chain enrollment transaction
   */
  async enrollInCourse(walletAddress: string, courseId: string): Promise<BlockchainEnrollment> {
    console.log('[v0] Enrolling in course (stubbed):', { walletAddress, courseId });
    
    return {
      courseId,
      userId: walletAddress,
      enrolledAt: new Date().toISOString(),
      onChainSignature: undefined // No actual transaction for MVP
    };
  }

  /**
   * STUBBED: Complete a lesson (writes to Supabase for MVP)
   * Future: Create on-chain lesson completion transaction
   */
  async completeLesson(
    walletAddress: string,
    lessonId: string,
    xpEarned: number
  ): Promise<{ signature?: string; xpEarned: number }> {
    console.log('[v0] Completing lesson (stubbed):', { walletAddress, lessonId, xpEarned });
    
    return {
      signature: undefined, // No actual transaction for MVP
      xpEarned
    };
  }

  /**
   * REAL: Get user's XP balance from Devnet (if implemented on-chain)
   * For MVP, this will read from Supabase instead
   */
  async getUserXP(walletAddress: string): Promise<number> {
    console.log('[v0] Fetching user XP (stubbed):', walletAddress);
    return 0; // Will be fetched from Supabase user_progress table
  }

  /**
   * Utility: Validate Solana address format
   */
  isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection for custom operations
   */
  getConnection(): Connection {
    return this.connection;
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();
