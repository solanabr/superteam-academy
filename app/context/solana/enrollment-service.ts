/**
 * Enrollment service for Superteam Academy.
 *
 * Abstracts the complexity of Solana's remaining_accounts pattern
 * for prerequisite-based enrollment. The on-chain program requires
 * prerequisite Course + Enrollment PDAs as remaining_accounts when
 * a course has a prerequisite set.
 *
 * This service auto-detects prerequisites and constructs the correct
 * transaction, so the frontend doesn't need to handle remaining_accounts.
 */
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, type Idl } from '@coral-xyz/anchor';
import { deriveCoursePda, deriveEnrollmentPda, deriveConfigPda } from './pda';
import { PROGRAM_ID } from './constants';
import {
    fetchCourseAccount,
    fetchEnrollmentAccount,
} from './anchor-accounts';

import idlJson from '@/context/idl/onchain_academy.json';

// ─── Types ───────────────────────────────────────────────────────────

/** Enrollment state returned from on-chain */
export interface EnrollmentState {
    courseId: string;
    learner: PublicKey;
    enrolledAt: number;
    completedAt: number | null;
    lessonFlags: bigint[];
    credentialAsset: PublicKey | null;
    pda: PublicKey;
}

/** Result of prerequisite check */
export interface PrerequisiteCheckResult {
    hasPrerequisite: boolean;
    prerequisiteCourseId: string | null;
    prerequisiteMet: boolean;
    message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getReadOnlyProgram(connection: Connection): Program {
    const dummyKeypair = PublicKey.default;
    const dummyWallet: Wallet = {
        publicKey: dummyKeypair,
        signTransaction: async <T,>(tx: T): Promise<T> => tx,
        signAllTransactions: async <T,>(txs: T[]): Promise<T[]> => txs,
        payer: undefined as never, // Read-only — never signs
    };
    const provider = new AnchorProvider(
        connection,
        dummyWallet,
        { commitment: 'confirmed' }
    );
    return new Program(idlJson as Idl, provider);
}

// ─── Enrollment Service ──────────────────────────────────────────────

/**
 * Build an enrollment transaction for a course.
 *
 * If the course has a prerequisite, this automatically adds the
 * prerequisite Course PDA and the learner's prerequisite Enrollment
 * PDA as remaining_accounts.
 *
 * @param connection - Solana RPC connection
 * @param courseId - The course to enroll in
 * @param learner - The learner's wallet public key
 * @param prerequisiteCourseId - Optional: explicitly pass the prereq course ID
 *   (if not provided, will be fetched from the on-chain course account)
 */
export async function buildEnrollTransaction(
    connection: Connection,
    courseId: string,
    learner: PublicKey,
    prerequisiteCourseId?: string | null
): Promise<Transaction> {
    const program = getReadOnlyProgram(connection);
    const [coursePda] = deriveCoursePda(courseId);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

    // If prerequisite not explicitly passed, fetch course to check
    let prereqId = prerequisiteCourseId;
    if (prereqId === undefined) {
        const courseAccount = await fetchCourseAccount(program, coursePda);
        prereqId = courseAccount.prerequisite?.toBase58() ?? null;
    }

    // Build the base instruction
    const methodBuilder = program.methods
        .enroll(courseId)
        .accountsPartial({
            course: coursePda,
            enrollment: enrollmentPda,
            learner: learner,
            systemProgram: SystemProgram.programId,
        });

    // Add remaining_accounts for prerequisite if needed
    if (prereqId) {
        const [prereqCoursePda] = deriveCoursePda(prereqId);
        const [prereqEnrollmentPda] = deriveEnrollmentPda(prereqId, learner);

        methodBuilder.remainingAccounts([
            { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
            { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
        ]);
    }

    const ix = await methodBuilder.instruction();
    const tx = new Transaction().add(ix);
    tx.feePayer = learner;

    const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;

    return tx;
}

/**
 * Fetch the enrollment state for a learner in a course.
 * Returns null if the learner is not enrolled.
 */
export async function fetchEnrollment(
    connection: Connection,
    courseId: string,
    learner: PublicKey
): Promise<EnrollmentState | null> {
    const program = getReadOnlyProgram(connection);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

    try {
        const account = await fetchEnrollmentAccount(program, enrollmentPda);
        if (!account) return null;

        return {
            courseId: account.courseId,
            learner: account.learner,
            enrolledAt: typeof account.enrolledAt === 'number'
                ? account.enrolledAt
                : (account.enrolledAt as { toNumber?: () => number }).toNumber?.() ?? Number(account.enrolledAt),
            completedAt: account.completedAt === null
                ? null
                : typeof account.completedAt === 'number'
                    ? account.completedAt
                    : (account.completedAt as { toNumber?: () => number }).toNumber?.() ?? Number(account.completedAt) ?? null,
            lessonFlags: (account.lessonFlags ?? []).map((f) =>
                typeof f === 'bigint' ? f : ((f as { toBigInt?: () => bigint }).toBigInt?.() ?? BigInt(String(f)))
            ),
            credentialAsset: account.credentialAsset ?? null,
            pda: enrollmentPda,
        };
    } catch {
        return null;
    }
}

/**
 * Check if a learner meets the prerequisite for a course.
 *
 * Returns a result object indicating:
 * - Whether the course has a prerequisite
 * - Whether the prerequisite is met (completed enrollment exists)
 */
export async function checkPrerequisiteMet(
    connection: Connection,
    courseId: string,
    learner: PublicKey
): Promise<PrerequisiteCheckResult> {
    const program = getReadOnlyProgram(connection);
    const [coursePda] = deriveCoursePda(courseId);

    // Fetch the course to check for prerequisite
    const courseAccount = await fetchCourseAccount(program, coursePda);
    const prereqId: string | null = courseAccount.prerequisite?.toBase58() ?? null;

    if (!prereqId) {
        return {
            hasPrerequisite: false,
            prerequisiteCourseId: null,
            prerequisiteMet: true,
            message: 'No prerequisite required.',
        };
    }

    // Check if learner has a completed enrollment for the prerequisite
    const enrollment = await fetchEnrollment(connection, prereqId, learner);

    if (!enrollment) {
        return {
            hasPrerequisite: true,
            prerequisiteCourseId: prereqId,
            prerequisiteMet: false,
            message: `Prerequisite course "${prereqId}" not enrolled.`,
        };
    }

    if (enrollment.completedAt === null) {
        return {
            hasPrerequisite: true,
            prerequisiteCourseId: prereqId,
            prerequisiteMet: false,
            message: `Prerequisite course "${prereqId}" not yet completed.`,
        };
    }

    return {
        hasPrerequisite: true,
        prerequisiteCourseId: prereqId,
        prerequisiteMet: true,
        message: `Prerequisite course "${prereqId}" completed.`,
    };
}

/**
 * Build a close_enrollment transaction.
 * Completed courses close immediately. Incomplete courses require 24h cooldown.
 */
export async function buildCloseEnrollmentTransaction(
    connection: Connection,
    courseId: string,
    learner: PublicKey
): Promise<Transaction> {
    const program = getReadOnlyProgram(connection);
    const [coursePda] = deriveCoursePda(courseId);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

    const ix = await program.methods
        .closeEnrollment()
        .accountsPartial({
            course: coursePda,
            enrollment: enrollmentPda,
            learner: learner,
        })
        .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = learner;

    const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;

    return tx;
}
