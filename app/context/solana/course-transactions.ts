/**
 * Course transaction builders for the Superteam Academy on-chain program.
 *
 * Builds Anchor instructions for `create_course` and `update_course`.
 * Both require the config authority wallet to sign.
 *
 * Usage:
 *   const ix = await buildCreateCourseIx(program, params, authority);
 *   const tx = new Transaction().add(ix);
 *   await sendTransaction(tx, connection);
 */

import { PublicKey, SystemProgram } from '@solana/web3.js';
import type { Program } from '@coral-xyz/anchor';
import { deriveCoursePda, deriveConfigPda } from './pda';

// ─── Parameter Types ─────────────────────────────────────────────────

export interface CreateCourseInput {
    courseId: string;
    creator: PublicKey;
    contentTxId: number[];   // [u8; 32]
    lessonCount: number;     // u8
    difficulty: number;      // u8 (0=Beginner, 1=Intermediate, 2=Advanced)
    xpPerLesson: number;     // u32
    trackId: number;         // u16
    trackLevel: number;      // u8
    prerequisite: PublicKey | null;
    creatorRewardXp: number; // u32
    minCompletionsForReward: number; // u16
}

export interface UpdateCourseInput {
    courseId: string;  // used to derive the course PDA
    newContentTxId?: number[] | null;        // Option<[u8;32]>
    newIsActive?: boolean | null;            // Option<bool>
    newXpPerLesson?: number | null;          // Option<u32>
    newCreatorRewardXp?: number | null;      // Option<u32>
    newMinCompletionsForReward?: number | null; // Option<u16>
}

// ─── Instruction Namespace Helper ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function methods(program: Program): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return program.methods as any;
}

// ─── Build Create Course Instruction ─────────────────────────────────

/**
 * Builds a `create_course` instruction.
 *
 * @param program  Anchor program instance (with connected wallet provider)
 * @param input    Course creation parameters
 * @param authority Config authority public key (must sign the tx)
 * @returns The transaction instruction to add to a Transaction
 */
export async function buildCreateCourseIx(
    program: Program,
    input: CreateCourseInput,
    authority: PublicKey
) {
    const [coursePda] = deriveCoursePda(input.courseId);
    const [configPda] = deriveConfigPda();

    return methods(program)
        .createCourse({
            courseId: input.courseId,
            creator: input.creator,
            contentTxId: input.contentTxId,
            lessonCount: input.lessonCount,
            difficulty: input.difficulty,
            xpPerLesson: input.xpPerLesson,
            trackId: input.trackId,
            trackLevel: input.trackLevel,
            prerequisite: input.prerequisite,
            creatorRewardXp: input.creatorRewardXp,
            minCompletionsForReward: input.minCompletionsForReward,
        })
        .accounts({
            course: coursePda,
            config: configPda,
            authority,
            systemProgram: SystemProgram.programId,
        })
        .instruction();
}

// ─── Build Update Course Instruction ─────────────────────────────────

/**
 * Builds an `update_course` instruction.
 *
 * @param program  Anchor program instance
 * @param input    Fields to update (all optional except courseId for PDA derivation)
 * @param authority Config authority public key (must sign the tx)
 * @returns The transaction instruction
 */
export async function buildUpdateCourseIx(
    program: Program,
    input: UpdateCourseInput,
    authority: PublicKey
) {
    const [coursePda] = deriveCoursePda(input.courseId);
    const [configPda] = deriveConfigPda();

    return methods(program)
        .updateCourse({
            newContentTxId: input.newContentTxId ?? null,
            newIsActive: input.newIsActive ?? null,
            newXpPerLesson: input.newXpPerLesson ?? null,
            newCreatorRewardXp: input.newCreatorRewardXp ?? null,
            newMinCompletionsForReward: input.newMinCompletionsForReward ?? null,
        })
        .accounts({
            config: configPda,
            course: coursePda,
            authority,
        })
        .instruction();
}
