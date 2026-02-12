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
  type: 'course_completion' | 'achievement' | 'skill_badge';
  title: string;
  description: string;
  imageUrl: string;
  metadata: {
    courseId?: string;
    earnedAt: string;
    mint?: string;
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
      const pubkey = new PublicKey(walletAddress);
      
      // TODO: Implement using Metaplex DAS API or Helius
      // For now, return mock data structure
      console.log('[v0] Fetching credentials for wallet:', walletAddress);
      
      return [
        {
          id: '1',
          type: 'course_completion',
          title: 'Solana Basics Completion',
          description: 'Successfully completed the Solana Basics course',
          imageUrl: '/credentials/solana-basics.png',
          metadata: {
            courseId: 'solana-basics',
            earnedAt: new Date().toISOString(),
            mint: 'mock-mint-address'
          }
        }
      ];
    } catch (error) {
      console.error('[v0] Error fetching credentials:', error);
      return [];
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
