/**
 * PDA derivation utilities for Superteam Academy on-chain program.
 *
 * Each function derives a Program Derived Address (PDA) using the
 * canonical seeds defined in the on-chain program specification.
 */
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';

/** Derives the global Config PDA: seeds = ["config"] */
export function deriveConfigPda(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        programId
    );
}

/** Derives a Course PDA: seeds = ["course", courseId] */
export function deriveCoursePda(
    courseId: string,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('course'), Buffer.from(courseId)],
        programId
    );
}

/** Derives an Enrollment PDA: seeds = ["enrollment", courseId, learner] */
export function deriveEnrollmentPda(
    courseId: string,
    learner: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
        programId
    );
}

/** Derives a MinterRole PDA: seeds = ["minter", minter] */
export function deriveMinterRolePda(
    minter: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('minter'), minter.toBuffer()],
        programId
    );
}

/** Derives an AchievementType PDA: seeds = ["achievement", achievementId] */
export function deriveAchievementTypePda(
    achievementId: string,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('achievement'), Buffer.from(achievementId)],
        programId
    );
}

/** Derives an AchievementReceipt PDA: seeds = ["achievement_receipt", achievementId, recipient] */
export function deriveAchievementReceiptPda(
    achievementId: string,
    recipient: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('achievement_receipt'), Buffer.from(achievementId), recipient.toBuffer()],
        programId
    );
}
