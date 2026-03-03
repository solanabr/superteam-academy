/**
 * useUserStats — Fetches user-specific enrollment stats from on-chain PDAs.
 *
 * Derives enrollment PDAs for each active course using the connected wallet,
 * then batch-fetches them in parallel. Returns enrolled and completed counts.
 *
 * Dependencies:
 *   - useActiveCourses() → list of course IDs
 *   - useWallet() → user's publicKey
 *   - useConnection() → Solana RPC connection
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useActiveCourses } from './useCourses';
import { deriveEnrollmentPda } from '@/context/solana/pda';
import { fetchEnrollmentAccount, type RawEnrollmentAccount } from '@/context/solana/anchor-accounts';
import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor';
import type { Wallet } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';
import idlJson from '@/context/idl/onchain_academy.json';

export interface UserStats {
    enrolled: number;
    completed: number;
}

/** Create a read-only Anchor program (same pattern as enrollment-service) */
function getReadOnlyProgram(connection: Connection): Program {
    const dummyWallet: Wallet = {
        publicKey: PublicKey.default,
        signTransaction: async <T,>(tx: T): Promise<T> => tx,
        signAllTransactions: async <T,>(txs: T[]): Promise<T[]> => txs,
        payer: undefined as never,
    };
    const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
    return new Program(idlJson as Idl, provider);
}

/**
 * Hook returning user-specific enrollment stats.
 *
 * - `enrolled`: number of courses the user has an enrollment PDA for
 * - `completed`: number of those with `completedAt !== null`
 *
 * Returns `{ enrolled: 0, completed: 0 }` when wallet is not connected.
 */
export function useUserStats(): { data: UserStats | undefined; isLoading: boolean } {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { data: courses, isLoading: coursesLoading } = useActiveCourses();

    const walletKey = publicKey?.toBase58() ?? null;
    const courseIds = courses?.map(c => c.courseId) ?? [];

    const query = useQuery<UserStats>({
        queryKey: ['user-stats', walletKey, courseIds.join(',')],
        queryFn: async (): Promise<UserStats> => {
            if (!publicKey || courseIds.length === 0) {
                return { enrolled: 0, completed: 0 };
            }

            const program = getReadOnlyProgram(connection);

            // Derive all enrollment PDAs and fetch in parallel
            const results = await Promise.allSettled(
                courseIds.map(courseId => {
                    const [pda] = deriveEnrollmentPda(courseId, publicKey);
                    return fetchEnrollmentAccount(program, pda);
                })
            );

            let enrolled = 0;
            let completed = 0;

            for (const result of results) {
                if (result.status === 'fulfilled' && result.value !== null) {
                    enrolled++;
                    const account = result.value as RawEnrollmentAccount;
                    if (account.completedAt !== null) {
                        completed++;
                    }
                }
            }

            return { enrolled, completed };
        },
        enabled: !!publicKey && courseIds.length > 0,
        staleTime: 30_000, // 30 seconds
        refetchOnWindowFocus: false,
    });

    return {
        data: query.data ?? (publicKey ? undefined : { enrolled: 0, completed: 0 }),
        isLoading: coursesLoading || query.isLoading,
    };
}
