'use client';

/**
 * Hook for interacting with the Superteam Academy on-chain program
 * Provides enrollment, XP, credentials, and leaderboard data
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useWallet } from '@/hooks/use-wallet';
import {
  getConnection,
  fetchXpBalance,
  calculateLevel,
  xpForNextLevel,
  fetchAllCourses,
} from '@/lib/solana/program-client';
import {
  getEnrollmentStatus,
  getLearnerCoursesWithProgress,
  buildEnrollTransaction,
  buildCloseEnrollmentTransaction,
} from '@/lib/solana/enrollment-service';
import { fetchWalletCredentials, fetchWalletRankAndStats } from '@/lib/solana/helius-client';
import type {
  CourseWithMetadata,
  EnrollmentWithProgress,
  EnrollmentStatus,
  ParsedCredential,
} from '@/lib/solana';

// Phantom wallet interface for transaction signing
interface PhantomWallet {
  isPhantom?: boolean;
  connect?: () => Promise<{ publicKey: { toString: () => string } }>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
}

// Helper to get Phantom wallet
const getPhantomWallet = (): PhantomWallet | null => {
  if (typeof window === 'undefined') return null;
  const phantom = (window as Window & { solana?: PhantomWallet }).solana;
  return phantom?.isPhantom ? phantom : null;
};

// ==================== Types ====================

export interface OnChainState {
  // XP & Level
  xpBalance: number;
  level: number;
  xpToNextLevel: number;
  xpProgress: number;

  // Enrollments
  enrollments: Array<{
    course: CourseWithMetadata;
    enrollment: EnrollmentWithProgress;
  }>;

  // Credentials
  credentials: ParsedCredential[];

  // Leaderboard rank
  rank: number | null;
  totalParticipants: number;

  // Loading states
  isLoading: boolean;
  isEnrolling: boolean;

  // Errors
  error: string | null;
}

export interface UseOnChainProgramReturn extends OnChainState {
  // Actions
  refreshAll: () => Promise<void>;
  enroll: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  unenroll: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  getEnrollmentStatus: (courseId: string) => Promise<EnrollmentStatus | null>;

  // Utilities
  isEnrolled: (courseId: string) => boolean;
  getCourseProgress: (courseId: string) => EnrollmentWithProgress | null;
}

// ==================== Hook ====================

export function useOnChainProgram(): UseOnChainProgramReturn {
  const { publicKey: walletAddress, connected } = useWallet();

  // Derive PublicKey from wallet address
  const publicKey = useMemo(() => {
    if (!walletAddress) return null;
    try {
      return new PublicKey(walletAddress);
    } catch {
      return null;
    }
  }, [walletAddress]);

  // Sign transaction using Phantom
  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction> => {
    const phantom = getPhantomWallet();
    if (!phantom?.signTransaction) {
      throw new Error('Phantom wallet not available for signing');
    }
    return await phantom.signTransaction(transaction);
  }, []);

  const [state, setState] = useState<OnChainState>({
    xpBalance: 0,
    level: 0,
    xpToNextLevel: 100,
    xpProgress: 0,
    enrollments: [],
    credentials: [],
    rank: null,
    totalParticipants: 0,
    isLoading: false,
    isEnrolling: false,
    error: null,
  });

  // ==================== Fetch Functions ====================

  const fetchXpData = useCallback(async (wallet: PublicKey) => {
    try {
      const xpBalance = await fetchXpBalance(wallet);
      const level = calculateLevel(xpBalance);
      const nextLevelXp = xpForNextLevel(level);
      const currentLevelXp = level > 0 ? xpForNextLevel(level - 1) : 0;
      const xpProgress =
        nextLevelXp > currentLevelXp
          ? ((xpBalance - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
          : 0;

      return {
        xpBalance,
        level,
        xpToNextLevel: nextLevelXp - xpBalance,
        xpProgress: Math.min(xpProgress, 100),
      };
    } catch (error) {
      console.error('Error fetching XP:', error);
      return { xpBalance: 0, level: 0, xpToNextLevel: 100, xpProgress: 0 };
    }
  }, []);

  const fetchEnrollments = useCallback(async (wallet: PublicKey) => {
    try {
      return await getLearnerCoursesWithProgress(wallet);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
  }, []);

  const fetchCredentials = useCallback(async (wallet: PublicKey) => {
    try {
      return await fetchWalletCredentials(wallet.toBase58());
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return [];
    }
  }, []);

  const fetchRank = useCallback(async (wallet: PublicKey) => {
    try {
      const stats = await fetchWalletRankAndStats(wallet);
      return stats;
    } catch (error) {
      console.error('Error fetching rank:', error);
      return null;
    }
  }, []);

  // ==================== Refresh All Data ====================

  const refreshAll = useCallback(async () => {
    if (!publicKey) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [xpData, enrollments, credentials, rankData] = await Promise.all([
        fetchXpData(publicKey),
        fetchEnrollments(publicKey),
        fetchCredentials(publicKey),
        fetchRank(publicKey),
      ]);

      setState((prev) => ({
        ...prev,
        ...xpData,
        enrollments,
        credentials,
        rank: rankData?.rank ?? null,
        totalParticipants: rankData?.totalParticipants ?? 0,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      }));
    }
  }, [publicKey, fetchXpData, fetchEnrollments, fetchCredentials, fetchRank]);

  // ==================== Enrollment Actions ====================

  const enroll = useCallback(
    async (courseId: string): Promise<{ success: boolean; error?: string }> => {
      if (!publicKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      setState((prev) => ({ ...prev, isEnrolling: true, error: null }));

      try {
        // Build enrollment transaction
        const { transaction, enrollmentPda } = await buildEnrollTransaction(courseId, publicKey);

        // Sign with wallet
        const signedTx = await signTransaction(transaction);

        // Send transaction
        const connection = getConnection();
        const signature = await connection.sendRawTransaction(signedTx.serialize());

        // Confirm
        await connection.confirmTransaction(signature, 'confirmed');

        // Refresh enrollments
        const enrollments = await fetchEnrollments(publicKey);
        setState((prev) => ({ ...prev, enrollments, isEnrolling: false }));

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Enrollment failed';
        setState((prev) => ({ ...prev, isEnrolling: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },
    [publicKey, signTransaction, fetchEnrollments]
  );

  const unenroll = useCallback(
    async (courseId: string): Promise<{ success: boolean; error?: string }> => {
      if (!publicKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      setState((prev) => ({ ...prev, isEnrolling: true, error: null }));

      try {
        // Build close enrollment transaction
        const transaction = await buildCloseEnrollmentTransaction(courseId, publicKey);

        // Sign with wallet
        const signedTx = await signTransaction(transaction);

        // Send transaction
        const connection = getConnection();
        const signature = await connection.sendRawTransaction(signedTx.serialize());

        // Confirm
        await connection.confirmTransaction(signature, 'confirmed');

        // Refresh enrollments
        const enrollments = await fetchEnrollments(publicKey);
        setState((prev) => ({ ...prev, enrollments, isEnrolling: false }));

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unenrollment failed';
        setState((prev) => ({ ...prev, isEnrolling: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },
    [publicKey, signTransaction, fetchEnrollments]
  );

  const getEnrollmentStatusFn = useCallback(
    async (courseId: string): Promise<EnrollmentStatus | null> => {
      if (!publicKey) return null;

      try {
        return await getEnrollmentStatus(courseId, publicKey);
      } catch {
        return null;
      }
    },
    [publicKey]
  );

  // ==================== Utility Functions ====================

  const isEnrolled = useCallback(
    (courseId: string): boolean => {
      return state.enrollments.some((e) => e.course.courseId === courseId);
    },
    [state.enrollments]
  );

  const getCourseProgress = useCallback(
    (courseId: string): EnrollmentWithProgress | null => {
      const found = state.enrollments.find((e) => e.course.courseId === courseId);
      return found?.enrollment ?? null;
    },
    [state.enrollments]
  );

  // ==================== Auto-refresh on wallet connect ====================

  useEffect(() => {
    if (connected && publicKey) {
      refreshAll();
    } else {
      // Reset state when disconnected
      setState({
        xpBalance: 0,
        level: 0,
        xpToNextLevel: 100,
        xpProgress: 0,
        enrollments: [],
        credentials: [],
        rank: null,
        totalParticipants: 0,
        isLoading: false,
        isEnrolling: false,
        error: null,
      });
    }
  }, [connected, publicKey, refreshAll]);

  return {
    ...state,
    refreshAll,
    enroll,
    unenroll,
    getEnrollmentStatus: getEnrollmentStatusFn,
    isEnrolled,
    getCourseProgress,
  };
}
