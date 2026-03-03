/**
 * Course service for fetching on-chain course data.
 *
 * Uses the Anchor IDL from `lib/idl/onchain_academy.json` for typed
 * account deserialization via `program.account.course`.
 *
 * All functions accept a Connection and return strongly-typed Course data.
 */
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor';
import { RpcError } from '@/backend/errors';
import { deriveCoursePda } from './pda';
import type { Course, Difficulty } from '@/context/types/course';
import {
    fetchAllCourseAccounts,
    fetchCourseAccount,
    type RawCourseAccount,
} from './anchor-accounts';

// Import the IDL JSON — cast to Idl at usage to satisfy Anchor's type constraints
import idlJson from '@/context/idl/onchain_academy.json';

/**
 * Create a read-only Anchor Program instance.
 * Uses a dummy wallet since we only need to read accounts.
 */
export function getReadOnlyProgram(connection: Connection): Program {
    // Dummy wallet for read-only operations
    const dummyKeypair = Keypair.generate();
    const dummyWallet = {
        publicKey: dummyKeypair.publicKey,
        signTransaction: async <T,>(tx: T): Promise<T> => tx,
        signAllTransactions: async <T,>(txs: T[]): Promise<T[]> => txs,
        payer: dummyKeypair,
    };

    const provider = new AnchorProvider(connection, dummyWallet, {
        commitment: 'confirmed',
    });

    return new Program(idlJson as Idl, provider);
}

/**
 * Parse raw Anchor account data into our frontend Course type.
 */
function parseCourseAccount(
    accountData: RawCourseAccount,
    pda: PublicKey
): Course {
    return {
        courseId: accountData.courseId,
        coursePda: pda.toBase58(),
        creator: accountData.creator.toBase58(),
        contentTxId: Array.from(accountData.contentTxId),
        version: accountData.version,
        lessonCount: accountData.lessonCount,
        difficulty: accountData.difficulty as Difficulty,
        xpPerLesson: accountData.xpPerLesson,
        trackId: accountData.trackId,
        trackLevel: accountData.trackLevel,
        prerequisite: accountData.prerequisite?.toBase58() ?? null,
        creatorRewardXp: accountData.creatorRewardXp,
        minCompletionsForReward: accountData.minCompletionsForReward,
        totalCompletions: accountData.totalCompletions,
        totalEnrollments: accountData.totalEnrollments,
        isActive: accountData.isActive,
        createdAt: accountData.createdAt.toNumber(),
        updatedAt: accountData.updatedAt.toNumber(),
        bump: accountData.bump,
    };
}

/**
 * Fetch all courses from the on-chain program.
 */
export async function fetchAllCourses(connection: Connection): Promise<Course[]> {
    const program = getReadOnlyProgram(connection);
    try {
        const accounts = await fetchAllCourseAccounts(program);

        return accounts.map((a) =>
            parseCourseAccount(a.account, a.publicKey)
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new RpcError(`Failed to fetch courses from RPC: ${message}`, { cause: error });
    }
}

/**
 * Fetch courses with pagination.
 * Uses client-side pagination on top of the full account list.
 */
export async function fetchCoursesPaginated(
    connection: Connection,
    options: { page?: number; limit?: number } = {}
): Promise<{ courses: Course[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50 } = options;
    const all = await fetchAllCourses(connection);
    const start = (page - 1) * limit;
    const courses = all.slice(start, start + limit);
    return { courses, total: all.length, page, limit };
}

/**
 * Fetch only active courses.
 */
export async function fetchActiveCourses(connection: Connection): Promise<Course[]> {
    const all = await fetchAllCourses(connection);
    return all.filter((c) => c.isActive);
}

/**
 * Fetch a single course by its courseId.
 */
export async function fetchCourseById(
    connection: Connection,
    courseId: string
): Promise<Course | null> {
    const program = getReadOnlyProgram(connection);
    const [coursePda] = deriveCoursePda(courseId);

    try {
        const account = await fetchCourseAccount(program, coursePda);
        return parseCourseAccount(account, coursePda);
    } catch {
        // Account not found
        return null;
    }
}

/**
 * Fetch courses by track ID.
 */
export async function fetchCoursesByTrack(
    connection: Connection,
    trackId: number
): Promise<Course[]> {
    const all = await fetchAllCourses(connection);
    return all.filter((c) => c.trackId === trackId);
}

/**
 * Fetch courses by creator public key.
 */
export async function fetchCoursesByCreator(
    connection: Connection,
    creator: string
): Promise<Course[]> {
    const all = await fetchAllCourses(connection);
    return all.filter((c) => c.creator === creator);
}

/**
 * Get basic course stats.
 */
export async function fetchCourseStats(connection: Connection): Promise<{
    totalCourses: number;
    activeCourses: number;
    totalEnrollments: number;
    totalCompletions: number;
}> {
    const all = await fetchAllCourses(connection);

    return {
        totalCourses: all.length,
        activeCourses: all.filter((c) => c.isActive).length,
        totalEnrollments: all.reduce((sum, c) => sum + c.totalEnrollments, 0),
        totalCompletions: all.reduce((sum, c) => sum + c.totalCompletions, 0),
    };
}
