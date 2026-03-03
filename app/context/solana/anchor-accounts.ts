/**
 * Typed Anchor account accessor helpers.
 *
 * Anchor's TypeScript SDK requires `as any` casts when using dynamically
 * loaded IDLs (program.account.course.all(), etc.). This module
 * centralizes those casts behind typed wrapper functions so the rest
 * of the codebase stays type-safe.
 */
import { PublicKey } from '@solana/web3.js';
import type { Program } from '@coral-xyz/anchor';

// ─── Raw on-chain account shapes (from Anchor deserialization) ───────

/** Raw Course account as returned by Anchor's account deserializer */
export interface RawCourseAccount {
    courseId: string;
    creator: PublicKey;
    contentTxId: number[];
    version: number;
    lessonCount: number;
    difficulty: number;
    xpPerLesson: number;
    trackId: number;
    trackLevel: number;
    prerequisite: PublicKey | null;
    creatorRewardXp: number;
    minCompletionsForReward: number;
    totalCompletions: number;
    totalEnrollments: number;
    isActive: boolean;
    createdAt: { toNumber: () => number };
    updatedAt: { toNumber: () => number };
    bump: number;
}

/** Raw Enrollment account as returned by Anchor's account deserializer */
export interface RawEnrollmentAccount {
    courseId: string;
    learner: PublicKey;
    enrolledAt: { toNumber?: () => number } | number;
    completedAt: { toNumber?: () => number } | number | null;
    lessonFlags: Array<bigint | { toBigInt?: () => bigint }>;
    credentialAsset: PublicKey | null;
}

// ─── Account accessor (centralizes the unavoidable `as any` cast) ────

/**
 * Get the dynamic account namespace from an Anchor Program.
 *
 * Anchor's TypeScript SDK doesn't provide typed accessors for dynamically
 * loaded IDLs, so we must cast through `any`. This function centralizes
 * that single cast, keeping the rest of the codebase free of `as any`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function accountNamespace(program: Program): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return program.account as any;
}

// ─── Course accessors ────────────────────────────────────────────────

/** Fetch all Course accounts */
export async function fetchAllCourseAccounts(
    program: Program
): Promise<Array<{ account: RawCourseAccount; publicKey: PublicKey }>> {
    return accountNamespace(program).course.all();
}

/** Fetch a single Course account by PDA */
export async function fetchCourseAccount(
    program: Program,
    pda: PublicKey
): Promise<RawCourseAccount> {
    return accountNamespace(program).course.fetch(pda);
}

// ─── Enrollment accessors ────────────────────────────────────────────

/** Fetch an Enrollment account, returns null if not found */
export async function fetchEnrollmentAccount(
    program: Program,
    pda: PublicKey
): Promise<RawEnrollmentAccount | null> {
    return accountNamespace(program).enrollment.fetchNullable(pda);
}

// ─── Achievement account shapes ─────────────────────────────────────

/** Raw AchievementType PDA account (338 bytes on-chain) */
export interface RawAchievementTypeAccount {
    achievementId: string;
    name: string;
    metadataUri: string;
    collection: PublicKey;
    maxSupply: number;
    currentSupply: number;
    xpReward: number;
    isActive: boolean;
    bump: number;
}

/** Raw AchievementReceipt PDA account (49 bytes on-chain) */
export interface RawAchievementReceiptAccount {
    asset: PublicKey;
    awardedAt: { toNumber: () => number };
    bump: number;
}

// ─── Achievement accessors ──────────────────────────────────────────

/** Fetch an AchievementType account by PDA */
export async function fetchAchievementTypeAccount(
    program: Program,
    pda: PublicKey
): Promise<RawAchievementTypeAccount | null> {
    return accountNamespace(program).achievementType.fetchNullable(pda);
}

/** Fetch an AchievementReceipt account by PDA */
export async function fetchAchievementReceiptAccount(
    program: Program,
    pda: PublicKey
): Promise<RawAchievementReceiptAccount | null> {
    return accountNamespace(program).achievementReceipt.fetchNullable(pda);
}

/** Fetch all AchievementType accounts */
export async function fetchAllAchievementTypes(
    program: Program
): Promise<Array<{ account: RawAchievementTypeAccount; publicKey: PublicKey }>> {
    return accountNamespace(program).achievementType.all();
}
